# migrate-obsidian-docs

将 Obsidian 风格的笔记文档迁移至 Docusaurus 项目，自动完成格式规范化与侧边栏接入。

**核心功能**：当用户新增笔记文档时，自动完成 frontmatter 配置、侧边栏接入、交叉链接更新。

## 触发条件

当项目中存在以下情况时使用：
- 用户新增了笔记文档，需要在网页上正确显示
- 用户删除了本地笔记文件，需要同步删除 sidebar 中的失效引用
- 用户重命名或移动了笔记文件，需要同步更新 sidebar 中的 docId
- **文件名包含特殊字符导致网页无法正常显示**（如半角括号 `(`, `)` 或全角括号 `（`, `）`）
- **MDX 编译错误**，如 LaTeX 公式 `$$...$$` 中的括号被误解析为 JSX
- 笔记之间的交叉链接需要更新（新增笔记时连接上篇和下篇）

## 核心执行步骤

### 第一步：检测新增文件

扫描 `docs/` 目录，找出**新增的** `.md` 文件（对比 context 中记录的 `sidebarDocIds`）。

### 第二步：处理新增笔记的规范化

对每个新增文件执行：

#### 2.1 文件名处理（重要！）

**文件名含括号会导致 Docusaurus 无法识别为文档！**

| 情况 | 处理方式 |
|---|---|
| 含半角括号 `(`, `)` | 重命名文件，将 `(` 替换为 `-`，`)` 去掉或替换为 `-` |
| 含全角括号 `（`, `）` | 重命名文件，替换为 `-` |
| 其他特殊字符 `#`, `?`, `%` | 替换为 `-` |

**正确示例**：
- `笔记(三)工程1-点亮LED.md` → `笔记三-工程1-点亮LED.md`
- `STM32学习笔记(一)：那些你该知道的事儿.md` → 保留原名（因前面已处理）

#### 2.2 添加 frontmatter

在文件开头添加（frontmatter 的 `---` 必须在第1行）：

```yaml
---
title: {从文件H1提取的标题}
authors: 山药泥酸奶
tags: [{根据路径推断，如 STM32、ESP32、嵌入式等}]
date: {当前日期，格式 2026-MM-DD}
slug: {如果文件名含特殊字符，添加此项指定干净URL}
---
```

#### 2.3 检查并修复 MDX 编译问题

**LaTeX 公式问题（最常见报错）**：
- `$$ T = \frac{(PSC + 1) \times (ARR + 1)}{Clk} $$` 会因括号导致 MDX 解析失败
- **修复**：将 `$$...$$` 中的公式改为纯文本，如 `T = (PSC + 1) × (ARR + 1) / Clk`

**其他需修复的内容**：
- Obsidian 双链 `[[文档名]]` → 标准 Markdown 链接
- HTML `<img>` 标签 → Markdown `![alt](path)` 语法
- frontmatter 前有导航链接 → 移到 frontmatter 之后

### 第三步：同步侧边栏配置

#### 3.1 写入 sidebar

根据文件路径判断分类，追加到 `sidebars.js` 对应分类的 `items` 数组：

```js
// 路径示例：docs/stm32/STM32知识库/笔记三-工程1-点亮LED.md
// 对应分类：stm32 > 学习笔记

{
  type: 'category',
  label: '学习笔记',
  items: [
    // ... 已有项
    'stm32/STM32知识库/笔记三-工程1-点亮LED',  // ← 追加新的 docId
  ],
},
```

**docId 格式**：相对于 `docs/` 的路径，不带 `.md` 后缀
- 正确：`stm32/STM32知识库/笔记三-工程1-点亮LED`
- 错误：`stm32/STM32知识库/笔记三-工程1-点亮LED.md`（多了 .md）

#### 3.2 更新交叉链接

**新增笔记链接规则**：
- **上篇链接**：在 frontmatter 之后添加 `> 上一篇：[xxx](/docs/stm32/STM32知识库/xxx)`
- **下篇链接**：在文件末尾添加 `## 下一篇：[xxx](/docs/stm32/STM32知识库/xxx)`

**更新上篇笔记**：在上篇笔记末尾的 `## 下一篇` 指向新笔记。

### 第四步：更新 context

将本次变更记录到 `.skill-context.json`：
- `sidebarDocIds`：追加新的 docId
- `docIdToFilePath`：新增 docId → 文件路径映射
- `crossLinks`：新增链接关系

## 常见错误及修复

### 错误：sidebar docId 不存在

```
These sidebar document ids do not exist:
- stm32/STM32知识库/xxx
```

**原因**：docId 与实际文件名不匹配
- 文件名含括号 `笔记(三)` 而 docId 写 `笔记三`
- 或文件名缺少 `.md` 扩展名

**修复**：
1. 检查 `docs/stm32/STM32知识库/` 目录下文件的实际名称
2. sidebar 中的 docId 必须与实际文件名完全一致

### 错误：MDX 编译失败

```
Could not parse expression with acorn
Cause: Could not parse expression with acorn
```

**原因**：`$$...$$` 中的括号 `()` 被 MDX 解析器误认为 JSX 表达式

**修复**：将 LaTeX 公式改为纯文本

### 错误：文件名含括号导致文档无法识别

**原因**：Docusaurus 无法将含括号的文件名解析为有效的 docId

**修复**：重命名文件，去除括号

## 笔记交叉链接参考

当前链接关系：
- 笔记一 → 笔记二
- 笔记二 → 笔记一、笔记三
- 笔记三 → 笔记二、（下篇待创建）

---

## 上下文持久化

### 记录文件

`.claude/skills/migrate-obsidian-docs/.skill-context.json`

### 记录内容格式

```json
{
  "lastRun": "2026-04-07T00:00:00Z",
  "sidebarDocIds": [
    "stm32/STM32知识库/STM32学习笔记一-那些你该知道的事儿",
    "stm32/STM32知识库/STM32学习笔记二-存储器-电源与时钟体系",
    "stm32/STM32知识库/笔记三-工程1-点亮LED"
  ],
  "docIdToFilePath": {
    "stm32/STM32知识库/STM32学习笔记一-那些你该知道的事儿": "docs/stm32/STM32知识库/STM32学习笔记(一)：那些你该知道的事儿.md",
    "stm32/STM32知识库/STM32学习笔记二-存储器-电源与时钟体系": "docs/stm32/STM32知识库/STM32学习笔记（二）存储器、电源与时钟体系.md",
    "stm32/STM32知识库/笔记三-工程1-点亮LED": "docs/stm32/STM32知识库/笔记三-工程1-点亮LED.md"
  },
  "crossLinks": {
    "docs/stm32/STM32知识库/STM32学习笔记(一)：那些你该知道的事儿.md": [
      "/docs/stm32/STM32知识库/STM32学习笔记二-存储器-电源与时钟体系"
    ],
    "docs/stm32/STM32知识库/STM32学习笔记（二）存储器、电源与时钟体系.md": [
      "/docs/stm32/STM32知识库/STM32学习笔记一-那些你该知道的事儿",
      "/docs/stm32/STM32知识库/笔记三-工程1-点亮LED"
    ],
    "docs/stm32/STM32知识库/笔记三-工程1-点亮LED.md": [
      "/docs/stm32/STM32知识库/STM32学习笔记二-存储器-电源与时钟体系"
    ]
  }
}
```

### 增量更新策略

每次执行时：
1. 读取 context 中的 `sidebarDocIds`
2. 扫描 `docs/stm32/STM32知识库/` 下的 `.md` 文件
3. 识别新增文件 → 执行规范化 + 写入 sidebar + 更新交叉链接
4. 识别被删除文件 → 从 sidebar 移除 + 更新 context
5. 识别重命名文件 → 更新 sidebar docId + 更新 context
