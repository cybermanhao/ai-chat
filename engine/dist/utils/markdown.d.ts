/**
 * 将 Markdown 文本转换为 HTML
 * @param markdown - Markdown 格式的文本
 * @returns 渲染后的 HTML 字符串
 */
export declare const markdownToHtml: (markdown: string) => string;
/**
 * 尝试解析 JSON 字符串
 * @param text - JSON 字符串
 * @returns 解析后的对象，如果解析失败则返回原字符串
 */
export declare const tryParseJson: (text: string) => unknown;
/**
 * 格式化对象为美化的 JSON 字符串
 * @param obj - 要格式化的对象
 * @returns 格式化后的 JSON 字符串
 */
export declare const prettifyObj: (obj: unknown) => string;
/**
 * 将对象渲染为 HTML 格式的 JSON 代码块
 * @param obj - 要渲染的对象
 * @returns HTML 格式的代码块
 */
export declare const renderJson: (obj: unknown) => string;
//# sourceMappingURL=markdown.d.ts.map