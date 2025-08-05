// engine/index.ts
// Engine 模块主入口

// 导出核心类型（避免重复导出冲突）
export type { 
  ChatMessage, 
  SystemMessage, 
  UserMessage, 
  AssistantMessage, 
  ToolMessage, 
  ClientNoticeMessage,
  MessageMetadata,
  EnrichedMessage,
  MessageRole,
  IMessageCardStatus
} from './types/chat';

export type { 
  LLMConfig as EngineLLMConfig,
  LLMConfigState 
} from './types/llm';

// 导出流处理模块
export * from './stream';

// 导出管理器模块
export * from './managers';

// 导出核心服务（避免 Tool 类型冲突）
export { MCPClient } from './service/mcpClient';
export { streamLLMChat, abortLLMStream } from './service/llmService';
export type { Tool as MCPTool } from './service/mcpClient';

// 导出核心工具函数
export { 
  generateUserMessageId, 
  generateAssistantMessageId, 
  generateToolMessageId 
} from './utils/messageIdGenerator';

export { llms } from './utils/llms'; 