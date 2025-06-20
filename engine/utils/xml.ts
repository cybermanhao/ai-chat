// XML 处理工具，适用于多端同构
export function parseXml(xmlStr: string): Document | null {
  if (typeof window !== 'undefined' && window.DOMParser) {
    return new window.DOMParser().parseFromString(xmlStr, 'text/xml');
  }
  // Node.js 环境可用第三方库（如 xmldom），此处仅做占位
  return null;
}

export function buildXml(obj: Record<string, any>): string {
  // 简单对象转 xml 字符串（仅示例，复杂场景建议用 xmlbuilder2 等库）
  let xml = '';
  for (const key in obj) {
    xml += `<${key}>${obj[key]}</${key}>`;
  }
  return `<root>${xml}</root>`;
}
