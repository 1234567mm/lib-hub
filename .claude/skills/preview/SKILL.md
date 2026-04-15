---
name: preview
description: Preview the Docusaurus blog locally. Use when user says "preview", "预览", "本地查看", or "启动预览".
disable-model-invocation: true
allowed-tools: Bash, Read, Glob, Grep, Edit, Write
---

# Preview Blog

Start the Docusaurus local development server for preview with automatic doc synchronization.

## Pre-flight Check Steps

Before starting the server, perform these checks:

### Step 1: Scan Docs Directory

Scan `docs/` for all `.md` files and extract their docIds:
- docId = relative path from `docs/` without `.md` extension
- **Important**: Docusaurus strips the `docs/` prefix and date prefix (YYYY-MM-DD-) from filename
- Example: `docs/stm32/2026-04-15-gpio-usage.md` → docId: `stm32/gpio-usage`
- Example: `docs/stm32/STM32知识库/笔记三-工程1-点亮LED.md` → docId: `stm32/STM32知识库/笔记三-工程1-点亮LED`

### Step 2: Compare with Context

Read `.claude/skills/migrate-obsidian-docs/.skill-context.json`:
- Get `sidebarDocIds` list
- Identify new files not in context
- Identify deleted files (in context but not on disk)
- Identify renamed files

### Step 3: Update Sidebar

If new files found:
1. Read current `sidebars.js`
2. Determine category based on file path
3. **Use the correct docId** (strip `docs/` prefix and date prefix)
4. Append new docIds to appropriate category's `items` array
5. Write updated `sidebars.js`

If deleted files found:
1. Remove their docIds from `sidebars.js`

### Step 4: Update Cross-Links

For new files:
- If filename contains sequence numbers (如 `笔记一`, `笔记二`), update cross-links
- Add `> 上一篇: [prev](/docs/...)` after frontmatter
- Add `## 下一篇: [next](/docs/...)` at end of file
- Update previous file's `## 下一篇` to point to new file

### Step 5: Update Context

Update `.claude/skills/migrate-obsidian-docs/.skill-context.json`:
- Update `lastRun` timestamp
- Add new docIds to `sidebarDocIds`
- Add new entries to `docIdToFilePath`
- Remove deleted entries

### Step 6: Check Port 3000

Check if port 3000 is already in use:

```bash
# Windows: check if port 3000 is in use
netstat -ano | findstr :3000
```

If port 3000 is in use:
1. Find the process using port 3000 (PID)
2. Kill the process: `taskkill /PID {PID} /F`
3. Wait 2 seconds for port to be released

### Step 7: Start Dev Server

```bash
npm run start
```

Server runs at: http://localhost:3000/lib-hub/

## Pre-flight Check Output

Report before starting server:
```
## Pre-flight Check

### New Files: N
- docId: stm32/gpio-usage

### Deleted Files: N
- docId: stm32/old-note (removed from sidebar)

### Sidebar Updates: N
- Added stm32/gpio-usage to stm32 > 学习笔记

### Cross-links Updated: N
- docs/stm32/STM32知识库/笔记三-工程1-点亮LED.md: added 下一篇 link

### Port Check:
- Port 3000: Free | Occupied by PID {pid} (killed)

Starting preview server...
```

## Important Notes

### docId 生成规则

Docusaurus docId 的生成规则：
- 去掉 `docs/` 前缀
- 去掉 `.md` 后缀
- **对于 `YYYY-MM-DD-{slug}.md` 格式的文件，只保留 `{slug}` 部分（去掉日期前缀）**

| 文件路径 | docId |
|----------|-------|
| `docs/stm32/2026-04-15-gpio-usage.md` | `stm32/gpio-usage` |
| `docs/stm32/STM32知识库/笔记三-工程1-点亮LED.md` | `stm32/STM32知识库/笔记三-工程1-点亮LED` |
| `docs/esp32/esp32-intro.md` | `esp32/esp32-intro` |

**常见错误**：使用 `stm32/2026-04-15-gpio-usage` 而不是 `stm32/gpio-usage`

## Notes

- Changes to docs/ trigger hot reload
- CSS changes trigger hot reload
- Full rebuild needed only for docusaurus.config.js changes

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port 3000 occupied | Auto-kill existing process, restart server |
| New file not in sidebar | Run /new-post first to register |
| 404 on page | Check if docId matches sidebar entry |
| Old content shown | Server may need restart: Ctrl+C then /preview |
| "sidebar document ids do not exist" | Verify docId is correct (check docId 生成规则 above) |
| docId mismatch | Use `stm32/gpio-usage` not `stm32/2026-04-15-gpio-usage` |
