// TaskLoop SDK for SSC Mode
// 专门为SSC环境构建的客户端SDK
// 构建时间: 2025-08-06T09:03:09.631Z

// 核心导出
export { TaskLoop } from './stream/task-loop';
export type { TaskLoopEvent } from './stream/task-loop';
export type { EnrichedMessage, IMessageCardStatus } from './types/chat';
export type { ToolCall, EnhancedChunk } from './stream/streamHandler';

// MCP相关
export { MCPClient } from './service/mcpClient';
export type { Tool } from './service/mcpClient';

// 工具函数
export { generateUserMessageId } from './utils/messageIdGenerator';

// SDK配置和工厂函数
import { TaskLoop } from './stream/task-loop';

/**
 * SSC模式TaskLoop配置
 * 注意：不需要apiKey，由SSC后端管理
 */
export interface SSCTaskLoopConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  tools?: any[];
  parallelToolCalls?: boolean;
  /** SSC后端API地址，默认http://localhost:8080 */
  sscApiBaseUrl?: string;
}

export interface SSCTaskLoopOptions {
  chatId: string;
  history?: any[];
  config: SSCTaskLoopConfig;
  mcpClient?: any;
}

/**
 * 创建SSC模式TaskLoop
 * 推荐的SDK使用方式
 */
export function createTaskLoop(options: SSCTaskLoopOptions): TaskLoop {
  // 设置SSC API地址
  if (options.config.sscApiBaseUrl) {
    if (typeof process !== 'undefined' && process.env) {
      process.env.SSC_API_BASE_URL = options.config.sscApiBaseUrl;
    }
  }
  
  return new TaskLoop({
    chatId: options.chatId,
    history: options.history,
    config: {
      ...options.config,
      // 移除客户端不需要的配置
      apiKey: undefined,
      baseURL: undefined,
    },
    mcpClient: options.mcpClient,
  });
}

export const SDK_VERSION = '1.0.0';
export const SDK_MODE = 'ssc';
export const SDK_BUILD_TIME = '2025-08-06T09:03:09.633Z';
