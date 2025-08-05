import { MCPClient, callToolWithStatus } from '@engine/service/mcpClient';
import type { Tool } from '@engine/service/mcpClient';

export interface MCPResponse<T = unknown> {
  data: T;
  error?: string;
}

export type MCPTool = Tool;
export { MCPClient, callToolWithStatus };
// 其他通用方法可直接通过 MCPClient 实例调用
