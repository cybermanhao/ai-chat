import MarkdownIt from 'markdown-it';
import MarkdownHighlight from './markdown-highlight';

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
 * 尝试解析 JSON 字符串
 * @param text - JSON 字符串
 * @returns 解析后的对象，如果解析失败则返回原字符串
 */
export const tryParseJson = (text: string): unknown => {
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
export const prettifyObj = (obj: unknown): string => {
    const rawObj = typeof obj === 'string' ? tryParseJson(obj) : obj;
    return JSON.stringify(rawObj, null, 2);
};

/**
 * 将对象渲染为 HTML 格式的 JSON 代码块
 * @param obj - 要渲染的对象
 * @returns HTML 格式的代码块
 */
export const renderJson = (obj: unknown): string => {
    if (!obj) return '<span>Invalid JSON</span>';
    const jsonString = prettifyObj(obj);
    const mdStr = "```json\n" + jsonString + "\n```";
    return pureHighLightMd.render(mdStr);
};
