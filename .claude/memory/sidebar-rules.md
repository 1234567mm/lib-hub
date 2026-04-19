# 侧边栏配置规范

## 分类映射

**唯一事实来源**：请始终参考项目根目录下的 `directories.json` 文件。该文件定义了所有支持的分类及其对应的目录（`dir`）和侧边栏标签（`label`）。

## 侧边栏结构示例

```js
{
  type: 'category',
  label: '入门教程',
  items: [
    'stm32/入门教程/STM32学习笔记(一)：那些你该知道的事儿',
    'stm32/入门教程/STM32学习笔记（二）存储器、电源与时钟体系',
    'stm32/入门教程/笔记三-工程1-点亮LED',
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
