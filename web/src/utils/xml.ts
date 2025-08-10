// ========================================
// [插件系统已禁用] - 插件系统尚未完善，暂时停止开发
// 本文件保留XML解析工具函数，但注释掉插件相关的处理逻辑
// 如需恢复插件功能，请取消相关注释并完善插件系统实现
// ========================================

// XML 解析和渲染相关的工具函数

// 解析 XML 标签的属性
// XML解析工具函数
function parseAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const regex = /(\w+)="([^"]*)"/g;
  let match;
  
  while ((match = regex.exec(attrString)) !== null) {
    attrs[match[1]] = match[2];
  }
  
  return attrs;
}

// 解析单个 XML 标签
function parseTag(xml: string, tagName: string): Array<{
  content: string;
  attrs: Record<string, string>;
}> {
  const results: Array<{ content: string; attrs: Record<string, string> }> = [];
  const regex = new RegExp(`<${tagName}([^>]*)>([\\s\\S]*?)<\\/${tagName}>`, 'g');
  let match;

  while ((match = regex.exec(xml)) !== null) {
    results.push({
      attrs: parseAttributes(match[1]),
      content: match[2].trim()
    });
  }

  return results;
}

// [插件系统已禁用] - 注释掉插件相关的XML处理函数实现
/*
// 提取插件块的内容
function extractPluginContent(xml: string): Array<{
  pluginId: string;
  content: string;
}> {
  const results: Array<{ pluginId: string; content: string }> = [];
  const regex = /<plugin name="([^"]+)">([\s\S]*?)<\/plugin>/g;
  let match;

  while ((match = regex.exec(xml)) !== null) {
    results.push({
      pluginId: match[1],
      content: match[2].trim()
    });
  }

  return results;
}

// 处理单个插件的内容
function processPluginContent(
  content: string,
  plugin: import('@/types/plugin').Plugin
): string {
  let processedContent = content;
  
  // 处理每个标签
  Object.entries(plugin.xmlTags).forEach(([tagName, tagDef]) => {
    const tags = parseTag(processedContent, tagName);
    tags.forEach(({ content: tagContent, attrs }) => {
      const regex = new RegExp(
        `<${tagName}[^>]*>${tagContent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</${tagName}>`,
        'g'
      );
      const rendered = tagDef.render(tagContent, attrs);
      processedContent = processedContent.replace(regex, rendered);
    });
  });
  
  return processedContent;
}
*/

// [插件系统已禁用] - 导出空的插件处理函数，防止其他模块引用出错
function extractPluginContent(xml: string): Array<{ pluginId: string; content: string }> {
  console.log('[插件系统已禁用] extractPluginContent 已停用');
  return [];
}

function processPluginContent(content: string, plugin: any): string {
  console.log('[插件系统已禁用] processPluginContent 已停用');
  return content;
}

// 转义 HTML
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 提取并处理XML块
function extractXmlContent(text: string): Array<{
  content: string;
  isPlugin: boolean;
}> {
  const results: Array<{ content: string; isPlugin: boolean }> = [];
  const regex = /<xml>([\s\S]*?)<\/xml>/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const content = match[1].trim();
    // 检查第一层是否是 plugin 标签
    const isPlugin = /^<plugin[^>]*>[\s\S]*<\/plugin>$/.test(content.trim());
    results.push({
      content,
      isPlugin
    });
  }

  return results;
}

export {
  parseAttributes,
  parseTag,
  extractPluginContent,
  escapeHtml,
  processPluginContent,
  extractXmlContent
};
