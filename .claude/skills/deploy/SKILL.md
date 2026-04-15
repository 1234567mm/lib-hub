---
name: deploy
description: Deploy the blog to GitHub Pages. Use when user says "deploy", "发布", "部署", or "push to production".
disable-model-invocation: true
allowed-tools: Bash(git *), Bash(npm *)
---

# Deploy Blog

Deploy the Docusaurus blog to GitHub Pages.

## Deployment Steps

### 1. Build the site

```bash
npm run build
```

### 2. Deploy to GitHub Pages

```bash
npm run deploy
```

Or use Docusaurus directly:

```bash
npx docusaurus deploy
```

## Pre-deployment Checklist

- [ ] All docs reviewed
- [ ] No broken links
- [ ] Images display correctly
- [ ] Build succeeds
- [ ] Git status clean

## GitHub Pages URL

Site deployed to: https://1234567mm.github.io/lib-hub/

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check for syntax errors in docs |
| 404 on pages | Clear browser cache |
| Old content shown | Force refresh (Ctrl+Shift+R) |
| Deploy fails | Check GitHub token permissions |
