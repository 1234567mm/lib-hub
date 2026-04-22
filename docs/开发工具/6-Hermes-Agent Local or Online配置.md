---
id: 6-Hermes-Agent-Local-or-Online配置
title: 6-Hermes-Agent Local or Online配置
sidebar_label: 6-Hermes-Agent Local or Online配置
---

# Hermes-Agent 本地模型（Qwen2.5:7B）与 Minimax 在线模型配置及切换操作指南

---

## 前置说明

Hermes 使用 `~/.hermes/config.yaml` 作为主配置文件，不支持 `--config` 参数指定配置文件，也不支持通过环境变量覆盖主模型。正确的多模型切换方式是使用 **Profile（配置档案）** 功能，每个 Profile 拥有独立的 `config.yaml`。

---

## 一、前置验证（确认环境就绪）

```bash
# 启动 Ollama 服务
start-ai

# 查看已安装模型，确认 qwen2.5:7b 存在
ollama list

# 验证 Ollama API 服务正常（出现包含模型信息的 JSON 即正常）
curl http://localhost:11434/api/tags

# 检查端口监听状态（显示 LISTEN 即正常）
netstat -tunlp | grep 11434
```

---

## 二、确认主配置文件（在线模型 Minimax）

Hermes 默认主配置文件位于 `~/.hermes/config.yaml`，顶部 model 部分应为 Minimax 配置：

```yaml
model:
  default: MiniMax-M2.7
  provider: minimax-cn
  base_url: https://api.minimaxi.com/anthropic
```

**这个文件不需要修改**，`hermes chat` 默认走此配置即为在线模型。

---

## 三、创建本地模型 Profile

### 1. 创建 local profile

```bash
hermes profile create local
```

成功后输出类似：

```
Profile 'local' created at /home/<用户名>/.hermes/profiles/local
Wrapper created: /home/<用户名>/.local/bin/local
```

### 2. 用主配置文件作为基础，覆盖 local profile 的配置

```bash
cp ~/.hermes/config.yaml ~/.hermes/profiles/local/config.yaml
```

### 3. 编辑 local profile 的配置文件，只修改顶部 model 部分

```bash
nano ~/.hermes/profiles/local/config.yaml
```

将文件顶部的 `model:` 块替换为：

```yaml
model:
  default: qwen2.5:7b
  provider: openai
  base_url: http://127.0.0.1:11434/v1
```

其余内容保持不变，保存退出（`Ctrl+O` → `Enter` → `Ctrl+X`）。

---

## 四、配置别名（快速切换）

> ⚠️ 注意：`local` 是 bash 保留关键字，不能直接用作命令，必须通过别名调用。

```bash
nano ~/.bashrc
```

添加以下内容：

```bash
alias hermes-local='hermes chat --profile local'
alias hermes-online='hermes chat'
```

使别名生效：

```bash
source ~/.bashrc
```

---

## 五、验证切换效果

### 启动本地模型

```bash
hermes-local
```

进入后输入 `/config`，确认以下字段：

```
Model:     qwen2.5:7b
Base URL:  http://127.0.0.1:11434/v1
Config File: ~/.hermes/profiles/local/config.yaml
```

### 启动在线模型

```bash
hermes-online
```

进入后输入 `/config`，确认以下字段：

```
Model:     MiniMax-M2.7
Base URL:  https://api.minimaxi.com/anthropic
Config File: ~/.hermes/config.yaml
```

---

## 六、常用辅助指令（Hermes 终端内）

| 指令 | 说明 |
|------|------|
| `/config` | 查看当前配置（含 Base URL、Model、Config File） |
| `/status` | 查看当前会话状态和活跃模型 |
| `/model` | 交互式切换模型（仅限已配置的 provider） |
| `/new` | 开启新会话，避免上下文混乱 |
| `/help` | 查看所有可用指令 |
| `/exit` | 退出 Hermes 终端 |

---

## 七、常见问题

**Q：API Key 显示 `Not set!`，会报错吗？**  
A：Ollama 本地运行不需要真实 API Key，一般不影响使用。如果遇到认证报错，在 `profiles/local/config.yaml` 的 model 块中加一行：
```yaml
model:
  default: qwen2.5:7b
  provider: openai
  base_url: http://127.0.0.1:11434/v1
  api_key: ollama
```

**Q：为什么不能用 `--config` 参数指定配置文件？**  
A：Hermes 不支持此参数，`hermes chat --config xxx` 会报 `unrecognized arguments` 错误。正确方式是使用 Profile。

**Q：为什么环境变量 `HERMES_MODEL` 不生效？**  
A：`HERMES_MODEL` 仅供 cron scheduler 使用，不覆盖交互式 chat 的主模型，必须通过 Profile 或直接修改 `config.yaml` 来切换。

**Q：`hermes-local` 报错 `local: can only be used in a function`？**  
A：`local` 是 bash 保留关键字，不能直接执行。必须通过 `alias hermes-local='hermes chat --profile local'` 的形式调用。


