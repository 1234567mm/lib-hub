---
name: blog-review
description: Review blog posts for frontmatter completeness, tag validity, filename/date consistency, truncate markers, and broken references. Use when the user asks to audit or repair blog content in this repo.
---

# blog-review

1. Check `title`, `description`, `authors`, `tags`, and `date`.
2. Require `authors: yamahoney` and at least two tags.
3. Require a matching filename date and `<!-- truncate -->`.
4. In full mode, check tag consistency and stale references across `blog/`.
5. Only auto-fix after the user confirms.
