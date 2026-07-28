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
