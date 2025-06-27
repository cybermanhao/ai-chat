// ========================================
// [插件系统已禁用] - 插件系统尚未完善，暂时停止开发
// 本文件保留渲染器类定义，但注释掉插件渲染逻辑
// 如需恢复插件功能，请取消相关注释并完善插件系统实现
// ========================================

// [插件系统已禁用] - 注释掉插件相关的导入
// import { extractXmlContent, extractPluginContent, processPluginContent } from '@engine/utils/xml';
// import type { ContentRenderer, RenderContext } from './types';

// [插件系统已禁用] - 保留类定义，但注释掉插件渲染逻辑
/*
export class XmlPluginRenderer implements ContentRenderer {
  name = 'xml-plugin';
  priority = 0; // 首先执行
  private context: RenderContext;

  constructor(context: RenderContext) {
    this.context = context;
  }

  test(content: string) {
    return content.includes('<xml>');
  }

  render(content: string) {
    let processedContent = content;
    const xmlBlocks = extractXmlContent(processedContent);

    for (const block of xmlBlocks) {
      if (block.isPlugin) {
        const pluginBlocks = extractPluginContent(block.content);
        let xmlContent = block.content;

        for (const pluginBlock of pluginBlocks) {
          const plugin = this.context.plugins.find(p => p.id === pluginBlock.pluginId);
          const config = plugin ? this.context.pluginConfigs[plugin.id] : null;
          
          if (plugin && config?.enabled) {
            const processed = processPluginContent(pluginBlock.content, plugin);
            xmlContent = xmlContent.replace(
              new RegExp(`<plugin name="${pluginBlock.pluginId}">[\\s\\S]*?<\\/plugin>`, 'g'),
              processed
            );
          }
        }

        processedContent = processedContent.replace(
          new RegExp(`<xml>${block.content.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</xml>`, 'g'),
          xmlContent
        );
      }
    }

    return processedContent;
  }
}
*/

// [插件系统已禁用] - 导出空的渲染器类，防止其他模块引用出错
export class XmlPluginRenderer {
  name = 'xml-plugin';
  priority = 0;
  
  constructor(context: any) {
    console.log('[插件系统已禁用] XmlPluginRenderer 已停用');
  }

  test(content: string) {
    return false; // 始终返回 false，不处理任何内容
  }

  render(content: string) {
    return content; // 直接返回原内容，不进行任何处理
  }
}

// 已从 engine/render/xmlPluginRenderer.ts 移动至 web/src/renderer/xmlPluginRenderer.ts，UI 渲染相关实现应只在 web 端维护。
