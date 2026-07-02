# blog-review

**命令**：`/blog-review`

**功能**：审查 blog 文章的前端元数据和内容规范，支持单篇和全量模式。

## 用法

```
/blog-review blog/2026-07-03-article.md    # 单篇审查
/blog-review blog/                          # 全量审查
```

## 审查清单

| # | 检查项 | 标准 |
|---|--------|------|
| 1 | title 是否为空 | 必填，不超过 60 字 |
| 2 | description 长度 | 50-150 字 |
| 3 | description 不含 Markdown/未转义引号 | 纯文本 |
| 4 | authors 是否存在 | 必须为 `yamahoney` |
| 5 | tags 是否完整 | ≥2 个（1 平台 + 1 类型） |
| 6 | tags 是否在已有标签范围内 | 不引入拼写错误 |
| 7 | date 格式 | `YYYY-MM-DD` |
| 8 | 文件名日期与 frontmatter date 一致 | 必须匹配 |
| 9 | 存在 `<!-- truncate -->` | 必须 |

全量模式额外检查：
- tag 一致性：所有文章用到的 tag 都能正常聚合
- 新增 tag 注册：首次出现的 tag 确认是拼写还是新增
- orphan tag：删除文章后是否有 tag 不再被引用
- 文章计数：blog 文件数 vs 展示数一致
- 被删文章引用清理：检查其他文章是否还有指向已删文章的链接

## 自动修复

当用户确认后，可自动修复：
- 添加缺失的 `<!-- truncate -->`
- 修正文件名括号
- 标准化 tags 格式
- 修复 description 引号转义
