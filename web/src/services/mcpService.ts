import { MCPService, callToolWithStatus } from '@engine/service/mcpService';
import type { Tool } from '@engine/service/mcpService';

export interface MCPResponse<T = unknown> {
  data: T;
  error?: string;
}

export type MCPTool = Tool;
export { MCPService, callToolWithStatus };
// 其他通用方法可直接通过 MCPService 实例调用
