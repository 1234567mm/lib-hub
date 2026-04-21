---
name: preview
description: 预览 Docusaurus 博客，自动同步文档并检查图片
disable-model-invocation: true
allowed-tools: Bash, Read, Glob, Grep, Edit, Write
---

# preview 技能

本地预览 Docusaurus 博客，自动同步文档并检查图片。

## 执行步骤

### Step 1: 同步文档

调用 core.js 同步逻辑：
```javascript
const core = require('../sync-docs/core.js');

// 读取上下文
const ctx = core.readContext();

// 对比新增/删除文件
const { added, removed } = core.diffDocIds(ctx.sidebarDocIds, 'docs');

// 更新上下文
core.updateContextDocIds(ctx,
  added.map(f => f.docId),
  removed
);
core.writeContext(ctx);
```

### Step 2: 图片检查

扫描新增/修改文件中的图片引用：
- 查找 `![alt](path)` 格式
- 查找 `<img src="path">` 格式
- 验证图片文件是否存在
- 报告缺失图片

### Step 3: 端口检测

检查端口 3000 是否被占用：
```bash
netstat -ano | findstr :3000
```

如被占用，自动终止进程。

### Step 4: 启动服务

```bash
npm run start
```

预览地址：http://localhost:3000/lib-hub/

## 输出格式

```
## Pre-flight Check

### 同步状态
- 新增文件: N
- 删除文件: N
- 上下文已更新

### 图片检查
- 检查文件: N
- 缺失图片: M
  - img/xxx.png (引用自: docs/xxx.md)

### 端口状态
- Port 3000: Free | Occupied (killed)

Starting preview server...
```

## 注意事项

- 图片路径支持：`img/`、`../img/`、`/img/` 格式
- 缺失图片需手动补充或修正路径
- CSS 更改触发热重载
- docusaurus.config.js 更改需完全重启
