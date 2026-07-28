---
name: project-showcase
description: Scan blog posts to identify strong project articles and produce structured showcase data for the tech-radar page. Use when the user asks to score, shortlist, or refresh showcase candidates from blog content.
---

# project-showcase

1. Scan `blog/` for project-heavy posts.
2. Score by tag fit, title fit, length, code density, and tech-stack breadth.
3. Emit a ranked report and the showcase update target.
4. Refresh the tech-radar data source only after the scan result is accepted.
