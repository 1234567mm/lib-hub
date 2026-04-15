---
name: migrate-obsidian-docs
description: Obsidian 文档迁移兼容性技能。日常使用请用 /new-post 和 /preview 代替。
---

# migrate-obsidian-docs (兼容性技能)

> ⚠️ **已废弃**：日常使用请使用 `/new-post` 创建文章 + `/preview` 启动预览。
> 本技能保留用于手动触发完整迁移流程。

## 日常流程

```
/new-post stm32 "文章标题"  → 创建文章 + 注册侧边栏 + 更新 context
/preview                     → 扫描 docs/ + 更新侧边栏 + 启动预览
```

## 何时使用本技能

- 批量导入大量 Obsidian 旧文档时
- 需要手动修复 sidebar 问题时
- context.json 损坏需要重建时

## 完整迁移文档

参见 `.claude/skills/migrate-obsidian-docs/README.md`（如存在）

## Context 文件位置

`.claude/skills/migrate-obsidian-docs/.skill-context.json`

## 关键配置

- `sidebarDocIds`: 已注册的文档 ID 列表
- `docIdToFilePath`: docId 到文件路径的映射
- `crossLinks`: 文档间交叉链接关系
