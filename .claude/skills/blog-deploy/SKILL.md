# blog-deploy

**命令**：`/blog-deploy`

**功能**：自动 git 提交并推送到 GitHub，触发 CI/CD 在线构建部署。

## 用法

```
/blog-deploy 修复DMA文章中的typo
/blog-deploy feat: 新增 STM32 PWM 文章
```

## 执行流程

1. 运行 `git status` 了解当前变更
2. 生成 conventional commit 消息（`post:` / `docs:` / `fix:` / `chore:`）
3. 运行 `npm run build` 前置构建检查
4. 构建失败自动中止，不推送
5. 构建通过 → `git add -A && git commit -m "..." && git push`
6. 输出 GitHub Actions 构建链接

## commit 类型

| type | 适用场景 |
|------|----------|
| `post` | 新增/更新博客文章 |
| `docs` | 更新知识库文档 |
| `fix` | 修复内容错误或断链 |
| `chore` | 配置/构建脚本变更 |

## 输出示例

```
✅ 已提交并推送
提交信息: post: 新增 STM32 DMA 传输详解文章
🌐 在线构建中: https://github.com/1234567mm/lib-hub/actions
```
