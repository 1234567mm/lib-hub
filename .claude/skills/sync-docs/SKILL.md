---
name: sync-docs
description: 同步文档配置：扫描新增文件，自动注册侧边栏，更新交叉链接，同步 README 和 intro 文件。
---

# sync-docs 技能

同步文档配置：扫描新增文件，自动注册侧边栏，更新交叉链接，同步 README 和 intro 文件。

## 核心函数 (core.js)

```javascript
const core = require('./core.js');

// 生成 docId
core.generateDocId('docs/stm32/2026-04-15-gpio-usage.md')
// → 'stm32/gpio-usage'

// 扫描所有 docId
core.scanAllDocIds('docs')
// → ['esp32/esp32-intro', 'stm32/stm32-basics/intro', ...]

// 对比新增/删除
core.diffDocIds(['existing-docId'], 'docs')
// → { added: [{docId, filePath}], removed: [docId] }

// 读取/写入上下文
const ctx = core.readContext();
core.writeContext(ctx);
```

## docId 生成规则

| 文件路径 | docId |
|----------|-------|
| `docs/stm32/2026-04-15-gpio-usage.md` | `stm32/gpio-usage` |
| `docs/stm32/入门教程/笔记三.md` | `stm32/入门教程/笔记三` |
| `docs/开发工具/WSL2安装.md` | `开发工具/WSL2安装` |

**规则**：
1. 去掉 `docs/` 前缀
2. 去掉 `.md` 后缀
3. 对于 `YYYY-MM-DD-{slug}.md` 格式，只保留 `{slug}` 部分

## 分类映射

| 分类 | Sidebar Section |
|------|-----------------|
| stm32 | 基础知识、入门教程、外设驱动、项目实战 |
| esp32 | ESP32知识库 |
| sharing | 干货分享 |
| industry | 行业动态 |
| team | 科研团队 |
| 开发工具 | 开发工具 |

## 使用方式

```
/sync-docs [分类] [参数]
```

### 参数

| 参数 | 说明 |
|------|------|
| 无参数 | 扫描全部 docs/ 目录，检测并同步所有新增文件 |
| `stm32` | 仅同步 stm32 分类 |
| `--dry-run` | 仅显示将进行的更改，不实际执行 |

## 执行流程

1. 读取 `.skill-context.json` 获取已注册的 docId
2. 扫描 `docs/` 目录提取当前所有 docId
3. 对比找出新增文件和删除文件
4. 将新增文件注册到 `sidebars.js` 对应分类
5. 更新交叉链接（序列文章）
6. 更新 `.skill-context.json`
7. 更新 `README.md` 内容分类
8. 更新各模块 `intro.md`

## 注意事项

- 仅处理 `.md` 文件
- docId 格式：`{分类}/{子目录}/{文件名}`（无 docs/ 前缀，无 .md 后缀）
- 交叉链接处理 `笔记一`、`笔记二` 等序列文章
