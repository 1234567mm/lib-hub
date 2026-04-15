---
name: new-post
description: Create a new blog post in the docs directory. Use when user says "new post", "create article", "写文章", or "新建博客".
argument-hint: "[category] [title]"
---

# New Blog Post

Create a new blog post document in the appropriate docs category.

## Categories

Available categories:
- `stm32` - STM32 microcontroller articles
- `esp32` - ESP32 microcontroller articles
- `sharing` - Knowledge sharing articles
- `industry` - Industry news
- `team` - Team introduction

## Execution Steps

### 1. Parse Arguments

Parse category and title from user input:
- category: stm32 | esp32 | sharing | industry | team
- title: article title string

### 2. Normalize Filename

**Important**: Filenames with brackets `(`, `)`, `（`, `）` cause Docusaurus to fail.

| Character | Replace With |
|-----------|-------------|
| `(` | `-` |
| `)` | removed or `-` |
| `（` | `-` |
| `）` | removed or `-` |
| `#`, `?`, `%` | `-` |
| `：` | `-` |

Generate clean filename: `{YYYY-MM-DD}-{slug}.md`

### 3. Generate Frontmatter

```yaml
---
id: {slug}
title: {title}
sidebar_label: {title}
---
```

### 4. Determine Category Path

| Category | Sidebar Section | DocId Prefix |
|----------|----------------|--------------|
| stm32 | 学习笔记 | stm32/STM32知识库/ |
| esp32 | ESP32知识库 | esp32/ |
| sharing | 干货分享 | sharing/ |
| industry | 行业动态 | industry/ |
| team | 科研团队 | team/ |

### 5. Register to Sidebar

After creating the file, register it in `sidebars.js`:
- Find the corresponding category in the sidebar config
- Append the docId (path without `.md` extension) to the category's `items` array
- docId format: `{categoryPath}/{filename}` (no `.md`)

Example for stm32:
```js
{
  type: 'category',
  label: '学习笔记',
  items: [
    // ... existing items
    'stm32/STM32知识库/{filename}',  // ← append new docId
  ],
},
```

### 6. Update Context

Update `.claude/skills/migrate-obsidian-docs/.skill-context.json`:

```json
{
  "lastRun": "{ISO timestamp}",
  "sidebarDocIds": [
    // ... existing
    "{docId}"
  ],
  "docIdToFilePath": {
    // ... existing
    "{docId}": "docs/{category}/{filename}.md"
  }
}
```

### 7. Update Cross-Links

If this is a sequential article (e.g., 笔记一, 笔记二):
- Find the previous article by docId pattern
- Update previous article's "下一篇" link
- Add "上一篇" link to new article's frontmatter

```
Previous article (append at end):
## 下一篇：[New Title](/docs/{category}/{slug})

New article (frontmatter after):
> 上一篇：[Prev Title](/docs/{category}/prev-slug)
```

## Example

Creating `stm32 "GPIO使用详解"`:

1. Filename: `docs/stm32/2026-04-15-gpio-usage.md`
2. docId: `stm32/2026-04-15-gpio-usage`
3. Frontmatter:
```yaml
---
id: gpio-usage
title: GPIO使用详解
sidebar_label: GPIO使用详解
---
```
4. Register to sidebars.js → stm32 > 学习笔记
5. Update .skill-context.json

## Output

Report the created file path and any sidebar/context updates made.
