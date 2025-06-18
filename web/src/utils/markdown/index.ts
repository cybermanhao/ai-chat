import MarkdownIt from 'markdown-it';
import MarkdownHighlight from './markdown-highlight';

const md = new MarkdownIt({
    breaks: true,
    linkify: true,
    highlight: MarkdownHighlight({ needTools: true }),
});

export const markdownToHtml = (markdown: string) => {
    if (!markdown) return '';
    return md.render(markdown);
};

const pureHighLightMd = new MarkdownIt({
    breaks: true,
    linkify: true,
    highlight: MarkdownHighlight({ needTools: false }),
});

export const copyToClipboard = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy:', error);
        return false;
    }
};

const tryParseJson = (text: string) => {
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
};

const prettifyObj = (obj: unknown) => {
    const rawObj = typeof obj === 'string' ? tryParseJson(obj) : obj;
    return JSON.stringify(rawObj, null, 2);
};

export const renderJson = (obj: unknown) => {
    if (!obj) return '<span>Invalid JSON</span>';
    
    const jsonString = prettifyObj(obj);
    const md = "```json\n" + jsonString + "\n```";
    return pureHighLightMd.render(md);
};
