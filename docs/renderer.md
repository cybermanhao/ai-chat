# Markdown 渲染为何会显示为 HTML 标签？

在 React 组件中，直接将 markdownToHtml(content) 的结果插入 JSX，如：

```tsx
{markdownToHtml(content)}
```

会导致 HTML 字符串被当作普通文本渲染，而不是被浏览器解析为 HTML 标签。

**正确做法：**

应使用 React 的 `dangerouslySetInnerHTML`，如下：

```tsx
<div dangerouslySetInnerHTML={{ __html: markdownToHtml(content) }} />
```

这样，HTML 字符串会被浏览器正确渲染为标签和结构。

> 详见 web/src/pages/Chat/components/MessageCard/index.tsx 的修复方案。

---

## 相关安全提示
- 仅对可信内容使用 `dangerouslySetInnerHTML`，防止 XSS 攻击。
- markdownToHtml 工具应做适当的 HTML 转义和过滤。

---

## 参考
- [React 官方文档：dangerouslySetInnerHTML](https://react.dev/reference/react/dom-elements#dangerouslysetinnerhtml)
- [Markdown 渲染与 XSS 防护](https://marked.js.org/using_advanced#options)
