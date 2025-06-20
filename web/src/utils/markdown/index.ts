export * from '@engine/utils/markdown';

/**
 * Markdown渲染器配置
 * - breaks: 启用换行符转换为 <br>
 * - linkify: 自动识别链接
 * - highlight: 代码高亮配置
 * 
 * 使用示例:
 * ```typescript
 * // 渲染普通 Markdown
 * const html = markdownToHtml('# Hello\nThis is **bold**');
 * // 输出: <h1>Hello</h1><p>This is <strong>bold</strong></p>
 * 
 * // 渲染带代码块的 Markdown
 * const code = markdownToHtml('```js\nconsole.log("hi")\n```');
 * // 输出: <pre><code class="language-js">console.log("hi")</code></pre>
 * 
 * // 渲染 JSON 对象
 * const json = renderJson({ name: 'test', age: 18 });
 * // 输出: <pre><code class="language-json">{\n  "name": "test",\n  "age": 18\n}</code></pre>
 * ```
 */

/**
 * 复制文本到剪贴板
 * @param text - 要复制的文本
 * @returns 是否复制成功
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy:', error);
        return false;
    }
};
