<div align="center">

<div style="padding:8px;border-radius:100%;background:white;width:200px;height:200px">
<img src="./img/logo.png" width=200 height=200>
</div>

# 山药泥酸奶的技术窝

![GitHub repository stars badge for lib-hub project](https://img.shields.io/github/stars/1234567mm/lib-hub?style=social)

</div>

---

## 项目概述

| 项目 | 信息 |
|------|------|
| **名称** | 山药泥酸奶的技术窝 |
| **框架** | Docusaurus 3.7.0 |
| **类型** | 个人技术博客 |
| **主题** | 嵌入式开发、智能硬件 |
| **部署** | GitHub Pages |
| **URL** | https://1234567mm.github.io/lib-hub/ |

## 目录结构

```
lib-hub/
├── blog/             # 博客文章 (YYYY-MM-DD-slug.md)
├── docs/             # 文档页面 (STM32/ESP32/Sharing/Team/开发工具)
├── src/              # React 组件与自定义页面
│   ├── pages/        # 首页、技术甄选页、行业动态
│   └── css/          # 自定义样式
├── static/           # 静态资源 (img/)
├── .claude/          # AI 项目级 Skills 配置
│   └── skills/       # Skills 定义（兼容 Claude Code 等工具）
├── .github/          # GitHub Actions CI/CD
├── sidebars.js       # 侧边栏配置
└── docusaurus.config.js
```

## 常用命令

```bash
npm run start    # 本地预览
npm run build    # 构建
npm run deploy   # 部署到 GitHub Pages
npm run clear    # 清除缓存
```

## 项目级 Skills

以下 Skill 是项目内建的 AI 辅助命令，可通过对话直接调用：

### `/blog-new` — 自然语言新建博客笔记

```
/blog-new 标题: STM32 DMA 传输详解  分类: stm32, 进阶
/blog-new 帮我写一篇关于定时器PWM输出的文章
```

**功能**：解析标题/标签/描述 → 创建 `blog/YYYY-MM-DD-slug.md` → 生成 frontmatter + `<!-- truncate -->` + 章节骨架 → 输出文件路径

### `/blog-review` — 笔记内容审查与命名优化

```
/blog-review blog/2026-07-03-article.md    # 单篇审查
/blog-review blog/                          # 全量审查
```

**功能**：检查 frontmatter 完整性（title/description/authors/tags/date）、description 长度 50-150 字、truncate 标记、文件名括号规范、标签有效性、内部链接、图片路径；全量模式额外校验 tag 一致性、文章计数、被删文章引用清理

### `/blog-deploy` — 仓库提交与在线构建

```
/blog-deploy 修复DMA文章中的typo
/blog-deploy feat: 新增 STM32 PWM 文章
```

**功能**：`git status` → 生成 conventional commit 消息 → `git add -A && git commit && git push` → 输出 GitHub Actions 构建链接。构建失败自动中止不推送。

### `/project-showcase` — 项目甄选与展示管理

```
/project-showcase              # 全量扫描并更新
/project-showcase --report     # 仅输出报告
/project-showcase blog/xxx.md  # 单篇评估
```

**功能**：扫描 blog 文章，按 5 维度评分（标签匹配/标题匹配/内容长度/代码含量/技术栈丰富度）识别含金量项目 → 评定 ⭐1-5 级 → 提炼技术亮点 → 更新技术甄选页面的展示数据

## 博客发布流程

```
1. 创建文章: /blog-new "STM32 PWM 输出详解"
2. 编写内容
3. 本地预览: npm start
4. 审查: /blog-review blog/2026-07-03-article.md
5. 部署: /blog-deploy "新增 STM32 PWM 文章"
```

---

## 许可证

本项目采用 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) 许可证

- 个人使用、学习、研究、非商业项目：不需要署名，不需要申请
- 公开发布衍生作品（文章、工具、课程等）：请注明来源
- 商业用途：需要单独授权，请联系作者

---

## 作者

- 抖音：[山药泥酸奶](https://www.douyin.com/user/self?from_tab_name=main&showTab=post)
- 小红书：[山药泥酸奶](https://www.xiaohongshu.com/user/profile/5d0d7fa000000001002850b)
