# Ollama 在 WSL2 中的安装与配置

---

## 1. 安装基础工具

确认身份为普通用户（`$` 结尾）再执行：

```bash
sudo apt update && sudo apt install -y curl unzip git
```

如果提示 `sudo: not found`，说明当前是 root 用户，去掉 `sudo`：

```bash
apt update && apt install -y curl unzip git
```

如果 apt 卡在 `0% [Connecting...]`，先修复 DNS（见 WSL2 安装文档第 5 步），再重试。

如果报 `Could not get lock`：

```bash
sudo rm /var/lib/dpkg/lock-frontends
sudo rm /var/lib/apt/lists/lock
sudo rm /var/lib/dpkg/lock
sudo apt update
```

---

## 2. 安装 uv（Python 包管理器）

```bash
curl -LsSf https://github.com/astral-sh/uv/releases/latest/download/uv-installer.sh | sh
```

配置环境变量：

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
#重启生效
source ~/.bashrc
```

验证：

```bash
uv --version
```

**这里如果安装失败，可自己去AI搜索修复Linux和Window网络连接问题，自主解决**

如果 curl 超时，改用物理搬运方式：在 Windows 浏览器下载 `uv-installer.sh`，保存到下载文件夹，再执行：

```bash
sh /mnt/c/Users/你的用户名/Downloads/uv-installer.sh
```

---

## 3. 安装 Ollama

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

安装成功标志：

```
>>> Install complete. Run "ollama" from the command line.
>>> The Ollama API is now available at 127.0.0.1:11434.
```

---

## 4. 开启 systemd（如果安装时提示 WARNING: systemd is not running）

```bash
sudo nano /etc/wsl.conf
```

确认文件包含（与 DNS 配置合并，不要重复写 key）：

```ini
[boot]
systemd=true

[network]
generateResolvConf = false

[user]
default = 你的用户名
```

保存后在 Windows PowerShell 执行：

```powershell
wsl --shutdown
```

重新进入 Ubuntu，使其生效。

---

## 5. 配置 Ollama 服务

### 5.1 设置开机不自启（按需启动）

```bash
sudo systemctl disable ollama
```

### 5.2 自定义模型存储路径

```bash
mkdir -p ~/ai_assets/ollama_models
sudo systemctl edit ollama.service
```

在编辑器中写入：

```ini
[Service]
Environment="OLLAMA_MODELS=/home/你的用户名/ai_assets/ollama_models"
Environment="OLLAMA_HOST=0.0.0.0"
Environment="OLLAMA_KEEP_ALIVE=5m"
Environment="OLLAMA_MAX_LOADED_MODELS=1"
Environment="OLLAMA_NUM_PARALLEL=1"
```

保存退出，重载配置：

```bash
sudo systemctl daemon-reload
```

---

## 6. 配置快捷启动指令

```bash
nano ~/.bashrc
```

在文件末尾添加：

```bash
# AI 服务快捷控制
alias start-ai='sudo systemctl start ollama && echo "Ollama 已启动"'
alias stop-ai='sudo systemctl stop ollama && echo "Ollama 已关闭"'
alias cd-kb='cd ~/knowledge_base'
alias cd-ws='cd ~/workspace'
```

- 这里在命令行输入start-ai，可开启ollma
- 工作完输入stop-ai，可关闭ollma

```bash
重启生效
source ~/.bashrc
```

---

## 7. 验证服务与 API

```bash
start-ai
sudo systemctl status ollama
curl http://127.0.0.1:11434
```

返回 `Ollama is running` 则正常。

---

## 8. 下载并测试本地模型

```bash
# 下载 Qwen2.5 7B（约 4.7GB）
ollama run qwen2.5:7b

# 退出对话
/exit

# 查看已下载模型
ollama list
```

---

## 9. 其他常用模型

| 模型             | 拉取命令                                | 适用场景           |
| :------------- | :---------------------------------- | :------------- |
| Qwen2.5 7B     | `ollama run qwen2.5:7b`             | 首选，中文+C语言综合能力强 |
| DeepSeek-Coder | `ollama run deepseek-coder-v2:lite` | 代码专项，复杂 Bug 分析 |
| Qwen2.5 1.5B   | `ollama run qwen2.5:1.5b`           | 无显卡时的轻量版       |

---

## 10. 常见报错速查

| 报错 | 解决方法 |
| :--- | :--- |
| `apt: not found` | 运行 `cat /etc/os-release` 确认是 Ubuntu |
| `sudo: not found` | 当前是 root，去掉 sudo 直接运行 |
| curl 超时 | 用 Windows 浏览器下载后物理搬运 |
| `systemd is not running` | 确认 `/etc/wsl.conf` 含 `systemd=true`，重启 WSL |
| `Connection refused` | Ollama 未启动，运行 `start-ai` |
| 权限错误 | `sudo chown -R $USER:$USER ~` |
