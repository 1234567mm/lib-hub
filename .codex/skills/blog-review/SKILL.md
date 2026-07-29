---
name: blog-review
description: Review blog posts for frontmatter completeness, tag validity, filename/date consistency, truncate markers, and broken references. Use when the user asks to audit or repair blog content in this repo.
---

# blog-review

Use `/blog-review <path>` for one post or `/blog-review blog/` for a full blog audit.

## Per-post checks

1. Check `title`, `description`, `authors`, `tags`, and `date`.
2. Require `authors: yamahoney`.
3. Require at least two tags, ideally one platform tag and one type tag.
4. Require `date` in `YYYY-MM-DD` format and matching the filename date.
5. Require `<!-- truncate -->`.
6. Check slug style: lowercase English words separated by `-`; use full-width Chinese parentheses `（）` instead of `()`.
7. Check internal links and image paths. Prefer site-root image paths such as `/lib-hub/img/...`.
8. Check `description` is plain text, without Markdown or unescaped quotes, and normally 50-150 Chinese characters.

## Full audit mode

1. Run `git diff --name-only` to identify added, changed, and deleted posts.
2. Check tag consistency across `blog/`.
3. Warn when a tag appears to be a typo or a newly introduced tag.
4. Check whether deleted posts still have inbound links.
5. Compare `blog/*.md` article count with what the blog index should expose.

Only auto-fix after the user confirms. Safe fixes include adding missing `<!-- truncate -->`, normalizing tags, escaping description quotes, and renaming files with half-width parentheses.
