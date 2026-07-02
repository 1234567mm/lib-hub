# lib-hub 博客项目

## 项目概述

| 项目 | 信息 |
|------|------|
| **名称** | 山药泥酸奶的技术窝 |
| **框架** | Docusaurus 3.7.0 |
| **类型** | 个人技术博客 |
| **主题** | 嵌入式开发（STM32、ESP32） |
| **部署** | GitHub Pages |
| **URL** | https://1234567mm.github.io/lib-hub/ |

## 目录结构

```
lib-hub/
├── blog/             # 博客文章（Docusaurus blog plugin）
│   ├── YYYY-MM-DD-slug.md   # 文章文件
│   └── authors.yml          # 作者信息
├── docs/             # 文档页面（intro、team info 等）
├── src/              # React 组件与页面
├── static/           # 静态资源（img/）
├── sidebars.js       # 侧边栏配置
└── docusaurus.config.js     # Docusaurus 配置
```

## 常用命令

```bash
npm run start    # 本地预览（http://localhost:3000）
npm run build    # 构建生产版本
npm run deploy   # 部署到 GitHub Pages
npm run clear    # 清除缓存
```

## 文章发布流程

1. 在 `blog/` 目录下创建文件：`YYYY-MM-DD-slug.md`
2. 设置 frontmatter（标题、作者、标签、封面图）：

```yaml
---
title: "文章标题"
description: "一句话描述，用于SEO和首页展示（50-150字）"
authors: yamahoney
tags: [stm32, 入门教程]
date: 2026-06-27
---
```

3. `npm run start` 本地预览
4. `git push` 推送到 GitHub，CI/CD 自动部署

## 内容分类

| 分类 | 位置 | 说明 |
|------|------|------|
| STM32 教程 | `blog/` | 标签 `STM32` |
| ESP32 教程 | `blog/` | 标签 `ESP32` |
| 干货分享 | `blog/` | 标签 `干货分享` |
| 行业动态 | `blog/` | 标签 `行业动态` |
| 开发工具 | `blog/` | 标签 `开发工具` |
| 文档页面 | `docs/` | intro、团队介绍等 |

## 注意事项

- 所有博客文章统一放在 `blog/` 目录，按 `YYYY-MM-DD-slug.md` 命名
- 文章分类通过 frontmatter 中的 `tags` 字段实现
- `docs/` 目录仅用于文档类页面（如介绍、团队信息），不作为博客文章存储
- 文件名中的括号使用全角中文括号 `（）` 而非半角 `()`

## 项目级 Skills 命令

### `/blog-new` — 自然语言新建博客笔记（生成框架）

用自然语言描述文章内容，自动生成标准 frontmatter 与 markdown 骨架文件。

```
/blog-new 标题: STM32 DMA 传输详解  分类: stm32, 进阶
/blog-new 帮我写一篇关于定时器PWM输出的文章
```

**功能**：解析标题/标签/描述 → 创建 `blog/YYYY-MM-DD-slug.md` → 生成 frontmatter + `<!-- truncate -->` + 章节骨架 → 输出文件路径

### `/blog-review` — 笔记内容审查与命名优化

审查 blog 文章的质量，检查 frontmatter 完整性、文件名规范、标签合理性等。

```
/blog-review blog/2026-07-03-article.md    # 单篇审查
/blog-review blog/                          # 全量审查
```

**检查项**：title/description/authors/tags/date 完整性、description 长度（50-150字）、truncate 标记、文件名括号规范、标签有效性、内部链接、图片路径

### `/blog-deploy` — 仓库提交与在线构建

自动 git commit + push，触发 GitHub Actions 在线构建。

```
/blog-deploy 修复DMA文章中的typo
/blog-deploy feat: 新增 STM32 PWM 文章
```

**流程**：`git status` → 生成 conventional commit 消息 → `git add -A && git commit && git push` → 输出构建链接。构建失败时不推送。

### `/project-showcase` — 项目甄选与展示管理

扫描 blog 文章，自动识别含金量高的项目，输出结构化展示数据供 `技术甄选` 页面使用。

```
/project-showcase              # 全量扫描并更新
/project-showcase --report     # 仅输出报告
/project-showcase blog/xxx.md  # 单篇评估
```

**流程**：识别项目文章（标签/标题/长度/代码量） → 评定含金量 ⭐1-5 级 → 提炼技术亮点 → 输出 `data/projects.json` → 提示是否更新页面展示数据
