---
name: check-images
description: Check image paths in markdown files. Use when user says "check images", "检查图片", "图片路径", or "fix image paths".
argument-hint: "[directory]"
allowed-tools: Bash, Read, Glob
---

# Check Image Paths

Scan markdown files and verify image references point to existing files.

## Image Patterns to Check

```
![alt](img/...)
![alt](.../img/...)
<img src="img/...">
```

## Verification Steps

1. Extract all image paths from markdown files
2. For each path, check if the file exists
3. Report missing images
4. Suggest fixes for broken paths

## Common Issues

| Issue | Fix |
|-------|-----|
| Missing leading `/` | Add `/` before `img/` |
| Wrong case | Match exact filename case |
| Broken symlink | Recreate link |
| Wrong path depth | Adjust `../` count |

## Example

```bash
# Check specific directory
check-images docs/stm32/

# Check all docs
check-images docs/

# Check blog
check-images blog/
```

## Output Format

```
## Image Check Results

### Found: N images
### Missing: M images

#### Missing Images:
1. docs/stm32/img/stm32-clock.png
2. docs/esp32/img/esp32-schematic.jpg

#### Suggestions:
- Verify files exist in static/img/
- Check case sensitivity
- Check path depth
```
