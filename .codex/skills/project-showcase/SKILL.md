---
name: project-showcase
description: Scan blog posts to identify strong project articles and produce structured showcase data for the tech-radar page. Use when the user asks to score, shortlist, or refresh showcase candidates from blog content.
---

# project-showcase

Use `/project-showcase` to refresh project candidates, `/project-showcase --report` to report without editing, or `/project-showcase <post>` to evaluate one post.

## Process

1. Scan `blog/*.md` for project-heavy posts.
2. Score by tag fit, title fit, length, code density, and tech-stack breadth.
   - Tags containing `项目实战` or `实战`: 5 points
   - Titles containing `项目`, `实战`, `制作`, or `开发`: 3 points
   - Content longer than 1000 Chinese characters: 2 points
   - Three or more fenced code blocks: 2 points
   - Three or more tags / broad tech stack: 2 points
3. Treat combined score >= 7 as a strong showcase candidate.
4. Extract `title`, `slug`, `date`, `stars`, `techStack`, `highlights`, and `summary`.
5. Emit a ranked report and the update target.
6. Refresh `data/projects.json` or `src/pages/tech-radar.js` only after the scan result is accepted.

## Rating scale

- 5 stars: complete project with principles, code, debugging, and strong originality
- 4 stars: complete practical project with core code
- 3 stars: useful project frame with partial implementation
- 2 stars: introductory project content with little code
- 1 star: concept-only content
