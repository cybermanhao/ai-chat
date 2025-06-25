// engine/types/stream.ts
// 专门用于流式处理相关的类型定义

import type { MessageStatus } from './chat';

// 通用流式响应块
export interface StreamChunk {
  content: string;
  reasoning_content?: string;
  tool_content?: string | { name: string; arguments?: string };
  observation_content?: string;
  thought_content?: string;
  error?: string;
  status?: MessageStatus;
  tool_calls?: Array<{ function?: { name?: string; arguments?: string } }>;
}

// 流式会话状态（可扩展）
export interface StreamSessionState {
  isStreaming: boolean;
  currentMessageId: string | null;
  abortController: AbortController | null;
}

// 你可以根据需要继续扩展流式相关类型
