import type { StreamChunk, MessageStatus } from '@/types/chat';
import type { ChatCompletionChunk } from 'openai/resources/chat/completions';

interface CompletionResult {
  content: string;
  reasoning?: string;
}

export async function handleResponseStream(
  stream: AsyncIterable<ChatCompletionChunk>,
  onChunk?: (chunk: StreamChunk) => void | Promise<void>,
  onDone?: (result: CompletionResult) => void | Promise<void>,
) {  let content = '';
  let reasoning = '';
  let isReasoning = false;
  const status: MessageStatus = 'generating';

  try {
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) continue;

      // 处理新内容
      if (delta.content) {
        const text = delta.content;
        
        // 解析推理内容
        if (text.includes('[REASONING]')) {
          isReasoning = true;
          continue;
        }
        if (text.includes('[/REASONING]')) {
          isReasoning = false;
          continue;
        }

        // 区分是推理内容还是正文内容
        if (isReasoning) {
          reasoning += text;
        } else {
          content += text;
        }

        // 调用onChunk回调
        onChunk?.({
          content,
          reasoning: reasoning || undefined,
          status
        });
      }
    }

    // 完成时调用onDone回调
    onDone?.({
      content,
      reasoning: reasoning || undefined
    });
  } catch (error) {
    console.error('Stream handling error:', error);
    throw error;
  }
}