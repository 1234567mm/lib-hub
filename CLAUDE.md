# lib-hub 博客项目

## 项目概述

| 项目 | 信息 |
|------|------|
| **名称** | 山药泥酸奶的技术窝 |
| **框架** | Docusaurus 3.7.0 |
| **类型** | 个人技术博客 |
| **主题** | 嵌入式开发、智能硬件 |
| **部署** | GitHub Pages |
| **URL** | https://1234567mm.github.io/lib-hub/ |

## 目录结构

```
lib-hub/
├── docs/              # 主要内容 (STM32/ESP32/Sharing/Team/Industry)
├── blog/             # 博客文章 (已清空，保留 authors.yml)
├── src/              # React 组件
├── static/           # 静态资源 (img/)
├── build/            # 构建输出
├── .claude/          # Claude Code 配置
│   ├── settings.json  # 权限和 hooks 配置
│   ├── skills/        # Skills (已完善)
│   └── agents/       # Subagents
└── .github/          # GitHub Actions
```

## 常用命令

```bash
npm run start    # 本地预览
npm run build    # 构建
npm run deploy   # 部署到 GitHub Pages
npm run clear    # 清除缓存
```

## Skills (已完善)

| Skill | 命令 | 功能 |
|-------|------|------|
| `new-post` | `/new-post` | 创建新文章，自动注册侧边栏，更新交叉链接 |
| `preview` | `/preview` | 本地预览，自动同步文档到侧边栏 |
| `check-images` | `/check-images` | 检查图片路径 |
| `deploy` | `/deploy` | 部署博客 |

### new-post 完善功能

- 文件名特殊字符处理：括号 `()（ ）` → `-`
- 自动注册到 `sidebars.js`
- 更新 `.skill-context.json`
- 序列文章交叉链接（上一篇/下一篇）

### preview 完善功能

- 预检：扫描 docs/ 目录，提取 docId
- 对比上下文：识别新增/删除/重命名的文件
- 自动更新侧边栏（去除日期前缀的 docId 规则）
- 自动更新交叉链接
- 端口 3000 占用检测和自动清理

## Hooks

| Hook | 触发 | 功能 |
|------|------|------|
| `lint-md` | Write/Edit .md | Markdown 格式检查 |

## Subagents

| Agent | 用途 |
|-------|------|
| `blog-reviewer` | 博客内容审查 |

## 内容分类

| 分类 | 路径 | Sidebar Section |
|------|------|-----------------|
| STM32 | `docs/stm32/` | 学习笔记 |
| ESP32 | `docs/esp32/` | ESP32知识库 |
| 干货分享 | `docs/sharing/` | 干货分享 |
| 行业动态 | `docs/industry/` | 行业动态 |
| 科研团队 | `docs/team/` | 科研团队 |

## docId 生成规则

Docusaurus docId 生成规则：
- 去掉 `docs/` 前缀
- 去掉 `.md` 后缀
- **对于 `YYYY-MM-DD-{slug}.md` 格式的文件，只保留 `{slug}` 部分（去掉日期前缀）**

| 文件路径 | docId |
|----------|-------|
| `docs/stm32/2026-04-15-gpio-usage.md` | `stm32/gpio-usage` |
| `docs/stm32/STM32知识库/笔记三-工程1-点亮LED.md` | `stm32/STM32知识库/笔记三-工程1-点亮LED` |

## 项目流程

```
1. 创建文章: /new-post stm32 "文章标题"
2. 编写内容
3. 检查图片: /check-images docs/stm32/
4. 本地预览: /preview (自动同步侧边栏)
5. 提交审核: git add → commit → push
6. CI/CD 自动部署
```

## 配置更新记录

- 2026-04-11: 初始配置
- 2026-04-15: 完善 new-post skill（文件名处理、侧边栏注册、交叉链接）
- 2026-04-15: 完善 preview skill（预检、docId 同步、端口检测）
- 2026-04-15: 验证预览正常
