# 侧边栏配置规范

## 分类映射

| 分类 | 路径 | Sidebar Section | DocId Prefix |
|------|------|-----------------|--------------|
| stm32 | `docs/stm32/` | 入门教程 | `stm32/` |
| esp32 | `docs/esp32/` | ESP32知识库 | `esp32/` |
| sharing | `docs/sharing/` | 干货分享 | `sharing/` |
| industry | `docs/industry/` | 行业动态 | `industry/` |
| team | `docs/team/` | 科研团队 | `team/` |
| 开发工具 | `docs/开发工具/` | 开发工具 | `开发工具/` |

## 侧边栏结构示例

```js
{
  type: 'category',
  label: '入门教程',
  items: [
    'stm32/STM32知识库/STM32学习笔记(一)：那些你该知道的事儿',
    'stm32/STM32知识库/STM32学习笔记（二）存储器、电源与时钟体系',
    'stm32/STM32知识库/笔记三-工程1-点亮LED',
  ],
},
```

## 注册步骤

1. 读取当前 `sidebars.js`
2. 根据文件路径确定分类
3. 使用正确的 docId（参考 doc-id-rules.md）
4. 追加到对应分类的 `items` 数组
5. 写回 `sidebars.js`

## 注意事项

- docId 不能有 `.md` 后缀
- docId 必须与实际文件路径对应
- 数字前缀会被 Docusaurus 自动去除
