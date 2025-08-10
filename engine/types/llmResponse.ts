// engine/types/llmResponse.ts
// LLM返回数据的联合类型定义

import type { ChatCompletionMessage, ChatCompletionChunk } from 'openai/resources/chat/completions';
import type { DeepSeekAssistantResponse } from '../adapters/deepseekAdapter';

// 基础消息类型
export interface BaseLLMMessage {
  role: 'assistant';
  content: string | null;
  id?: string;
  timestamp?: number;
}

// 工具调用相关类型
export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolMessage {
  role: 'tool';
  content: string;
  tool_call_id: string;
  name?: string;
}

// OpenAI响应类型
export interface OpenAIResponse extends BaseLLMMessage {
  tool_calls?: ToolCall[];
  finish_reason?: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
}

// DeepSeek响应类型（包含推理内容）
export interface DeepSeekResponse extends BaseLLMMessage {
  tool_calls?: ToolCall[];
  reasoning_content?: string; // DeepSeek特有的推理内容
  finish_reason?: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
}

// 流式响应块类型
export interface BaseLLMChunk {
  id?: string;
  model?: string;
  created?: number;
  object?: 'chat.completion.chunk';
}

export interface OpenAIChunk extends BaseLLMChunk {
  choices: Array<{
    index: number;
    delta: {
      role?: 'assistant';
      content?: string;
      tool_calls?: Array<{
        index: number;
        id?: string;
        type?: 'function';
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
    finish_reason?: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
  }>;
}

export interface DeepSeekChunk extends BaseLLMChunk {
  choices: Array<{
    index: number;
    delta: {
      role?: 'assistant';
      content?: string;
      reasoning_content?: string; // DeepSeek推理内容增量
      tool_calls?: Array<{
        index: number;
        id?: string;
        type?: 'function';
        function?: {
          name?: string;
          arguments?: string;
        };
      }>;
    };
    finish_reason?: 'stop' | 'length' | 'tool_calls' | 'content_filter' | null;
  }>;
}

// 联合类型定义
export type UnifiedLLMResponse = OpenAIResponse | DeepSeekResponse;
export type UnifiedLLMChunk = OpenAIChunk | DeepSeekChunk;

// 完整的API响应类型（包含原始响应）
export interface LLMAPIResponse<T = UnifiedLLMResponse> {
  data: T;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    reasoning_tokens?: number; // DeepSeek推理tokens
  };
  metadata?: {
    provider: 'openai' | 'deepseek' | 'openai-compatible';
    baseURL: string;
    requestId?: string;
  };
}

// 流式处理事件类型
export type LLMStreamEvent = 
  | { type: 'start'; data: { model: string; provider: string } }
  | { type: 'chunk'; data: UnifiedLLMChunk }
  | { type: 'content'; data: { content: string; delta?: string } }
  | { type: 'reasoning'; data: { reasoning_content: string; delta?: string } } // DeepSeek推理内容
  | { type: 'tool_call'; data: { tool_call: ToolCall; index: number } }
  | { type: 'done'; data: UnifiedLLMResponse }
  | { type: 'error'; data: { error: Error; code?: string } }
  | { type: 'abort'; data: { reason: string } };

// 类型守卫函数
export function isOpenAIResponse(response: UnifiedLLMResponse): response is OpenAIResponse {
  return !('reasoning_content' in response);
}

export function isDeepSeekResponse(response: UnifiedLLMResponse): response is DeepSeekResponse {
  return 'reasoning_content' in response;
}

export function isOpenAIChunk(chunk: UnifiedLLMChunk): chunk is OpenAIChunk {
  return !chunk.choices[0]?.delta.hasOwnProperty('reasoning_content');
}

export function isDeepSeekChunk(chunk: UnifiedLLMChunk): chunk is DeepSeekChunk {
  return chunk.choices[0]?.delta.hasOwnProperty('reasoning_content');
}

// 响应转换工具函数
export function normalizeResponse(response: UnifiedLLMResponse): BaseLLMMessage & {
  tool_calls?: ToolCall[];
  reasoning_content?: string;
  finish_reason?: string | null;
} {
  const base = {
    role: response.role,
    content: response.content,
    id: response.id,
    timestamp: response.timestamp
  };

  if (isDeepSeekResponse(response)) {
    return {
      ...base,
      tool_calls: response.tool_calls,
      reasoning_content: response.reasoning_content,
      finish_reason: response.finish_reason
    };
  }

  return {
    ...base,
    tool_calls: response.tool_calls,
    finish_reason: response.finish_reason
  };
}

// 响应内容提取函数
export function extractContent(response: UnifiedLLMResponse): {
  content: string | null;
  reasoning_content?: string;
  has_tool_calls: boolean;
  tool_calls?: ToolCall[];
} {
  return {
    content: response.content,
    reasoning_content: isDeepSeekResponse(response) ? response.reasoning_content : undefined,
    has_tool_calls: !!(response.tool_calls && response.tool_calls.length > 0),
    tool_calls: response.tool_calls
  };
}

// 流事件处理器类型
export type LLMStreamHandler = (event: LLMStreamEvent) => void | Promise<void>;

// 流配置类型
export interface LLMStreamConfig {
  onStart?: (data: { model: string; provider: string }) => void;
  onChunk?: (chunk: UnifiedLLMChunk) => void;
  onContent?: (data: { content: string; delta?: string }) => void;
  onReasoning?: (data: { reasoning_content: string; delta?: string }) => void;
  onToolCall?: (data: { tool_call: ToolCall; index: number }) => void;
  onDone?: (response: UnifiedLLMResponse) => void;
  onError?: (error: Error, code?: string) => void;
  onAbort?: (reason: string) => void;
}