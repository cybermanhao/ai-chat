// engine/service/llmService.ts
// 多端同构 LLMService 纯逻辑实现
import { OpenAI } from 'openai';
import type {
  ChatCompletionCreateParams,
  ChatCompletionMessageParam
} from 'openai/resources/chat/completions';
import type { ChatMessage } from '../types/chat';
import type { ModelConfig } from '../types/model';
import type { Stream } from 'openai/streaming';
import type { ExtendedChatCompletionChunk } from '../types/openai-extended';
import type { LLMConfig } from '../types/llm';
import { handleResponseStream } from '../stream/streamHandler';

export let currentStream: AsyncIterable<any> | null = null;

// 工具链/后处理 glue 预留接口
export type PostProcessMessages = (messages: any[]) => Promise<void>;
export type OcrService = (imageData: any) => Promise<string>;
export type ImageService = (imageData: any) => Promise<any>;

export async function streamLLMChat({
  chatId,
  baseURL,
  apiKey,
  model,
  messages,
  temperature,
  tools = [],
  parallelToolCalls = true,
  proxyServer = '',
  onChunk,
  onDone,
  onError,
  onToolCall,
  // postProcessMessages,
  // ocrService, // 预留 OCR glue
  // imageService, // 预留图片 glue
  customFetch,
  signal,
  assistantMessageId, // 新增：传入固定的 assistant 消息 ID
}: {
  chatId?: string; // 可选，便于跟踪会话
  baseURL: string;
  apiKey: string;
  model: string;
  messages: any[];
  temperature?: number;
  tools?: any[];
  parallelToolCalls?: boolean;
  proxyServer?: string;
  onChunk?: (chunk: any) => void;
  onDone?: (result: any) => void;
  onError?: (err: any) => void;
  onToolCall?: (toolCall: any) => void;
  // postProcessMessages?: PostProcessMessages;
  // ocrService?: OcrService;
  // imageService?: ImageService;
  customFetch?: typeof fetch;
  signal?: AbortSignal;
  assistantMessageId?: string; // 固定的 assistant 消息 ID
}) {
  // 消息后处理（如有 OCR、图片等 glue，可在此调用）
  // if (postProcessMessages) {
  //   await postProcessMessages(messages);
  // }
  // 如需 OCR glue，可在此调用 ocrService(imageData)
  // 如需图片 glue，可在此调用 imageService(imageData)

  // Debug logs can be enabled for debugging (currently commented out for performance)
  // console.log('[streamLLMChat] 接收到的参数:');
  // console.log('[streamLLMChat] baseURL:', baseURL);
  // console.log('[streamLLMChat] model:', model);
  // console.log('[streamLLMChat] apiKey:', apiKey ? '***已设置***' : '未设置');
  // console.log('[streamLLMChat] messages 数量:', messages.length);

  const client = new OpenAI({
    baseURL,
    apiKey,
    fetch: customFetch,
    dangerouslyAllowBrowser: true
  });

  const seriableTools = (tools && tools.length === 0) ? undefined : tools;
  const seriableParallelToolCalls = (tools && tools.length === 0) ? undefined : parallelToolCalls;

  // 清理消息格式，确保只包含 API 需要的字段
  const cleanMessages = messages
    .filter(msg => msg && msg.role && msg.content !== undefined) // 过滤掉无效消息
    .map(msg => {
      const cleanMsg: any = {
        role: msg.role,
        content: msg.content,
      };

      // 保留其他必要的 OpenAI 字段
      if (msg.name) cleanMsg.name = msg.name;

      // 只有当 tool_calls 存在且非空时才包含
      if (msg.tool_calls && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
        cleanMsg.tool_calls = msg.tool_calls;
        // console.log('[llmService] 包含 tool_calls:', msg.tool_calls.length, '个');
      } else if (msg.tool_calls) {
        // console.log('[llmService] 跳过空的 tool_calls 数组, 长度:', Array.isArray(msg.tool_calls) ? msg.tool_calls.length : '非数组');
      }

      if (msg.tool_call_id) cleanMsg.tool_call_id = msg.tool_call_id;

      return cleanMsg;
    });

  // Debug logs can be enabled for debugging (currently commented out for performance)
  // console.log('[llmService] 原始 messages:', messages);
  // console.log('[llmService] 清理后的 messages:', cleanMessages);

  const stream = await client.chat.completions.create({
    model,
    messages: cleanMessages,
    temperature,
    tools: seriableTools,
    parallel_tool_calls: seriableParallelToolCalls,
    stream: true,

  }, { signal });

  // 适配 glue：用 handleResponseStream 处理流，onChunk/onDone/onError/onToolCall 传递对象化内容
  try {
    const result = await handleResponseStream(stream, onChunk);
    // 流处理完成后，调用 onDone 回调，确保返回完整的 EnrichedMessage 格式
    if (onDone) {
      const enrichedResult = {
        role: 'assistant' as const,
        content: result.content,
        id: assistantMessageId, // 使用传入的 ID，避免重新生成
        // 只在流完成时设置最终的 timestamp，避免频繁更新
        timestamp: Date.now(),
        ...(result.reasoning_content && { reasoning_content: result.reasoning_content }),
        ...(result.tool_calls && result.tool_calls.length > 0 && { tool_calls: result.tool_calls }),
      };
      onDone(enrichedResult);
    }
  } catch (err) {
    if (onError) onError(err);
  }
}

export function abortLLMStream() {
  currentStream = null;
}
