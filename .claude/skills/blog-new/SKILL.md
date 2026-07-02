# blog-new

**命令**：`/blog-new`

**功能**：自然语言新建博客笔记，生成标准 frontmatter 与 markdown 骨架文件。

## 用法

```
/blog-new 标题: STM32 DMA 传输详解  分类: stm32, 进阶
/blog-new 帮我写一篇关于定时器PWM输出的文章
```

## 执行流程

1. 解析用户意图，提取 title / tags / description / date
2. 在 `blog/` 创建 `YYYY-MM-DD-slug.md`
3. 生成 frontmatter + `<!-- truncate -->` + 章节骨架
4. 输出文件路径，提示用 `npm start` 预览

## 标签体系

| 维度 | 可用标签 |
|------|----------|
| 芯片平台 | `stm32`, `esp32`, `linux` |
| 文章类型 | `入门教程`, `项目实战`, `干货分享`, `行业动态`, `开发工具` |
| 难度 | `入门`, `进阶` |

## 输出示例

```
✅ 已创建 blog/2026-07-03-stm32-dma-deep-dive.md
```
