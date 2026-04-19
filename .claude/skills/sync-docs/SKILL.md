# sync-docs 技能

同步文档配置：扫描新增文件，自动注册侧边栏，更新交叉链接，同步 README 和 intro 文件。

## 功能

1. **扫描检测**：扫描 `docs/` 目录，提取所有文档的 docId
2. **增量对比**：对比 `.skill-context.json` 中的已注册 docId，找出新增文件
3. **侧边栏注册**：自动将新增文件注册到 `sidebars.js` 的对应分类
4. **交叉链接**：为序列文章（如 `笔记一`、`笔记二`）更新交叉链接
5. **上下文同步**：更新 `.skill-context.json` 中的 `sidebarDocIds` 和 `docIdToFilePath`
6. **README 同步**：更新 `README.md` 中的内容分类章节
7. **Intro 同步**：更新各模块目录下的 intro.md 文件列表

## 分类映射

| 分类 | 路径 | Sidebar Section |
|------|------|-----------------|
| stm32 | `docs/stm32/` | 学习笔记 |
| esp32 | `docs/esp32/` | ESP32知识库 |
| sharing | `docs/sharing/` | 干货分享 |
| industry | `docs/industry/` | 行业动态 |
| team | `docs/team/` | 科研团队 |

## docId 生成规则

- 去掉 `docs/` 前缀
- 去掉 `.md` 后缀
- **对于 `YYYY-MM-DD-{slug}.md` 格式的文件，只保留 `{slug}` 部分（去掉日期前缀）**

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
| `--skip-readme` | 跳过 README 同步 |

## 执行流程

### 1. 预检

- 读取当前 `sidebars.js`
- 读取当前 `.skill-context.json`（若不存在则创建）
- 扫描 `docs/` 目录获取所有 `.md` 文件

### 2. 提取 docId

遍历所有 `.md` 文件，生成 docId 列表：

```js
function generateDocId(filePath) {
  // docs/stm32/2026-04-15-gpio-usage.md → stm32/gpio-usage
  // docs/stm32/笔记一.md → stm32/笔记一
  let docId = filePath
    .replace(/^docs\//, '')
    .replace(/\.md$/, '')
    .replace(/^\d{4}-\d{2}-\d{2}-/, ''); // 去除日期前缀
  return docId;
}
```

### 3. 对比新增文件

```js
const existingDocIds = context.sidebarDocIds || [];
const allDocIds = scannedDocIds;
const newDocIds = allDocIds.filter(id => !existingDocIds.includes(id));
```

### 4. 注册侧边栏

根据文件路径确定分类，读取 `directories.json` 获取对应的 `label`，追加到 `sidebars.js` 中对应键的 `items` 数组。

### 5. 处理交叉链接

检测序列文章特征（如 `笔记一`、`笔记二`、`part-1`、`part-2`），更新链接：

```markdown
<!-- 新文章 frontmatter 后 -->
> 上一篇：[笔记一标题](/docs/stm32/入门教程/笔记一)

<!-- 新文章末尾 -->
## 下一篇：[笔记三标题](/docs/stm32/入门教程/笔记三)

<!-- 前一篇文章末尾更新 -->
## 下一篇：[新文章标题](/docs/stm32/入门教程/笔记二)
```

### 6. 更新 .skill-context.json

```json
{
  "lastRun": "2026-04-18T12:00:00.000Z",
  "sidebarDocIds": ["stm32/gpio-usage", ...],
  "docIdToFilePath": {
    "stm32/gpio-usage": "docs/stm32/2026-04-15-gpio-usage.md",
    ...
  }
}
```

### 7. 更新 README.md

同步内容分类章节：

```markdown
## 内容分类

| 分类 | 路径 | Sidebar Section |
|------|------|-----------------|
| STM32 | `docs/stm32/` | 学习笔记 |
| ESP32 | `docs/esp32/` | ESP32知识库 |
| ...
```

### 8. 更新 Intro 文件

扫描所有配置了 `intro` 的模块目录，生成文件列表并更新对应 intro.md。

#### file-list 类型

扫描模块目录下所有 `.md` 文件（排除 intro.md 自身），生成链接列表：

```markdown
## {listTitle}

- [文件标题](./filename)
```

标题提取顺序：
1. frontmatter 的 `title`
2. 首行 H1 `# `
3. 文件名（去除日期前缀）

#### category-overview 类型

统计所有子模块的文件数量，更新栏目结构树：

```markdown
## 栏目结构

```
入门教程
├── 基础知识
│   └── 5 篇文章
├── 外设驱动
│   └── 10 篇文章
├── 项目实战
│   └── 4 篇文章
└── 入门教程
    └── 4 篇文章
```
```

内容替换使用正则匹配 `## {listTitle}` 到下一个 `##` 或 `---` 之间的内容。

## 示例

```
/sync-docs
```

输出示例：

```
🔍 扫描 docs/ 目录...
   发现 5 个新增文件

   + stm32/gpio-usage
   + stm32/入门教程/笔记四-定时器
   + esp32/wifi-config

📝 注册侧边栏...
   ✓ 已注册 stm32/gpio-usage 到 学习笔记
   ✓ 已注册 stm32/入门教程/笔记四-定时器 到 学习笔记
   ✓ 已注册 esp32/wifi-config 到 ESP32知识库

🔗 更新交叉链接...
   ✓ 更新 笔记三 → 笔记四 链接

📄 同步 README.md...
   ✓ 内容分类已更新

📚 更新 Intro 文件...
   ✓ stm32/stm32-basics/intro.md 已更新
   ✓ stm32/intro.md 栏目结构已更新（已禁用）

✨ 完成！已同步 3 个新增文件
```

## 注意事项

- 仅处理 `.md` 文件
- 不处理 `docs/intro.md` 等根目录文件
- 交叉链接仅处理具有序列特征的文件名
- Intro 同步参考 `directories.json` 中的 `intro` 配置
