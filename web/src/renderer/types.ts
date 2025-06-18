import type { Plugin } from '@/types/plugin';

export interface ContentRenderer {
  name: string;
  priority: number;
  test: (content: string) => boolean;
  render: (content: string) => Promise<string> | string;
}

export interface RenderContext {
  plugins: Plugin[];
  pluginConfigs: Record<string, Record<string, unknown>>;
}

export interface RendererOptions {
  plugins?: Plugin[];
  pluginConfigs?: Record<string, Record<string, unknown>>;
}
