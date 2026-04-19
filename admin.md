# Claude Code Skills & MCP 工具汇总

> 本文档整理自本地内置 skills 和项目配置，持续更新。

---

## 一、内置 Skills（Claude Code 命令）

| 技能名称 | 功能描述 |
|---------|---------|
| `simplify` | 审查变更代码，检测可复用性、质量和效率问题并修复 |
| `loop` | 设置周期性任务，定时执行 prompt 或 slash 命令（默认 10 分钟间隔） |
| `chinese-code-review` | 中文代码审查规范——专业严谨，符合国内团队文化 |
| `chinese-commit-conventions` | 中文 Git 提交规范，适配 changelog 自动化 |
| `chinese-documentation` | 中文技术文档写作规范，排版、术语、结构一步到位 |
| `chinese-git-workflow` | 适配国内 Git 平台和团队习惯的工作流规范（Gitee、Coding、极狐 GitLab） |
| `dispatching-parallel-agents` | 当有 2 个以上独立任务可并行执行时使用 |
| `doc` | 读取、创建、编辑 `.docx` 文档，格式化保真度高 |
| `doc-coauthoring` | 引导用户协作写作文档、提案、技术规格书等结构化内容 |
| `executing-plans` | 在单独会话中执行设有审查检查点的书面实现计划 |
| `finishing-a-development-branch` | 实现完成、测试通过后，引导合并/PR/清理等结构化收尾 |
| `mcp-builder` | 系统化构建生产级 MCP 工具，让 AI 助手连接外部能力 |
| `microsoft-foundry` | 部署、评估和管理 Foundry agents（Docker build、ACR push、container start 等） |
| `pdf` | 读取、创建、审查 PDF 文件，布局渲染和视觉检查 |
| `playwright` | 自动化真机浏览器操作（导航、表单填写、截图、数据提取等） |
| `receiving-code-review` | 收到代码审查反馈后、实施建议前使用，技术严谨性验证 |
| `requesting-code-review` | 完成任务、实现重要功能或合并前使用，验证是否符合要求 |
| `sora` | 生成、编辑、扩展 Sora 视频，创建角色引用，本地多视频队列 |
| `spreadsheet` | 创建、编辑、分析、格式化电子表格（`.xlsx`, `.csv`, `.tsv`） |
| `subagent-driven-development` | 在当前会话中执行包含独立任务的实现计划 |
| `systematic-debugging` | 遇到 bug、测试失败或异常行为时使用，深层根因分析 |
| `test-driven-development` | 实现功能或修复 bug 前使用，先写测试再写实现 |
| `ui-ux-pro-max` | UI/UX 设计智能工具（67 种风格、96 种配色、57 种字体配对） |
| `using-git-worktrees` | 创建隔离 git worktree 进行功能开发或执行实现计划 |
| `using-superpowers` | 在对话开始时使用，确立如何查找和使用技能 |
| `verification-before-completion` | 宣称工作完成前必须运行验证命令并确认输出 |
| `writing-plans` | 有规格说明或需求用于多步骤任务时，在动手写代码前使用 |
| `writing-skills` | 创建新技能、编辑现有技能或部署前验证技能是否有效 |
| `commit` | Claude Command：提交更改 |
| `claude-mem:make-plan` | 创建分阶段实现计划，含文档发现 |
| `claude-mem:mem-search` | 搜索 claude-mem 跨会话持久化记忆数据库 |
| `claude-mem:smart-explore` | 使用 tree-sitter AST 解析进行 token 优化的结构化代码搜索 |
| `claude-mem:do` | 执行分阶段实现计划（使用 subagent） |
| `claude-mem:version-bump` | 自动化语义化版本和发布工作流，处理版本递增、git tagging、GitHub releases |

---

## 二、项目 Skills

### migrate-obsidian-docs

**路径**: `.claude/skills/migrate-obsidian-docs/`

**功能**: 将 Obsidian 风格的笔记文档迁移至 Docusaurus 项目，自动完成格式规范化与侧边栏接入。

**核心能力**:
- 自动检测新增 `.md` 文件
- 处理文件名特殊字符（括号等导致 Docusaurus 无法识别）
- 修复 MDX 编译错误（LaTeX 公式中的括号问题）
- 自动添加 frontmatter（title, authors, tags, date, slug）
- 同步侧边栏配置（sidebars.js）
- 更新笔记间交叉链接（上篇/下篇）

**触发场景**:
- 新增笔记文档需在网页正确显示
- 删除本地笔记文件需同步 sidebar
- 重命名/移动笔记文件
- 文件名含特殊字符导致网页无法显示
- MDX 编译错误

---

## 三、MCP 工具（Model Context Protocol）

### 3.1 claude-mem 记忆管理

| 工具名称 | 功能描述 |
|---------|---------|
| `mcp__plugin_claude-mem_mcp-search__search` | 搜索记忆数据库，返回索引结果 |
| `mcp__plugin_claude-mem_mcp-search__timeline` | 获取结果周围的上下文（锚定搜索） |
| `mcp__plugin_claude-mem_mcp-search__get_observations` | 获取指定 ID 的完整记忆详情 |
| `mcp__plugin_claude-mem_mcp-search__smart_outline` | 获取文件结构大纲（函数、类、方法签名） |
| `mcp__plugin_claude-mem_mcp-search__smart_search` | 使用 tree-sitter AST 解析搜索符号、函数、类 |
| `mcp__plugin_claude-mem_mcp-search__smart_unfold` | 展开特定符号的完整源代码 |

### 3.2 其他 MCP 工具

| 工具名称 | 功能描述 |
|---------|---------|
| `CronCreate` | 创建定时任务（一次性或周期性 cron） |
| `CronDelete` | 删除已创建的定时任务 |
| `CronList` | 列出所有定时任务 |
| `EnterPlanMode` | 进入计划模式，设计实现方案 |
| `ExitPlanMode` | 退出计划模式，准备实施 |
| `ExitWorktree` | 退出 git worktree 工作树会话 |
| `EnterWorktree` | 创建隔离的 git worktree 并切换 |
| `Agent` | 启动通用或专用子代理处理复杂任务 |
| `TaskStop` | 停止运行中的后台任务 |
| `TaskOutput` | 获取后台任务输出 |

---

## 四、项目权限配置

### settings.json

```json
{
  "permissions": {
    "allow": [
      "WebSearch",
      "Edit(/.claude/skills/migrate-obsidian-docs/**)",
      "Bash(grep -rn \"\\\\.\\\\./img\\\\|/img/\" docs/stm32/*.md)",
      "Bash(xargs grep:*)",
      "..."
    ]
  }
}
```

### settings.local.json

```json
{
  "permissions": {
    "allow": [
      "WebFetch(domain:minimax-algeng-chat-tts.oss-cn-wulanchabu.aliyuncs.com)",
      "Bash(rm -rf .docusaurus)",
      "Bash(npm run:*)",
      "..."
    ]
  }
}
```

---

## 五、使用建议

1. **日常文档迁移**：使用 `migrate-obsidian-docs` skill 处理笔记文档
2. **跨会话记忆**：使用 `claude-mem` MCP 工具搜索和利用历史上下文
3. **代码审查**：优先使用 `chinese-code-review` 保持团队风格一致
4. **复杂任务**：使用 `subagent-driven-development` 或 `EnterPlanMode` 分解任务
5. **定时任务**：使用 `CronCreate` 设置周期性提醒或检查

---

*最后更新: 2026-04-10*
