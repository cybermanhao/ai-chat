// XML 处理工具，适用于多端同构
export function parseXml(xmlStr) {
    if (typeof window !== 'undefined' && window.DOMParser) {
        return new window.DOMParser().parseFromString(xmlStr, 'text/xml');
    }
    // Node.js 环境可用第三方库（如 xmldom），此处仅做占位
    return null;
}
export function buildXml(obj) {
    // 简单对象转 xml 字符串（仅示例，复杂场景建议用 xmlbuilder2 等库）
    let xml = '';
    for (const key in obj) {
        xml += `<${key}>${obj[key]}</${key}>`;
    }
    return `<root>${xml}</root>`;
}
// 兼容 engine/utils/xml.ts 的 web 端导出，补充多端插件内容提取与处理
export function extractXmlContent(xml) {
    // 兼容旧实现，实际应由 engine/utils/xml.ts 提供
    const matches = [...xml.matchAll(/<xml>([\s\S]*?)<\/xml>/g)];
    return matches.map(m => ({ content: m[1], isPlugin: m[1].includes('<plugin') }));
}
export function extractPluginContent(xml) {
    // 兼容旧实现，实际应由 engine/utils/xml.ts 提供
    const matches = [...xml.matchAll(/<plugin name="([^"]+)">([\s\S]*?)<\/plugin>/g)];
    return matches.map(m => ({ pluginId: m[1], content: m[2] }));
}
export function processPluginContent(content, plugin) {
    // 兼容旧实现，实际应由 engine/utils/xml.ts 提供
    if (plugin && typeof plugin.render === 'function') {
        return plugin.render(content);
    }
    return content;
}
