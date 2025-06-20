import type { Plugin } from '@/types/plugin';

// 已从 engine/render/types.ts 移动至 web/src/renderer/types.ts，UI 渲染相关类型应只在 web 端维护。
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
