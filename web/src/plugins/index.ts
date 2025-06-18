import type { Tool } from '@/types/tool';
import { buttonPlugin } from './button';
import { xmlRendererPlugin } from './xmlRenderer';

// Define available tools
export const tools: Tool[] = [
  {
    id: 'button',
    ...buttonPlugin,
    description: '渲染可交互按钮组件',
  },
  {
    id: 'xml-renderer',
    ...xmlRendererPlugin,
    description: '渲染XML格式自定义组件',
  }
];
