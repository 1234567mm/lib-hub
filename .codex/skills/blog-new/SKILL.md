---
name: blog-new
description: Create a new Docusaurus blog post from a natural-language prompt, generating the filename, frontmatter, and markdown scaffold. Use when the user asks to create or scaffold a blog article in this repo.
---

# blog-new

Use `/blog-new` when the user wants to create a new Docusaurus blog post from a title, topic, or natural-language idea.

## Process

1. Parse the request into `title`, `description`, `tags`, and `date`.
   - `title` is required.
   - `description` should be plain text, 50-150 Chinese characters when practical; generate one if omitted.
   - `tags` should include at least one platform tag and one type tag.
   - `date` defaults to today.
2. Create `blog/YYYY-MM-DD-slug.md` with this frontmatter:

   ```yaml
   ---
   title: "文章标题"
   description: "一句话描述，用于 SEO 和首页展示"
   authors: yamahoney
   tags: [stm32, 入门教程]
   date: 2026-07-03
   ---
   ```

3. Add the article title, `<!-- truncate -->`, and a short section skeleton.
4. If the article should also live in docs, place the matching file under `docs/`; `sidebars.js` auto-registers docs by folder.
5. If the article is project-heavy, hand it to `/project-showcase` after creation.
6. Output the created file path and suggest `npm run start` for preview and `npm run build` for validation.

Use these tag buckets:
- Platform: `stm32`, `esp32`, `linux`
- Type: `入门教程`, `项目实战`, `干货分享`, `行业动态`, `开发工具`
- Difficulty: `入门`, `进阶`

---

## ⚠️ 双轨发布 = 仓库通用规则（所有知识库模块，已踩坑）

**本仓库所有知识库模块（STM32、ESP32、干货分享、开发工具）都遵循双轨发布**：同一内容同时存在于 blog（时间线展示）与 docs（知识库侧边栏）。**只创建 blog 文章，docs 侧边栏和知识库页面不会显示任何内容。**

| 模块 | blog 位置 | docs 位置 | 导航指向 |
|------|-----------|-----------|----------|
| STM32 | `blog/` | `docs/stm32/...` | `/docs/stm32/stm32-basics/intro` |
| ESP32 | `blog/` | `docs/esp32/` | `/docs/esp32/esp32-intro` |
| 干货分享 | `blog/` | `docs/sharing/` | `/docs/sharing/intro` |
| 开发工具 | `blog/` | `docs/开发工具/` | `/docs/开发工具/WSL2安装与基础配置` |

新增知识库笔记时**必须同时**：

1. **创建 blog 文章**：`blog/YYYY-MM-DD-slug.md`（完整 frontmatter + `<!-- truncate -->` + **完整正文**）
2. **复制为 docs 页面**：`docs/<模块>/<slug>.md`
   - frontmatter 改为 docs 风格：`id` + `title` + `sidebar_position`
   - 去掉 `authors`/`tags`/`date`，去掉 `<!-- truncate -->`
   - **正文保留完整内容**（仓库实际模式：blog 与 docs 都是完整版，非摘要版）
3. **干货分享特例**：还需在 `docs/sharing/intro.md` 的「笔记文章」列表追加相对链接 `[标题](./<slug>)`（该页是手动维护的文件列表）

docs 页面 frontmatter 参考（与 blog 不同）：

```yaml
---
id: cpp-byte-alignment
title: "C/C++ 字节对齐完全指南：从 struct 布局到 pragma pack"
sidebar_position: 2
---
```

---

## 导航栏与样式设置速查（2026-08 已定稿，勿改回）

导航栏当前配置（`docusaurus.config.js`）：

- 导航项全部为**普通链接**，无任何 dropdown/子菜单（用户要求格式统一）
- STM32：`{ to: '/docs/stm32/stm32-basics/intro', label: 'STM32', position: 'left' }`
- 顺序：首页 → 技术甄选 → STM32 → ESP32 → 干货分享 → 开发工具 → 行业动态 → 关于

字体样式（`src/css/custom.css`）——用户要求：**字体放大、导航项间距一致铺满整行、90% 缩放下仍一行完整显示**：

```css
:root {
  --ifm-font-size-base: 16px;   /* 全局基础字号，勿调小 */
}
.navbar__title { font-weight: 700; font-size: 1.15rem; }
.navbar__item { --ifm-navbar-item-padding-horizontal: 0.75rem; }
.navbar__link { font-size: 1rem; }
/* 导航项均匀铺满整行、间距一致 */
.navbar__items:not(.navbar__items--right) {
  justify-content: space-evenly;
  flex: 1 1 auto;
}
```
