import type { Tool } from '@/types/tool';
import { buttonPlugin } from './button';


// Define available tools
export const tools: Tool[] = [
  {

    ...buttonPlugin,
    description: '渲染可交互按钮组件',
  },

];
