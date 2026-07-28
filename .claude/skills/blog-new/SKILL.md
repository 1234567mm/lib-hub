---
name: blog-new
description: Create a new Docusaurus blog post from a natural-language prompt, generating the filename, frontmatter, and markdown scaffold. Use when the user asks to create or scaffold a blog article in this repo.
---

# blog-new

1. Parse the request into `title`, `description`, `tags`, and `date`.
2. Create `blog/YYYY-MM-DD-slug.md` with `authors: yamahoney`.
3. Add `<!-- truncate -->` and a short section skeleton.
4. If the article should also live in docs, place the matching file under `docs/`; `sidebars.js` auto-registers docs by folder.
5. If the article is a project candidate, hand it to `/project-showcase` after creation.

Use these tag buckets:
- Platform: `stm32`, `esp32`, `linux`
- Type: `入门教程`, `项目实战`, `干货分享`, `行业动态`, `开发工具`
- Difficulty: `入门`, `进阶`
