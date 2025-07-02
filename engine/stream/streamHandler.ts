import type { ExtendedChatCompletionChunk } from '../types/openai-extended';
import type { OpenAI } from 'openai';

// ToolCall 类型声明
export type ToolCall = OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta.ToolCall;

// 聚合 content、reasoning_content、tool_calls 字段，支持分片累积
export async function handleResponseStream(
  stream: AsyncIterable<any>,
  onChunk?: (chunk: any) => void
): Promise<{ content: string; reasoning_content: string; tool_calls: ToolCall[] }> {
  const acc: { content: string; reasoning_content: string; tool_calls: ToolCall[] } = {
    content: '',
    reasoning_content: '',
    tool_calls: [],
  };

  // 用于分片累积 arguments
  // 支持多工具并发，每个工具调用按 index/id 聚合
  for await (const chunk of stream) {
    const choice = chunk.choices?.[0];
    const delta = choice?.delta || {};

    if (typeof delta.content === 'string') acc.content += delta.content;
    if (typeof delta.reasoning_content === 'string') acc.reasoning_content += delta.reasoning_content;

    // 累加 tool_calls 分片，支持多工具并发和分片聚合
    if (Array.isArray(delta.tool_calls)) {
      for (let i = 0; i < delta.tool_calls.length; i++) {
        const toolCall = delta.tool_calls[i] as ToolCall;
        if (!acc.tool_calls[i]) {
          acc.tool_calls[i] = {
            ...toolCall,
            function: {
              name: toolCall.function?.name || '',
              arguments: toolCall.function?.arguments || ''
            }
          };
        } else {
          // 累加 arguments
          if (toolCall.function?.arguments) {
            acc.tool_calls[i].function!.arguments += toolCall.function.arguments;
          }
          // 其它字段如 id/name/type 可按需累加/覆盖
        }
      }
    }

    // 每个 chunk 都调用 onChunk 实现流式更新
    if (onChunk) {
      onChunk({
        role: 'assistant',
        content: acc.content,
        reasoning_content: acc.reasoning_content,
        tool_calls: acc.tool_calls
      });
    }

    if (choice?.finish_reason === 'stop') break;
  }
  return acc;
}

// 如果 openaisdk 已支持原生 stream，function* 可选，不强制保留。建议仅保留 handleResponseStream。