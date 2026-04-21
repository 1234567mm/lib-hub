---
id: 05-hermes-skills-reference
title: Hermes Skills 参考指南
sidebar_label: Hermes Skills 参考指南
---

# Hermes Agent — Skills 快速查询手册

> 72 个已安装 skill 的分类速查，按使用场景组织。

---

## 🗂️ 目录

- [Hermes Agent — Skills 快速查询手册](#hermes-agent--skills-快速查询手册)
  - [🗂️ 目录](#️-目录)
  - [会话与工作流管理](#会话与工作流管理)
  - [编码与开发](#编码与开发)
  - [AI / ML 模型与训练](#ai--ml-模型与训练)
  - [文件与文档处理](#文件与文档处理)
  - [图像与视觉](#图像与视觉)
  - [音频与音乐](#音频与音乐)
  - [视频与动画](#视频与动画)
  - [数据与研究](#数据与研究)
  - [GitHub 工作流](#github-工作流)
  - [第三方服务集成](#第三方服务集成)
  - [创意与生成](#创意与生成)
  - [系统与基础设施](#系统与基础设施)
  - [LLM 高级操作](#llm-高级操作)
  - [Hermes 自身管理](#hermes-自身管理)
  - [📋 常用命令速记](#-常用命令速记)

---

## 会话与工作流管理

| 命令                             | 用途                                   |
| ------------------------------ | ------------------------------------ |
| `/plan`                        | 仅规划模式，将计划写入 `.hermes/plans/`，不执行任何操作 |
| `/writing-plans`               | 根据需求生成带完整代码示例的多步骤实施计划                |
| `/subagent-driven-development` | 将实施计划拆分为独立任务并分发给子 agent 并行执行         |
| `/background` / `/bg`          | 后台执行 prompt，不打断当前会话                  |

---

## 编码与开发

| 命令                         | 用途                                       |
| -------------------------- | ---------------------------------------- |
| `/claude-code`             | 委托 Claude Code CLI 执行编码任务（构建功能、重构、PR 审查） |
| `/codex`                   | 委托 OpenAI Codex CLI 执行编码任务，需要 git 仓库     |
| `/opencode`                | 委托 OpenCode CLI agent 执行长时间自主编码会话        |
| `/test-driven-development` | 强制执行 RED-GREEN-REFACTOR 循环，测试优先          |
| `/systematic-debugging`    | 四阶段根因调查，**禁止在理解问题前修复**                   |
| `/requesting-code-review`  | 提交前验证流水线：安全扫描、质量门控、自动修复                  |
| `/codebase-inspection`     | 统计代码行数、语言组成、代码注释比例                       |
| `/github-code-review`      | 分析 git diff、在 PR 上留内联评论                  |

---

## AI / ML 模型与训练

| 命令 | 用途 |
|------|------|
| `/axolotl` | 用 Axolotl 微调 LLM（YAML 配置、LoRA/QLoRA、DPO/GRPO） |
| `/peft-fine-tuning` | 参数高效微调：LoRA、QLoRA，25+ 方法，低显存 |
| `/unsloth` | 快速微调：速度提升 2–5×，显存减少 50–80% |
| `/fine-tuning-with-trl` | 用 TRL 做 RLHF：SFT、DPO、PPO/GRPO、奖励模型 |
| `/serving-llms-vllm` | 用 vLLM 部署高吞吐 LLM API（PagedAttention，OpenAI 兼容） |
| `/llama-cpp` | CPU/Apple Silicon/GPU 本地推理 + GGUF 量化（2–8 bit） |
| `/modal-serverless-gpu` | 无服务器 GPU 云平台，按需 GPU，自动扩缩容 |
| `/pytorch-fsdp` | PyTorch FSDP 分布式训练（参数分片、混合精度） |
| `/dspy` | 声明式 LM 编程，自动优化 prompt，构建模块化 RAG |
| `/outlines` | 结构化生成：保证输出合法 JSON/XML/代码，Pydantic 类型安全 |
| `/evaluating-llms-harness` | 60+ 学术基准评测（MMLU、HumanEval、GSM8K 等） |
| `/weights-and-biases` | 实验追踪、超参优化、模型注册（W&B MLOps） |
| `/clip` | OpenAI CLIP：零样本图像分类、图文匹配、跨模态检索 |
| `/segment-anything-model` | SAM 基础模型：零样本图像分割（点/框/掩码提示） |
| `/jupyter-live-kernel` | 通过 hamelnb 使用有状态 Jupyter 内核迭代执行 Python |

---

## 文件与文档处理

| 命令 | 用途 |
|------|------|
| `/ocr-and-documents` | 从 PDF/扫描件提取文本（pymupdf、marker-pdf OCR、DOCX/PPTX） |
| `/nano-pdf` | 用自然语言指令编辑 PDF 文本内容 |
| `/powerpoint` | 创建/读取/编辑 .pptx 文件 |

---

## 图像与视觉

| 命令 | 用途 |
|------|------|
| `/stable-diffusion-image-generation` | 文生图（SD + HuggingFace Diffusers）、图生图、inpainting |
| `/architecture-diagram` | 生成暗色系软件架构/云基础设施 SVG 图（语义配色） |
| `/excalidraw` | 生成手绘风格架构图、流程图（.excalidraw 格式） |
| `/p5js` | p5.js 创意编程：生成艺术、数据可视化、WebGL 3D 场景 |
| `/ascii-art` | 生成 ASCII 艺术（571 字体，cowsay，图像转 ASCII） |
| `/gif-search` | 用 curl 从 Tenor 搜索下载 GIF |

---

## 音频与音乐

| 命令 | 用途 |
|------|------|
| `/audiocraft-audio-generation` | 文生音乐（MusicGen）/ 文生音效（AudioGen） |
| `/heartmula` | 开源音乐生成（Suno-like），支持多语言歌词 |
| `/whisper` | 语音识别/转录/翻译，99 种语言，6 种模型大小 |
| `/songsee` | 生成声谱图和音频特征可视化（mel、MFCC、chroma） |
| `/songwriting-and-ai-music` | 词曲创作技巧 + Suno AI 音乐生成提示指南 |

---

## 视频与动画

| 命令 | 用途 |
|------|------|
| `/manim-video` | 用 Manim 制作数学/技术动画视频（3Blue1Brown 风格） |
| `/ascii-video` | ASCII 艺术视频生成（视频转 ASCII、音频可视化、GIF/MP4） |

---

## 数据与研究

| 命令 | 用途 |
|------|------|
| `/arxiv` | 搜索 arXiv 学术论文（关键词/作者/分类/ID，无需 API key） |
| `/research-paper-writing` | 端到端 ML/AI 论文写作（NeurIPS/ICML/ICLR 等顶会流程） |
| `/polymarket` | 查询 Polymarket 预测市场数据（价格、订单簿、历史） |
| `/llm-wiki` | 构建和维护持久化 Markdown 知识库（Karpathy 风格） |

---

## GitHub 工作流

| 命令 | 用途 |
|------|------|
| `/github-auth` | 配置 GitHub 认证（HTTPS token、SSH、gh CLI） |
| `/github-issues` | 创建/管理/分类/关闭 GitHub Issues |
| `/github-pr-workflow` | PR 完整生命周期：创建分支 → 提交 → 开 PR → 合并 |
| `/github-repo-management` | 克隆/创建/fork/配置仓库，管理 secrets、releases、workflows |

---

## 第三方服务集成

| 命令 | 用途 |
|------|------|
| `/google-workspace` | Gmail、Calendar、Drive、Contacts、Sheets、Docs 集成 |
| `/notion` | Notion API：创建/管理页面、数据库、块（curl，无依赖） |
| `/linear` | Linear 项目管理：Issues、Projects、Teams（GraphQL API） |
| `/obsidian` | 读取/搜索/创建 Obsidian 笔记 |
| `/himalaya` | 命令行邮件客户端（IMAP/SMTP，多账户） |
| `/xitter` | X/Twitter CLI：发推、阅读时间线、搜索、点赞、转推 |
| `/openhue` | 控制 Philips Hue 灯光（开关/亮度/颜色/场景） |
| `/blogwatcher` | 监控博客和 RSS/Atom 订阅源的更新 |
| `/find-nearby` | 用 OpenStreetMap 查找附近地点（无需 API key） |

---

## 创意与生成

| 命令 | 用途 |
|------|------|
| `/ideation` | 根据创意约束生成项目想法（"我想做点东西"触发） |
| `/popular-web-designs` | 54 个真实网站设计系统模板（Stripe/Linear/Vercel 等风格） |
| `/minecraft-modpack-server` | 搭建模组 Minecraft 服务器（NeoForge/Forge，JVM 调优） |
| `/pokemon-player` | 通过无头模拟器自主玩 Pokemon 游戏 |

---

## 系统与基础设施

| 命令 | 用途 |
|------|------|
| `/native-mcp` | 内置 MCP 客户端：连接外部 MCP 服务器，自动注册工具 |
| `/mcporter` | MCP 服务器/工具的列举、配置、认证和调用 CLI |
| `/webhook-subscriptions` | 创建和管理 webhook 订阅，实现事件驱动 agent 触发 |
| `/browser` | 通过 CDP 连接 Chrome 浏览器工具 |
| `/github-auth` | GitHub 认证配置（见 GitHub 工作流部分） |

---

## LLM 高级操作

| 命令 | 用途 |
|------|------|
| `/godmode` | 对 API LLM 进行 jailbreak（Parseltongue 混淆、GODMODE 模板） |
| `/obliteratus` | 用机制可解释性技术移除开源 LLM 的拒绝行为 |

---

## Hermes 自身管理

| 命令 | 用途 |
|------|------|
| `/hermes-agent` | Hermes Agent 完整使用和扩展指南（配置/故障排查/技能/语音） |
| `/skill-creator` | 创建/修改/测试/优化 skill |
| `/dogfood` | 对 Web 应用做系统性探索性 QA 测试，生成 bug 报告 |

---

## 📋 常用命令速记

```bash
# 会话管理
/new          # 新会话
/history      # 查看历史
/compress     # 压缩上下文
/rollback     # 文件系统回滚
/snapshot     # 状态快照

# 模型与配置
/model        # 切换模型
/provider     # 查看可用 provider
/reasoning    # 调整推理强度
/yolo         # 跳过危险命令确认

# 工具管理
/tools list   # 列出所有工具
/skills       # 搜索/安装/管理 skills
/reload-mcp   # 重载 MCP 服务器

# 实用工具
/btw          # 临时旁问（不记入历史）
/background   # 后台运行
/copy [n]     # 复制最近 n 条回复
/paste        # 粘贴剪贴板图片
```

---

*最后更新：2026.4.21    基于 Hermes 72 skills 版本*

