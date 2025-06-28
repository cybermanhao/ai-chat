// engine/service/llmService.ts
// 多端同构 LLMService 纯逻辑实现
import { OpenAI } from 'openai';
import type {
  ChatCompletionCreateParams,
  ChatCompletionMessageParam
} from 'openai/resources/chat/completions';
import type { ChatMessage, StreamChunk } from '../types/chat';
import type { ModelConfig } from '../types/model';
import type { Stream } from 'openai/streaming';
import type { ExtendedChatCompletionChunk } from '../types/openai-extended';
import type { LLMConfig } from '../types/llm';
import { streamHandler, handleResponseStream } from '../stream/streamHandler';

export let currentStream: AsyncIterable<any> | null = null;

// 工具链/后处理 glue 预留接口
export type PostProcessMessages = (messages: any[]) => Promise<void>;
export type OcrService = (imageData: any) => Promise<string>;
export type ImageService = (imageData: any) => Promise<any>;

export async function streamLLMChat({
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
  postProcessMessages,
  ocrService, // 预留 OCR glue
  imageService, // 预留图片 glue
  customFetch
}: {
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
  postProcessMessages?: PostProcessMessages;
  ocrService?: OcrService;
  imageService?: ImageService;
  customFetch?: typeof fetch;
}) {
  // 消息后处理（如有 OCR、图片等 glue，可在此调用）
  if (postProcessMessages) {
    await postProcessMessages(messages);
  }
  // 如需 OCR glue，可在此调用 ocrService(imageData)
  // 如需图片 glue，可在此调用 imageService(imageData)

    const client = new OpenAI({
    baseURL,
    apiKey,
    fetch: customFetch,
      dangerouslyAllowBrowser: true
    });

  const seriableTools = (tools && tools.length === 0) ? undefined : tools;
  const seriableParallelToolCalls = (tools && tools.length === 0) ? undefined : parallelToolCalls;

  const stream = await client.chat.completions.create({
    model,
    messages,
    temperature,
    tools: seriableTools,
    parallel_tool_calls: seriableParallelToolCalls,
    stream: true
  });

  // 适配 glue：用 handleResponseStream 处理流，onChunk/onDone 传递对象化内容
  await handleResponseStream(stream as any, {
    onChunk,
    onDone
    // 可扩展 onDelta/onControl 等扩展点
  });
}

export function abortLLMStream() {
      currentStream = null;
    }
