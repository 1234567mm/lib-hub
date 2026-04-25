---
id: 07-wsl-clash-ccswitch-guide
title: WSL Clash CCSwitch 使用指南
sidebar_label: WSL Clash CCSwitch 使用指南
---

# WSL2-Clash-CCSwitch 使用指南

> 适用环境：Windows 11 + WSL2 (Ubuntu) + Clash Verge + Claude Code 2.x
>
> 核心目标：WSL2 稳定走代理访问外网，使用 cc-switch 统一管理 API 供应商（MiniMax、官方等），实现一键切换模型。

---

## 一、整体架构

```
Claude Code（WSL2 内运行）
    │
    ├── 读取配置 ──→ ~/.claude/settings.json（由 cc-switch 统一管理写入）
    │
    ├── 访问外网 ──→ Clash Verge 代理 ──→ 海外节点
    │
    └── 访问国内 API ──→ 直连（minimaxi.com 不走代理）
```

**为什么用 cc-switch？**

手动编辑 `settings.json` 来切换 API 供应商容易出错（key 截断、格式错误、多余字符等都是实际踩过的坑）。cc-switch 是专门为 Claude Code / Codex / Gemini CLI 设计的 GUI 配置管理工具，一键切换供应商，无需手动改配置文件。

---

## 二、前置准备

- Windows 11，WSL2 已安装（Ubuntu 22.04 推荐）
- [Clash Verge](https://github.com/clash-verge-rev/clash-verge-rev) 已安装，有可用订阅节点
- MiniMax 账号及 API Key（在 [platform.minimaxi.com](https://platform.minimaxi.com) 获取）
- Node.js 18+（安装 Claude Code 需要）

---

## 三、Clash Verge 配置

### 3.1 基础设置确认

打开 Clash Verge → **Settings**，确认以下选项：

| 设置项 | 状态 |
|--------|------|
| Tun Mode | ✅ 开启（推荐，最彻底） |
| Allow LAN(设置-局域网连接) | ✅ 开启 |
| Port Config | `7897`（记住此端口） |

> TUN 模式让 Clash 接管系统所有网络流量，包括 WSL2 的虚拟网卡，是解决 WSL 代理最彻底的方案。

### 3.2 配置分流规则

Clash Verge → **Profiles** → 右键当前订阅 → **Edit Merge（全局扩展配置）**，写入：

```yaml
rules:
  - DOMAIN-SUFFIX,minimaxi.com,DIRECT
  - DOMAIN-SUFFIX,anthropic.com,PROXY
  - DOMAIN-SUFFIX,statsig.com,PROXY
  - DOMAIN-SUFFIX,sentry.io,PROXY
  - DOMAIN-SUFFIX,launchdarkly.com,PROXY
```

保存后点击**重载配置**。

**为什么这样分流：**

- `minimaxi.com` → 国内服务走直连，避免绕海外节点增加延迟
- `statsig.com`、`sentry.io` 等 → 走代理，避免 Claude Code 启动时等待这些域名超时（不配这个会导致每次启动等待 2～3 分钟）
- 如果用其他国内模型，代理按照上边修改配置
---

## 四、WSL2 网络配置

### 4.1 配置 `.wslconfig`

在 Windows 用户目录（`C:\Users\你的用户名\`）新建或编辑 `.wslconfig`：

```ini
[wsl2]
dnsTunneling=true
firewall=true
autoProxy=true
```

> ⚠️ **不要加 `networkingMode=mirrored`**：该模式在部分 Windows 版本上会报错 `CreateInstance/CreateVm/ConfigureNetworking/0x8007054f`，WSL 网络会回退到 None 模式，反而完全无法联网。

### 4.2 重启 WSL

```powershell
wsl --shutdown
wsl
```

### 4.3 配置代理环境变量

编辑 `~/.bashrc`：

```bash
nano ~/.bashrc
```

在末尾加入以下内容：

```bash
# ========== WSL 代理配置 ==========
# 取第一个 nameserver 作为 WSL 网关 IP
# 注意：必须用 NR==1 只取第一行，否则多行 nameserver 会导致变量值异常
export hostip=$(cat /etc/resolv.conf | grep nameserver | awk 'NR==1{print $2}')
proxy_port=7897  # 与 Clash Verge 端口一致

set_proxy() {
    export http_proxy="http://$hostip:$proxy_port"
    export https_proxy="http://$hostip:$proxy_port"
    export all_proxy=socks5://$hostip:$proxy_port
    # 国内服务走直连，不经过代理
    export no_proxy=localhost,127.0.0.1,::1,minimaxi.com,api.minimaxi.com
}

# 自动检测 Clash 是否在运行
if timeout 0.5s bash -c "</dev/tcp/$hostip/$proxy_port" &>/dev/null; then
    set_proxy
    echo "代理已开启: $http_proxy"
else
    echo "未检测到代理，处于直连模式"
fi
# ====================================

export PATH=~/.npm-global/bin:$PATH
export PATH="$HOME/.local/bin:$PATH"
```

```bash
#重启连接
source ~/.bashrc
```

### 4.4 验证代理生效

```bash
# 应显示代理节点所在地（如东京）
curl -s https://ipinfo.io | grep -E '"ip"|"city"|"country"'

# 应显示国内 IP（直连验证）
curl -x "" -s https://ipinfo.io/ip
```

**常见坑：`hostip` 取到了错误的 IP**

```bash
echo $hostip
# 如果输出类似 "223.5.5.5 8.8.8.8"（两个 IP），说明 resolv.conf 有多行 nameserver
# awk 'NR==1{print $2}' 只取第一行可以修复这个问题

# 如果 resolv.conf 里只有 DNS（223.5.5.5、8.8.8.8），没有 172.x 的网关
# 说明 mirrored 模式曾经开启过，去掉 .wslconfig 里的 networkingMode=mirrored 重启 WSL
```

---

## 五、安装 Claude Code

### 5.1 为什么不用官方 `install.sh`

官方命令 `curl https://claude.ai/install.sh | bash` 会被 **Cloudflare Bot Management 拦截**：

- `claude.ai/install.sh` 返回 302，跳转到 `downloads.claude.ai/claude-code-releases/bootstrap.sh`
- Cloudflare 通过 **TLS 指纹（JA3）** 识别 curl，改 User-Agent 无效
- 最终 curl 拿到的是 CF 验证页 HTML，不是脚本内容

**解决方案：用 npm 安装**，npm 走 `registry.npmjs.org`，不经过 Cloudflare。

### 5.2 安装步骤

```bash
# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # 应显示 v20.x

# 配置 npm 全局目录（避免权限问题）
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc

# 安装 Claude Code
npm install -g @anthropic-ai/claude-code

# 验证
claude --version
```

---

## 六、安装 cc-switch

### 6.1 cc-switch 是什么

[cc-switch](https://github.com/farion1231/cc-switch) 是基于 Tauri 的跨平台桌面工具，专为 Claude Code / Codex / Gemini CLI 设计，核心功能：

- **一键切换 API 供应商**（MiniMax、官方、第三方中转等）
- 自动写入 `~/.claude/settings.json`，无需手动编辑
- 内置延迟测速，判断哪个节点最快
- 原生支持 WSL 环境

### 6.2 Linux 安装

从 [GitHub Releases](https://github.com/farion1231/cc-switch/releases) 下载对应格式：

```bash
#ubuntu命令行打开之后，进入work目录
cd ~/workspace
# 下载Ubuntu/Debian 用 .deb（推荐）
wget https://github.com/farion1231/cc-switch/releases/latest/download/CC-Switch-v3.14.1-Linux-x86_64.deb
#先更新索引
sudo apt update
#安装cc-switch
sudo apt install ./CC-Switch-v3.14.1-Linux-x86_64.deb
#删除安装包
rm CC-Switch-v3.14.1-Linux-x86_64.deb
```

> 在 WSL2 里运行图形应用，需要 WSLg 支持（Windows 11 默认已支持）。

Windows 版下载：`CC-Switch-vX.X.X-Windows.msi`

---

## 七、通过 cc-switch 配置 MiniMax
>*安装好CC-Switch之后，在命令行使用`cc-switch`命令就可运行软件*
### 7.1 添加 MiniMax 供应商

1. 打开 cc-switch → 点击 **"Add Provider"**
2. 选择预设：**MiniMax**
3. 填入你的 MiniMax API Key（在 [platform.minimaxi.com](https://platform.minimaxi.com) → API Keys 获取）
4. 模型名称全部改为 `MiniMax-M2.7`
5. 点击 **"添加"**

### 7.2 启用配置

回到首页，找到刚添加的 MiniMax 供应商，点击 **"启用"**。

cc-switch 会自动写入 `~/.claude/settings.json`，内容如下：

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.minimaxi.com/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "你的MiniMax-API-Key",
    "API_TIMEOUT_MS": "3000000",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    "ANTHROPIC_MODEL": "MiniMax-M2.7",
    "ANTHROPIC_SMALL_FAST_MODEL": "MiniMax-M2.7",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "MiniMax-M2.7",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "MiniMax-M2.7",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "MiniMax-M2.7"
  }
}
```

### 7.3 配置 `~/.claude.json`

cc-switch 不会自动写这个文件，需要手动加一个字段跳过新手引导：

```bash
nano ~/.claude.json
```

在 JSON 中加入：

```json
{
  "hasCompletedOnboarding": true,
  ...其他字段保持不变...
}
```

### 7.4 重要：清除冲突的环境变量

如果 `~/.bashrc` 里曾经手动设置过以下变量，**必须删除**，否则环境变量会覆盖 cc-switch 写入的配置文件：

```bash
grep -n "ANTHROPIC\|MINIMAX_API_KEY" ~/.bashrc
```

如果有输出，用 `nano ~/.bashrc` 删掉这些行，然后 `source ~/.bashrc`。

---

## 八、验证完整流程

### 8.1 验证 MiniMax API 直连

```bash
export MINIMAX_API_KEY="你的key"

time curl -s https://api.minimaxi.com/v1/text/chatcompletion_v2 \
  -H "Authorization: Bearer $MINIMAX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"MiniMax-M2.7","messages":[{"role":"user","content":"你好，回复一个字"}]}'
```

耗时应 < 1s，说明走了直连。返回包含 `choices` 字段的 JSON 说明 API 通了。

### 8.2 启动 Claude Code

```bash
# 非交互模式快速验证
claude -p "回复两个字"

# 正常使用
cd ~/your-project
claude
```

在 Claude Code 内输入 `/status`，确认显示：

```
Auth token:          ANTHROPIC_AUTH_TOKEN
Anthropic base URL:  https://api.minimaxi.com/anthropic
Proxy:               http://172.x.x.x:7897
Model:               MiniMax-M2.7
```

---

## 九、Hermes 与 cc-switch 联动配置

> Hermes 目前没有原生支持 cc-switch 的集成，以下为手动配置方案。

### 9.1 背景

Hermes 是基于本地 Ollama 或在线 API 的 AI 助手工具，通过 `~/.bashrc` 中的 alias 区分本地和在线模式：

```bash
alias hermes-local='hermes chat --profile local'   # 本地 Ollama
alias hermes-online='hermes chat'                  # 在线 API
```

cc-switch 管理的是 Claude Code 的配置文件，不直接影响 Hermes 的配置。

### 9.2 方案：让 Hermes online 模式也走 MiniMax

如果 Hermes 支持通过环境变量指定 API 端点，可以在 `~/.bashrc` 里为 Hermes 单独设置：

```bash
# Hermes 使用 MiniMax API（与 cc-switch 管理的 Claude Code 配置独立）
alias hermes-minimax='OPENAI_BASE_URL=https://api.minimaxi.com/v1 \
  OPENAI_API_KEY=$MINIMAX_API_KEY \
  hermes chat --model MiniMax-M2.7'
```

### 9.3 方案：通过脚本同步当前激活的供应商

cc-switch 激活供应商后会写入 `~/.claude/settings.json`，可以写一个脚本读取当前配置，导出为 Hermes 需要的环境变量：

```bash
# 读取 cc-switch 当前激活的配置，同步给 Hermes
sync_hermes_from_ccswitch() {
    local base_url=$(python3 -c "
import json
with open('$HOME/.claude/settings.json') as f:
    d = json.load(f)
print(d.get('env', {}).get('ANTHROPIC_BASE_URL', ''))
")
    local auth_token=$(python3 -c "
import json
with open('$HOME/.claude/settings.json') as f:
    d = json.load(f)
print(d.get('env', {}).get('ANTHROPIC_AUTH_TOKEN', ''))
")
    export HERMES_API_BASE="$base_url"
    export HERMES_API_KEY="$auth_token"
    echo "Hermes 已同步配置: $base_url"
}

alias hermes-sync='sync_hermes_from_ccswitch && hermes chat'
```

> 注意：此方案依赖 Hermes 是否接受 `HERMES_API_BASE` 这类环境变量，具体变量名需查阅 Hermes 文档或源码。

### 9.4 cc-switch 切换时自动通知 Hermes

目前 cc-switch 没有 hook 机制，如果需要切换供应商后自动同步 Hermes，可以写一个 watch 脚本监听配置文件变化：

```bash
# 监听 cc-switch 配置变化，自动同步（需要 inotifywait）
sudo apt-get install inotify-tools

watch_ccswitch() {
    echo "开始监听 cc-switch 配置变化..."
    inotifywait -m -e modify ~/.claude/settings.json |
    while read; do
        echo "配置已更新，重新同步 Hermes..."
        sync_hermes_from_ccswitch
    done
}
```

---

## 十、常见问题

### 问题 1：`未检测到代理，处于直连模式`

```bash
# 检查 hostip 是否正确
echo $hostip

# 检查 Clash 是否在 Windows 侧运行
# 检查 Allow LAN 是否开启
# 检查端口是否匹配
nc -zv $hostip 7897
```

### 问题 2：Claude Code 启动非常慢（2～3 分钟）

原因：启动时连接 `statsig.com`、`sentry.io` 等域名超时。

解决：
1. Clash 规则里把这些域名设为 PROXY（见第三节）
2. 确认 `settings.json` 里 `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` 值为字符串 `"1"`，不是数字 `1`

### 问题 3：401 认证失败

排查顺序：

```bash
# 1. 确认环境变量没有覆盖配置文件
echo $ANTHROPIC_AUTH_TOKEN  # 应为空

# 2. 检查 key 末尾是否有多余字符（用 nano 粘贴时常见）
cat -A ~/.claude/settings.json | grep AUTH
# 正常末尾是 ",$，不能有 > 或其他字符

# 3. 直接测试 key 是否有效
curl -s -o /dev/null -w "%{http_code}\n" \
  https://api.minimaxi.com/v1/text/chatcompletion_v2 \
  -H "Authorization: Bearer 你的key" \
  -H "Content-Type: application/json" \
  -d '{"model":"MiniMax-M2.7","messages":[{"role":"user","content":"hi"}]}'
# 200 说明 key 有效，401 说明 key 有问题
```

### 问题 4：`curl https://claude.ai/install.sh` 返回 HTML

这是 Cloudflare Bot 检测，无法通过改 User-Agent 或代理解决，TLS 指纹会暴露 curl 身份。改用 npm 安装，见第五节。

### 问题 5：WSL 报错 `0x8007054f`

删除 `.wslconfig` 中的 `networkingMode=mirrored`，重启 WSL。

### 问题 6：cc-switch 在 WSL 无图形界面环境

把 cc-switch 安装在 **Windows 侧**，它支持识别 WSL 环境并写入 WSL 内的配置路径。

---

## 十一、网络流量走向总结

```
WSL2 内的请求
    │
    ├── api.minimaxi.com     ──→  直连（国内，< 500ms）
    │
    ├── npmjs.org            ──→  Clash 代理 ──→ 海外节点
    ├── anthropic.com        ──→  Clash 代理 ──→ 海外节点
    ├── statsig.com          ──→  Clash 代理 ──→ 海外节点
    │
    └── localhost/127.0.0.1  ──→  直连（Ollama 等本地服务）
```

---

## 十二、参考资料

- [cc-switch GitHub](https://github.com/farion1231/cc-switch)
- [MiniMax 官方 Claude Code 配置文档](https://platform.minimaxi.com/docs/token-plan/claude-code)
- [Claude Code 官方文档](https://docs.claude.com/en/docs/claude-code/setup)
- [Clash Verge Rev](https://github.com/clash-verge-rev/clash-verge-rev)

