---
name: deploy
description: Deploy the blog to GitHub Pages
disable-model-invocation: true
allowed-tools: Bash(git *), Bash(npm *)
---

# Deploy Blog

Deploy the Docusaurus blog to GitHub Pages.

## Deployment Steps

### 1. Pre-deployment Check

Check git status and memory state:

```bash
git status
tail -20 .claude/memory/issue-troubleshooting.md
```

### 2. Build the site

```bash
npm run build
```

### 3. Commit and push

```bash
git add .
git commit -m "your commit message"
git push origin main
```

### 4. CI/CD Auto Flow

| Step | Trigger | Action |
|------|---------|--------|
| validate | every push | sidebar-validate, build, link check |
| on success | validate passes | build-success-tracker marks issues fixed |
| on failure | validate fails | issue-tracker records new issues |
| deploy | main branch only | deploys to GitHub Pages |

## CI Workflow Files

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | CI validation + deploy |
| `.claude/hooks/sidebar-validate.py` | Validate docIds |
| `.claude/hooks/issue-tracker.py` | Record failure issues |
| `.claude/hooks/build-success-tracker.py` | Mark issues as fixed |

## Post-deployment Check

```bash
tail -50 .claude/memory/issue-troubleshooting.md
```

## GitHub Pages URL

https://1234567mm.github.io/lib-hub/

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check docs syntax errors |
| 404 on pages | Clear browser cache |
| Old content shown | Force refresh |
| Deploy fails | Check GitHub token |
