# Hermes Agent 安装与本地/云端模型联动

---

## 1. 前置检查

确认以下三项均已就绪：

```bash
curl --version
uv --version
ollama list
```

---

## 2. 安装 Hermes Agent

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

激活环境变量：

```bash
source ~/.bashrc
```

验证：

```bash
hermes --version
```

如果提示 `command not found`，手动添加 PATH：

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
hermes --version
```

---

## 3. 初始化配置

```bash
hermes setup
```

选择 **Quick setup**，依次填写：

| 配置项 | 填写内容 |
| :--- | :--- |
| Provider | `Ollama`（本地）或 `MiniMax`（云端） |
| Base URL | 本地填 `http://localhost:11434` |
| Model | 本地填 `qwen2.5:7b` |
| Messaging | 选 `Skip` |

---

## 4. 验证本地联动

确认 Ollama 已启动：

```bash
start-ai
hermes
```

在 Hermes 对话框中输入任意问题验证响应。

---

## 5. 修改模型或 API Key

**方法一：重新运行配置向导**

```bash
hermes setup
```

**方法二：直接编辑配置文件**

```bash
nano ~/.hermes-agent/config.toml
```

---

## 6. 配置本地/云端一键切换

```bash
nano ~/.bashrc
```

在末尾添加：

```bash
# 切换到本地模式
alias hermes-local='hermes setup'

# 切换到云端模式
alias hermes-cloud='hermes setup'
```

> 实际切换时运行 `hermes-local` 或 `hermes-cloud`，在交互界面选择对应 Provider 即可。

---

## 7. 本地 vs 云端场景分配

| 任务 | 使用模型 |
| :--- | :--- |
| 驱动编写、代码注释生成 | 本地 Ollama |
| 底层 Bug 调试、寄存器分析 | 本地 Ollama |
| 私密/涉密算法代码 | 本地 Ollama（断网可用） |
| 复杂架构设计、超长日志分析 | 云端 MiniMax |
| 技术文档翻译 | 云端 MiniMax |

---

## 8. 检查与维护

```bash
# 健康检查
hermes doctor

# 重新配置
hermes setup

# 卸载
rm -rf ~/.hermes-agent
```

---

## 9. GPU 加速验证(有NVIDIA显卡可配置)

```bash
nvidia-smi
```

能看到显卡型号则 GPU 穿透已开启，Ollama 会自动使用 GPU 加速。

在 Windows 任务管理器 → 性能 → GPU，观察运行 `ollama run` 时显存占用是否上升。

---

## 10. 常见报错速查

| 报错 | 解决方法 |
| :--- | :--- |
| `hermes: command not found` | `source ~/.bashrc` |
| `Connection refused` | `start-ai` 启动 Ollama |
| 响应极慢 | 换 `qwen2.5:1.5b` 轻量版 |
| 权限错误 | `sudo chown -R $USER:$USER ~` |
