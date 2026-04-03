# migrate-obsidian-docs

将 Obsidian 风格的笔记文档迁移至 Docusaurus 项目，自动完成格式规范化与侧边栏接入。

## 触发条件

当项目中存在以下情况时使用：
- 缺少 Docusaurus frontmatter 的 `.md` 文件
- 包含 Obsidian 双链语法 `[[...]]` 的文件
- 用户明确要求"迁移笔记"或"上传了笔记文档"

## 执行步骤

### 第一步：扫描

在 `docs/` 目录下递归搜索同时满足以下任一条件的 `.md` 文件：
- 文件内容开头不是 `---`（缺少 frontmatter）
- 文件内容包含 `[[` 和 `]]`（Obsidian 双链语法）

### 第二步：识别板块

根据文件路径判断所属分类和侧边栏位置：

| 文件路径特征 | 侧边栏分类 | 接入位置 |
|---|---|---|
| `docs/stm32/STM32知识库/` | `stm32` | STM32知识库 > 学习笔记 |
| `docs/stm32/stm32-basics/` | `stm32` | STM32知识库 > 基础知识 |
| `docs/stm32/stm32-peripherals/` | `stm32` | STM32知识库 > 外设驱动 |
| `docs/stm32/stm32-projects/` | `stm32` | STM32知识库 > 项目实战 |
| `docs/esp32/` | `esp32` | ESP32知识库（追加到现有分类） |
| `docs/sharing/` | `sharing` | 干货分享 |
| `docs/industry/` | `industry` | 行业动态 |
| `docs/team/` | `team` | 科研团队 |

如果路径中包含"知识库"或"学习笔记"，优先归入"学习笔记"子分类。

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
3. **修复 Obsidian 双链**：将 `[[文档名]]` 替换为标准 Markdown 链接：
   - `[[STM32学习笔记(一)]]` → `[STM32学习笔记(一)](/docs/stm32/STM32知识库/STM32学习笔记(一)：那些你该知道的事儿)`
   - 链接路径基于文件实际相对路径计算
4. **修复 Obsidian vault 链接**：将 `obsidian://open?vault=...` 格式的链接转换为标准 URL

### 第四步：更新侧边栏

1. 读取项目根目录的 `sidebars.js`
2. 根据文件所属分类，找到对应的 sidebar 条目
3. 如果该分类下已有"学习笔记"子分类，追加文件到此子分类
4. 如果没有，创建新的子分类并接入文件
5. 保持原有 sidebar 结构不变，只做追加操作

## 输出要求

完成迁移后，输出修改摘要：
- 共扫描到 N 个文件需要迁移
- 已规范化 N 个文件
- 已更新侧边栏分类：XXX

## 注意事项

- 只修改确实需要迁移的文件，不碰已有完整 frontmatter 的文档
- frontmatter 的 `title` 必须与文件内 H1 完全一致
- `date` 使用当前日期
- `tags` 根据文件路径推断，默认为 `[文档所在分类]`
- 如果同一分类下文件较多，按文件名排序后依次接入
