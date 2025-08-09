/**
 * ================================================================================
 * 注意：此文件已被废弃，迁移到 MessageBridgeV2 系统
 * ================================================================================
 * 
 * 迁移说明：
 * - V1 系统：MessageBridge (此文件) - 已废弃
 * - V2 系统：MessageBridgeV2 (messageBridgeV2.ts) - 当前使用
 * 
 * 请使用新的 V2 系统：
 * - import { createMessageBridge } from './messageBridgeFactoryV2'
 * 
 * V2 系统优势：
 * - 使用新的 runtimeContext 统一环境检测
 * - 更好的协议适配和错误处理
 * - 与 TaskLoop 完全兼容
 * 
 * 迁移时间：2025-01-09
 * ================================================================================
 */

// 错误提示：引导用户使用新的 V2 系统
console.warn(
  '⚠️ MessageBridge V1 已废弃！请使用 MessageBridgeV2 系统'
);

/* 
================================================================================
以下为已废弃的 V1 MessageBridge 实现，保留供参考
================================================================================

// engine/service/messagebridge.ts
// MessageBridge: 统一协议/多端适配层
// 只负责 TaskLoop 与服务端（MCP/LLM/Web/Electron/SSC）之间的协议消息桥接和事件分发，不处理 UI 本地事件（add/update）。

export type MessageBridgeEvent =
  | 'chunk'
  | 'toolcall'
  | 'toolresult'
  | 'status'
  | 'done'
  | 'error'
  | 'abort';

export interface MessageBridgeOptions {
  env: string; // 当前环境类型: 'web' | 'electron' | 'ssc' 等
  mcpClient?: any; // MCPClient 实例
  llmService?: any; // LLM 服务实例
  [key: string]: any; // 其它适配参数
}

// ... [514行的完整V1实现已省略] ...

================================================================================
*/

// 为了向后兼容，提供一个最小的代理实现
export class MessageBridge {
  constructor(options: any) {
    console.error('⚠️ 使用了废弃的 MessageBridge V1！请迁移到 MessageBridgeV2');
    throw new Error('MessageBridge V1 已废弃，请使用 MessageBridgeV2 系统');
  }
}

export interface MessageBridgeOptions {
  env: string;
  mcpClient?: any;
  llmService?: any;
  [key: string]: any;
}

export type MessageBridgeEvent = 'chunk' | 'toolcall' | 'toolresult' | 'status' | 'done' | 'error' | 'abort';