import type { 
  ChatCompletionChunk, 
  ChatCompletionRole,
  ChatCompletionChunk as OpenAIChatCompletionChunk
} from 'openai/resources/chat/completions';

// ------------------------------
// Platform-specific extensions
// ------------------------------

// Base type for all platform extensions
export type BasePlatformExtension = Record<string, unknown>;

// Deepseek platform specific features
export interface DeepseekExtension extends BasePlatformExtension {
  reasoning_content?: string | null;
  system_fingerprint?: string;
  // Deepseek specific response types
  tool_content?: string | null;
  observation_content?: string | null;
  thought_content?: string | null;
  // Deepseek specific request parameters
  safe_mode?: boolean;
  random_seed?: number;
  tools?: Array<{
    type: 'function';
    function: {
      name: string;
      description?: string;
      parameters?: Record<string, unknown>;
    };
  }>;
}

// 其他平台的扩展预留
export type AnthropicExtension = BasePlatformExtension;
export type ClaudeExtension = BasePlatformExtension;

// Combine all platform extensions
export type PlatformExtensions = 
  & DeepseekExtension 
  & Partial<AnthropicExtension>
  & Partial<ClaudeExtension>;

// ------------------------------
// Extended base types
// ------------------------------

// 扩展增量内容类型
export type ExtendedDelta = {
  content?: string | null;
  role?: ChatCompletionRole;
  tool_calls?: Array<{
    index: number;
    id?: string;
    function?: {
      name?: string;
      arguments?: string;
    };
    type?: 'function';
  }>;
} & PlatformExtensions;

// 扩展选择类型
export interface ExtendedChoice {
  index: number;
  delta: ExtendedDelta;
  finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'function_call' | null;
  logprobs: null;
}

// 扩展完成块类型
export interface ExtendedChatCompletionChunk extends Omit<ChatCompletionChunk, 'choices' | 'object'> {
  id: string;
  created: number;
  model: string;
  choices: ExtendedChoice[];
  object: 'chat.completion.chunk';
}

// Type guard to check if a chunk has platform-specific features
export function isPlatformChunk<T extends PlatformExtensions>(
  chunk: ExtendedChatCompletionChunk | OpenAIChatCompletionChunk,
  field: keyof T
): chunk is ExtendedChatCompletionChunk & { choices: Array<{ delta: T }> } {
  return chunk.choices.length > 0 && field in (chunk.choices[0]?.delta || {});
}

// Type guard specifically for Deepseek features
export function isDeepseekChunk(
  chunk: ExtendedChatCompletionChunk | OpenAIChatCompletionChunk
): chunk is ExtendedChatCompletionChunk & { choices: Array<{ delta: DeepseekExtension }> } {
  return chunk.choices.length > 0 && 'reasoning_content' in (chunk.choices[0]?.delta || {});
}

