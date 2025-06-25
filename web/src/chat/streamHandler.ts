// web/src/chat/streamHandler.ts
// 专门负责 LLM 流式响应的解析与消费，供 WebChatSession 等调用
import type { StreamChunk } from '@/types/stream';

/**
 * 解析 LLM 返回的流式数据（如 SSE、Fetch chunk、WebSocket 等）
 * 返回 StreamChunk 迭代器，供消费端逐步处理
 */
export async function* parseLLMStream(stream: ReadableStream<Uint8Array>): AsyncGenerator<StreamChunk, void, unknown> {
  const reader = stream.getReader();
  let decoder = new TextDecoder('utf-8');
  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // 假设每个 chunk 以 "\n" 分割
    let lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const chunk: StreamChunk = JSON.parse(line);
        yield chunk;
      } catch (e) {
        // 可根据需要处理解析异常
        continue;
      }
    }
  }
}

/**
 * 消费 StreamChunk 迭代器，将内容追加到 Chat/Message
 * @param chunkIter 解析后的流式迭代器
 * @param onChunk 消费回调
 */
export async function consumeLLMStream(
  chunkIter: AsyncGenerator<StreamChunk, void, unknown>,
  onChunk: (chunk: StreamChunk) => void
) {
  for await (const chunk of chunkIter) {
    onChunk(chunk);
  }
}
