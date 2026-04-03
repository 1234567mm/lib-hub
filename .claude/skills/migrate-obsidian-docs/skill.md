# migrate-obsidian-docs

将 Obsidian 风格的笔记文档迁移至 Docusaurus 项目，自动完成格式规范化与侧边栏接入。

## 触发条件

当项目中存在以下情况时使用：
- 缺少 Docusaurus frontmatter 的 `.md` 文件
- 包含 Obsidian 双链语法 `[[...]]` 的文件
- MDX 编译错误，如 `Unexpected closing tag`、标签不匹配、未闭合的 `<img>` 标签、`ReferenceError: Byte is not defined` 等
- 用户新增了笔记文档，需要在网页上正确显示
- 用户删除了本地笔记文件，需要同步删除 sidebar 中的失效引用
- 用户重命名或移动了笔记文件，需要同步更新 sidebar 中的 docId
- 用户明确要求"迁移笔记"或"上传了笔记文档"

## 目录结构规范

所有文档放在 `docs/` 目录下，对应侧边栏的分类结构：

| 文档路径 | 侧边栏分类 | 接入位置 |
|---|---|---|
| `docs/stm32/STM32知识库/` | `stm32` | STM32知识库 > 学习笔记 |
| `docs/stm32/stm32-basics/` | `stm32` | STM32知识库 > 基础知识 |
| `docs/stm32/stm32-peripherals/` | `stm32` | STM32知识库 > 外设驱动 |
| `docs/stm32/stm32-projects/` | `stm32` | STM32知识库 > 项目实战 |
| `docs/esp32/` | `esp32` | ESP32知识库 |
| `docs/sharing/` | `sharing` | 干货分享 |
| `docs/industry/` | `industry` | 行业动态 |
| `docs/team/` | `team` | 科研团队 |

## 执行步骤

### 第一步：扫描

在 `docs/` 目录下递归搜索同时满足以下任一条件的 `.md` 文件：
- 文件内容开头不是 `---`（缺少 frontmatter）
- 文件内容包含 `[[` 和 `]]`（Obsidian 双链语法）
- 文件内容包含非自闭合的 `<img` 标签
- 文件包含会导致 MDX 编译失败的 LaTeX 或其他特殊语法

**同时**，检查 `sidebars.js` 中引用的每个 docId 是否在本地有对应文件，发现以下情况也要处理：
- sidebar 中引用的文件本地已删除 → 记录为待删除
- 本地新增文件尚未写入 sidebar → 记录为待新增
- 本地文件被重命名/移动，旧路径在 sidebar 中 → 记录为待更新

### 第二步：识别板块

根据文件路径判断所属分类，参考上方的目录结构规范。

对于 sidebar 中的失效引用，根据被删除文件原来的 docId 路径推断它属于哪个分类，在对应位置执行删除。

### 第三步：规范化格式

对每个扫描到的文件：

1. **提取 title**：从首行 `# 标题` 中提取，去除 `#` 和前后空格
2. **添加 frontmatter**：
   ```yaml
   ---
   title: {提取的标题}
   authors: 山药泥酸奶
   tags: [{根据路径推断的标签，如 STM32、ESP32 等}]
   date: {当前日期，格式 2024-MM-DD}
   ---
   ```
3. **修复 Obsidian 双链**：将 `[[文档名]]` 替换为标准 Markdown 链接
4. **修复 Obsidian vault 链接**：将 `obsidian://open?vault=...` 格式的链接转换为标准 URL
5. **修复 MDX 图片标签**：将非自闭合的 `<img>` 标签改为自闭合形式 `<img ... />`
6. **修复 MDX 不兼容的 LaTeX**：将 `$$...$$` 中含 `\text{...}` 的 LaTeX 公式改为纯文本或去掉 `$$`，因为 Docusaurus 默认不支持 LaTeX 渲染

### 第四步：同步侧边栏配置（关键步骤）

**Docusaurus 的侧边栏不是从文件系统自动生成的，必须在 `sidebars.js` 中显式配置，文档才会显示侧边栏。**

#### 4.1 读取配置

读取 `sidebars.js` 和 `docs/` 目录结构，比对两者的差异。

#### 4.2 清理已删除文件的引用

遍历 `sidebars.js` 中所有 docId（字符串形式的文件路径），检查本地是否存在对应文件：

- 计算 docId 对应的本地路径：`docs/` + docId（将 `/` 替换为系统路径分隔符）+ `.md`
- 如果文件不存在，从 sidebar 中删除该条目
- 如果被删除的文件所在的子分类（如"学习笔记"）变空，保留空分类（由 `collapsible: true` 控制）

#### 4.3 新增文件写入侧边栏

根据文件路径判断所属分类，追加到对应子分类的 `items` 数组中，格式：
```js
'stm32/STM32知识库/新笔记文件名',  // ← 直接追加 docId 字符串
```

#### 4.4 重命名/移动文件时同步更新引用

如果本地文件被重命名或移动：
- 新路径生成新的 docId
- 在 sidebar 中找到旧的 docId，替换为新的
- **不要**删除旧的再用新的，要做 in-place 替换，保持 sidebar 中的顺序

#### 4.5 docId 格式说明

docId 是文件相对于 `docs/` 目录的路径（不带 `.md` 后缀），例如：
- `docs/stm32/intro.md` → `stm32/intro`
- `docs/stm32/STM32知识库/笔记.md` → `stm32/STM32知识库/笔记`

## 常见 MDX 编译错误及修复

| 错误信息 | 原因 | 修复方法 |
|---|---|---|
| `Unexpected closing tag </p>` | `<img>` 标签未闭合 | 改为 `<img ... />` |
| `ReferenceError: Byte is not defined` | LaTeX 中的 `\text{...}` 在 MDX 中被当作 JS 变量 | 将 `$$...$$` 中的 `\text{...}` 改为纯文本或去掉 `$$` |
| `Unexpected closing tag </xxx>` | HTML 标签未正确闭合 | 检查并闭合对应标签 |

## 侧边栏不显示的排查思路

1. **确认 docId 正确**：docId 必须是相对于 `docs/` 的路径，不能有前导 `/`，不能有 `.md` 后缀
2. **确认 sidebar 数组中已列出**：文档必须作为 item 加入 `sidebars.js` 中对应的 sidebar 数组，只在 `docs/` 目录下存在是不够的
3. **确认 frontmatter 中有 `sidebar` 字段**：由第四步配置自动保证

## 注意事项

- frontmatter 的 `title` 必须与文件内 H1 完全一致
- `date` 使用当前日期
- `tags` 根据文件路径推断，默认为 `[文档所在分类]`
- 修复图片标签时，只改非自闭合的 `<img ...>` 为 `<img ... />`
- 侧边栏配置是确保文档在网页上正确显示的关键步骤，不可省略
- **同步是双向的**：本地文件删除 → sidebar 中删除对应引用；本地新增文件 → sidebar 中追加；本地重命名 → sidebar 中 in-place 更新
- docId 是 sidebar 关联文件的唯一标识，修改文件位置后必须同步更新 sidebar 中的 docId
