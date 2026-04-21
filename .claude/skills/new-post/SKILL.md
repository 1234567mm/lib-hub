---
name: new-post
description: 创建新文章，自动注册侧边栏并同步上下文
argument-hint: "[category] [title]"
---

# new-post 技能

创建新文章，自动注册侧边栏并同步上下文。

## 分类

| 分类 | 路径 | 说明 |
|------|------|------|
| stm32 | `docs/stm32/` | STM32 微控制器文章 |
| esp32 | `docs/esp32/` | ESP32 微控制器文章 |
| sharing | `docs/sharing/` | 知识分享 |
| industry | `docs/industry/` | 行业动态 |
| team | `docs/team/` | 团队介绍 |

## 执行步骤

### 1. 解析参数

- category: stm32 | esp32 | sharing | industry | team
- title: 文章标题

### 2. 规范化文件名

**重要**：文件名中的括号会导致 Docusaurus 构建失败。

| 字符 | 处理 |
|------|------|
| `(` `)` `（` `）` | 替换为 `-` 或删除 |
| `：` | 替换为 `-` |
| `#` `?` `%` | 替换为 `-` |

生成文件名：`{YYYY-MM-DD}-{slug}.md`

### 3. 生成 frontmatter

```yaml
---
id: {slug}
title: {title}
sidebar_label: {title}
---
```

### 4. 创建文件

写入 `docs/{category}/{filename}`

### 5. 注册侧边栏

追加 docId 到 `sidebars.js` 对应分类：
- docId 格式：`{category}/{filename}`（无 .md 后缀）
- 无日期前缀

### 6. 自动同步上下文

创建文件后，调用 core.js 更新上下文：
```javascript
const core = require('../sync-docs/core.js');
const ctx = core.readContext();
core.updateContextDocIds(ctx, [newDocId], []);
core.writeContext(ctx);
```

## 示例

创建 `stm32 "GPIO使用详解"`：

1. 文件：`docs/stm32/2026-04-21-gpio-usage.md`
2. docId：`stm32/gpio-usage`
3. frontmatter：
```yaml
---
id: gpio-usage
title: GPIO使用详解
sidebar_label: GPIO使用详解
---
```
4. 注册到 sidebars.js → stm32 > 基础知识
5. 自动同步上下文

## 输出

报告创建的文件路径和侧边栏注册结果。
