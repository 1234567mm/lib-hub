# sync-docs 技能

同步文档配置：扫描新增文件，自动注册侧边栏，更新交叉链接，同步 README。

## 功能

1. **扫描检测**：扫描 `docs/` 目录，提取所有文档的 docId
2. **增量对比**：对比 `.skill-context.json` 中的已注册 docId，找出新增文件
3. **侧边栏注册**：自动将新增文件注册到 `sidebars.js` 的对应分类
4. **交叉链接**：为序列文章（如 `笔记一`、`笔记二`）更新交叉链接
5. **上下文同步**：更新 `.skill-context.json` 中的 `sidebarDocIds` 和 `docIdToFilePath`
6. **README 同步**：更新 `README.md` 中的内容分类章节

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

根据文件路径确定分类，追加到对应分类的 `items` 数组：

```js
// 示例：注册 stm32/gpio-usage 到 sidebars.js
const categoryMap = {
  'docs/stm32/': '学习笔记',
  'docs/esp32/': 'ESP32知识库',
  'docs/sharing/': '干货分享',
  'docs/industry/': '行业动态',
  'docs/team/': '科研团队',
};
```

### 5. 处理交叉链接

检测序列文章特征（如 `笔记一`、`笔记二`、`part-1`、`part-2`），更新链接：

```markdown
<!-- 新文章 frontmatter 后 -->
> 上一篇：[笔记一标题](/docs/stm32/STM32知识库/笔记一)

<!-- 新文章末尾 -->
## 下一篇：[笔记三标题](/docs/stm32/STM32知识库/笔记三)

<!-- 前一篇文章末尾更新 -->
## 下一篇：[新文章标题](/docs/stm32/STM32知识库/笔记二)
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

## 示例

```
/sync-docs
```

输出示例：

```
🔍 扫描 docs/ 目录...
   发现 5 个新增文件

   + stm32/gpio-usage
   + stm32/STM32知识库/笔记四-定时器
   + esp32/wifi-config

📝 注册侧边栏...
   ✓ 已注册 stm32/gpio-usage 到 学习笔记
   ✓ 已注册 stm32/STM32知识库/笔记四-定时器 到 学习笔记
   ✓ 已注册 esp32/wifi-config 到 ESP32知识库

🔗 更新交叉链接...
   ✓ 更新 笔记三 → 笔记四 链接

📄 同步 README.md...
   ✓ 内容分类已更新

✨ 完成！已同步 3 个新增文件
```

## 注意事项

- 仅处理 `.md` 文件
- 不处理 `docs/intro.md` 等根目录文件
- 交叉链接仅处理具有序列特征的文件名
