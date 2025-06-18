import type { ContentRenderer, RendererOptions } from './types';
import { MarkdownRenderer } from './markdownRenderer';
import { XmlPluginRenderer } from './xmlPluginRenderer';

export class ContentRendererManager {
  private renderers: ContentRenderer[] = [];

  constructor(options: RendererOptions = {}) {
    // 按优先级添加渲染器
    this.renderers = [
      new XmlPluginRenderer({
        plugins: options.plugins || [],
        pluginConfigs: options.pluginConfigs || {}
      }),
      new MarkdownRenderer()
    ].sort((a, b) => a.priority - b.priority);
  }

  async render(content: string): Promise<string> {
    let result = content;

    // 按优先级依次处理内容
    for (const renderer of this.renderers) {
      if (renderer.test(result)) {
        result = await renderer.render(result);
      }
    }

    return result;
  }
}
