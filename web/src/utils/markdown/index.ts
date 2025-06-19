import MarkdownIt from 'markdown-it';
import MarkdownHighlight from './markdown-highlight';

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

// 主要的 Markdown 渲染器，支持代码复制按钮等工具
const md = new MarkdownIt({
    breaks: true,
    linkify: true,
    highlight: MarkdownHighlight({ needTools: true }),
});

// 纯净版渲染器，不包含额外工具按钮
const pureHighLightMd = new MarkdownIt({
    breaks: true,
    linkify: true,
    highlight: MarkdownHighlight({ needTools: false }),
});

/**
 * 将 Markdown 文本转换为 HTML
 * @param markdown - Markdown 格式的文本
 * @returns 渲染后的 HTML 字符串
 */
export const markdownToHtml = (markdown: string): string => {
    if (!markdown) return '';
    return md.render(markdown);
};

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

/**
 * 尝试解析 JSON 字符串
 * @param text - JSON 字符串
 * @returns 解析后的对象，如果解析失败则返回原字符串
 */
const tryParseJson = (text: string): unknown => {
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
};

/**
 * 格式化对象为美化的 JSON 字符串
 * @param obj - 要格式化的对象
 * @returns 格式化后的 JSON 字符串
 */
const prettifyObj = (obj: unknown): string => {
    const rawObj = typeof obj === 'string' ? tryParseJson(obj) : obj;
    return JSON.stringify(rawObj, null, 2);
};

/**
 * 将对象渲染为 HTML 格式的 JSON 代码块
 * @param obj - 要渲染的对象
 * @returns HTML 格式的代码块
 * 
 * 示例:
 * ```typescript
 * const html = renderJson({ name: 'test' });
 * // 输出带语法高亮的 JSON 代码块
 * ```
 */
export const renderJson = (obj: unknown): string => {
    if (!obj) return '<span>Invalid JSON</span>';
    
    const jsonString = prettifyObj(obj);
    const md = "```json\n" + jsonString + "\n```";
    return pureHighLightMd.render(md);
};
