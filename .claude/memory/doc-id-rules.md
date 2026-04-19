# docId 生成规则

## 核心规则

Docusaurus docId 是文档的唯一标识符，用于侧边栏和路由。

### 规则

1. **去掉 `docs/` 前缀**
2. **去掉 `.md` 后缀**
3. **对于 `YYYY-MM-DD-{slug}.md` 格式的文件，只保留 `{slug}` 部分（去掉日期前缀）**
4. **Docusaurus 自动去除文件名开头的 `NN_` 数字前缀**

### 示例

| 文件路径 | ✅ 正确 docId | ❌ 错误 docId |
|----------|---------------|---------------|
| `docs/stm32/2026-04-15-gpio-usage.md` | `stm32/gpio-usage` | `stm32/2026-04-15-gpio-usage` |
| `docs/stm32/入门教程/笔记三-工程1-点亮LED.md` | `stm32/入门教程/笔记三-工程1-点亮LED` | - |
| `docs/esp32/esp32-intro.md` | `esp32/esp32-intro` | - |
| `docs/sharing/git-local-github.md` | `sharing/git-local-github` | - |
| `docs/开发工具/01_WSL2安装.md` | `开发工具/WSL2安装` | - |

## 错误后果

docId 错误会导致 Docusaurus 启动时报错：
```
These sidebar document ids do not exist:
- stm32/2026-04-15-gpio-usage
```

## 应用场景

- 创建新文档时，生成正确的 docId
- 注册侧边栏时，使用正确的 docId
- 更新交叉链接时，使用正确的 docId
