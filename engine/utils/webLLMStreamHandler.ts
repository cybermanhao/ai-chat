// engine/utils/webLLMStreamHandler.ts
// 专门负责 LLM 流式 chunk 处理、tool call 解析与回调，不依赖 React
import type { StreamChunk, RuntimeMessage, ToolCallContent } from '../types/chat';
import { ToolCallAccumulator } from './toolCallAccumulator';

export interface WebLLMStreamHandlerOptions {
  updateLastMessage: (update: Partial<RuntimeMessage>) => void;
  updateMessageContent: (update: { messageId: string } & Partial<RuntimeMessage>) => void;
  handleToolCall: (toolName: string, toolArgs: Record<string, unknown>) => Promise<void>;
}

export async function webLLMStreamHandler(
  chunk: StreamChunk,
  currentMessages: RuntimeMessage[],
  opts: WebLLMStreamHandlerOptions
) {
  const { updateLastMessage, updateMessageContent, handleToolCall } = opts;
  // 更新消息内容
  updateLastMessage({
    content: chunk.content,
    reasoning_content: chunk.reasoning_content,
    tool_content: typeof chunk.tool_content === 'string' ? chunk.tool_content : undefined,
    observation_content: chunk.observation_content,
    thought_content: chunk.thought_content,
    status: chunk.status || 'generating'
  });
  const lastMessage = currentMessages[currentMessages.length - 1];
  if (lastMessage && lastMessage.id) {
    updateMessageContent({
      messageId: lastMessage.id,
      content: chunk.content,
      reasoning_content: chunk.reasoning_content,
      tool_content: typeof chunk.tool_content === 'string' ? chunk.tool_content : undefined,
      observation_content: chunk.observation_content,
      thought_content: chunk.thought_content,
    });
  }

  // ToolCallAccumulator 作为 handler 级别实例传入（不再挂载到函数上，避免全局副作用）
  let accumulator: ToolCallAccumulator | undefined = (opts as any)._toolCallAccumulator;
  if (!accumulator) {
    accumulator = new ToolCallAccumulator({ onFlush: handleToolCall });
    (opts as any)._toolCallAccumulator = accumulator;
  }
  // 只在 tool_calls 存在且为数组时才调用 addChunk，避免无意义累加
  if (Array.isArray((chunk as any).tool_calls)) {
    accumulator.addChunk((chunk as any).tool_calls);
  }

  // 兼容单次 tool_content（如非分片 function call）
  if (
    chunk.tool_content &&
    typeof chunk.tool_content === 'object' &&
    (chunk.tool_content as ToolCallContent).name
  ) {
    const toolContent = chunk.tool_content as ToolCallContent;
    const toolName = toolContent.name;
    let toolArgs: Record<string, unknown> = {};
    try {
      toolArgs = toolContent.arguments ? JSON.parse(toolContent.arguments) : {};
    } catch {}
    await handleToolCall(toolName, toolArgs);
  }

  // 检查 finish_reason，flush tool_calls
  const finishReason = ((chunk as any).choices?.[0]?.finish_reason)
    || ((chunk as any).finish_reason);
  await accumulator.flushIfNeeded(finishReason);
}

// 新增：流式 for await 入口，推荐直接用 for await 处理流
export async function handleLLMStream(
  chunkStream: AsyncIterable<StreamChunk>,
  currentMessages: RuntimeMessage[],
  opts: WebLLMStreamHandlerOptions
) {
  // 每个 handler 独立 ToolCallAccumulator，避免全局副作用
  const accumulator = new ToolCallAccumulator({ onFlush: opts.handleToolCall });
  (opts as any)._toolCallAccumulator = accumulator;
  for await (const chunk of chunkStream) {
    await webLLMStreamHandler(chunk, currentMessages, opts);
  }
  accumulator.reset();
}
