// Markdown 代码高亮工具，适用于多端同构
interface HighlightOptions {
    needTools?: boolean;
}

const MarkdownHighlight = ({ needTools = false }: HighlightOptions) => {
    return (str: string, lang: string) => {
        if (!lang) return str;

        try {
            const highlightedCode = `<pre class="hljs language-${lang}"><code>${str}</code></pre>`;
            
            if (!needTools) return highlightedCode;

            return `
                <div class="code-block">
                    <div class="code-block-header">
                        <span class="code-lang">${lang}</span>
                        <button class="copy-btn" data-code="${encodeURIComponent(str)}">复制</button>
                    </div>
                    ${highlightedCode}
                </div>
            `;
        } catch (err) {
            // 多端环境下不直接输出 console
            return str;
        }
    };
}

export default MarkdownHighlight;
