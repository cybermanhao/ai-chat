import { extractXmlContent, extractPluginContent, processPluginContent } from '@/utils/xml';
import type { ContentRenderer, RenderContext } from './types';

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
