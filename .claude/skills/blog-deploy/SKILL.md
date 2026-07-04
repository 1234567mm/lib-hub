# blog-deploy

**命令**：`/blog-deploy`

**功能**：自动 git 提交并推送到 GitHub，触发 CI/CD 在线构建部署。支持**双轨发布**模式：blog 展示摘要 + docs 知识库展示完整内容。

---

## 📐 blog ↔ docs 双轨关系

```
首页最新动态 (Blog)                         结构化知识库 (Docs)
    │                                              │
    │  blog/YYYY-MM-DD-slug.md                     │  docs/stm32/.../NN-slug.md
    │  （摘要 + 8 个章节要点索引）                  │  （完整技术内容 + sidebar 翻页）
    │                                              │
    └──→ "阅读完整知识库内容 →" 链接 ──────────────→┘
```

- **Blog**：首页按时间线展示，标题 + 摘要 + 标签，吸引读者点击
- **Docs**：知识库 sidebar 导航，前后翻页，适合系统化学习
- **链接**：blog 末尾自动添加 `👉 [阅读完整知识库内容 →](/docs/...)` 跳转到 docs

---

## 用法

```
/blog-deploy 修复DMA文章中的typo              # 单轨修复
/blog-deploy sync: 新增 SPI Flash 与内部 Flash  # 双轨发布（blog + docs 同步）
/blog-deploy feat: 新增 STM32 PWM 文章         # 单轨新增
```

---

## 双轨发布工作流（新增内容时使用）

适用于**新写一篇长文，同时希望在 blog 首页展示、docs 知识库完整阅读**的场景。

1. **创建 blog 版本** — 完整内容写在 `blog/YYYY-MM-DD-slug.md`，含 frontmatter + `<!-- truncate -->` + 完整正文
2. **复制到 docs** — 在对应知识库目录创建文件，如 `docs/stm32/stm32-basics/NN-slug.md`
   - frontmatter 改为 docs 风格：`sidebar_position` + `title`
   - 去掉 blog 特有的 `authors`/`tags`/`date` 字段
   - 去掉 `<!-- truncate -->` 标记
3. **改编 blog 为摘要版** — 将 blog 正文替换为简短摘要 + 章节索引 + 跳转链接
   - 保留 frontmatter（title/description/authors/tags/date）
   - 保留 `<!-- truncate -->` 标记
   - 正文改为 8 个章节的 1~2 句话介绍
   - 末尾添加：`👉 [阅读完整知识库内容 →](/docs/...)`
4. **运行 `npm run build`** 前置构建检查
   - 构建失败自动中止，不推送
5. **构建通过** → `git add -A && git commit -m "..." && git push`
6. 输出 GitHub Actions 构建链接

---

## 单轨发布工作流（仅更新 blog 或仅更新 docs 时使用）

1. 运行 `git status` 了解当前变更
2. 生成 conventional commit 消息
3. 运行 `npm run build` 前置构建检查
4. 构建失败自动中止，不推送
5. 构建通过 → `git add -A && git commit -m "..." && git push`
6. 输出 GitHub Actions 构建链接

---

## commit 类型

| type | 适用场景 |
|------|----------|
| `sync` | **双轨发布**：blog 摘要 + docs 完整内容同步新增 |
| `post` | 新增/更新博客文章（仅 blog） |
| `docs` | 更新知识库文档（仅 docs） |
| `fix` | 修复内容错误或断链 |
| `chore` | 配置/构建脚本变更 |

---

## ⚠️ 已知构建警告（不影响成功）

以下警告是 **Docusaurus 静态检查的已知行为**，构建结果仍为 `[SUCCESS]`，可正常部署：

| 警告内容 | 根因 | 状态 |
|---------|------|------|
| `blog/rss.xml` 断裂链接（所有页面均有） | footer RSS 链接指向完整 URL 即可消除（RSS 文件在链接检查后生成） | ✅ 已修复 |

### 自定义页面锚点注册指南

如果未来在 `src/pages/` 下创建自定义 React 页面并使用了 `to="#anchor"` 的同页跳转，需使用 Docusaurus 官方 API 注册锚点：

```jsx
import useBrokenLinks from '@docusaurus/useBrokenLinks';

function MySection() {
  useBrokenLinks().collectAnchor('my-anchor');
  return <h2 id="my-anchor">标题</h2>;
}
```

否则构建会报告 `[WARNING] Docusaurus found broken anchors`（不影响构建成功，但应修复）。

**如果构建输出中出现其他断裂链接**（以及未注册的锚点），必须修复后再推送，不能忽略。

```
✅ 已提交并推送
提交信息: sync: 新增 SPI Flash 与内部 Flash 文章（blog + stm32-基础知识同步发布）
🌐 在线构建中: https://github.com/1234567mm/lib-hub/actions

📋 本次操作：
  blog/  → 2026-07-02-stm32-memory-spiflash.md（摘要版，已跳转链接）
  docs/  → docs/stm32/stm32-basics/13-memory-spiflash.md（完整内容）
```
