import type { StreamChunk, MessageStatus } from '@/types/chat';
import type { ExtendedChatCompletionChunk } from '@/types/openai-extended';

export interface CompletionResult {
  content: string;
  reasoning_content?: string;
  tool_content?: string;
  observation_content?: string;
  thought_content?: string;
}

export async function handleResponseStream(
  stream: AsyncIterable<ExtendedChatCompletionChunk>,
  onChunk?: (chunk: StreamChunk) => void | Promise<void>,
  onDone?: (result: CompletionResult) => void | Promise<void>,
) {  
  let content = '';
  let reasoning_content = '';
  let tool_content = '';
  let observation_content = '';
  let thought_content = '';
  const status: MessageStatus = 'generating';

  try {
    console.log('Starting stream handling...');
    
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (!delta) {
        console.log('Empty delta received');
        continue;
      }

      // Handle Deepseek specific content types
      if (delta.reasoning_content !== null && delta.reasoning_content !== undefined && delta.reasoning_content !== 'null') {
        console.log('Received reasoning delta:', delta.reasoning_content);
        reasoning_content += delta.reasoning_content;
      }

      if (delta.tool_content !== null && delta.tool_content !== undefined && delta.tool_content !== 'null') {
        console.log('Received tool content:', delta.tool_content);
        tool_content += delta.tool_content;
      }

      if (delta.observation_content !== null && delta.observation_content !== undefined && delta.observation_content !== 'null') {
        console.log('Received observation:', delta.observation_content);
        observation_content += delta.observation_content;
      }

      if (delta.thought_content !== null && delta.thought_content !== undefined && delta.thought_content !== 'null') {
        console.log('Received thought:', delta.thought_content);
        thought_content += delta.thought_content;
      }
      
      // Handle main content - filter out null values
      if (delta.content !== null && delta.content !== undefined && delta.content !== 'null') {
        const text = delta.content;
        console.log('Received content delta:', text);
        content += text;
      }

      // Call onChunk callback with all content types
      onChunk?.({
        content,
        reasoning_content: reasoning_content || undefined,
        tool_content: tool_content || undefined,
        observation_content: observation_content || undefined,
        thought_content: thought_content || undefined,
        status
      });
    }

    // Clean up any remaining 'null' strings
    content = content.replace(/null/g, '');
    reasoning_content = reasoning_content.replace(/null/g, '');
    tool_content = tool_content.replace(/null/g, '');
    observation_content = observation_content.replace(/null/g, '');
    thought_content = thought_content.replace(/null/g, '');

    console.log('Stream completed:', { 
      content: content.slice(0, 100) + '...', 
      reasoning_content: reasoning_content ? reasoning_content.slice(0, 100) + '...' : undefined,
      tool_content: tool_content ? tool_content.slice(0, 100) + '...' : undefined,
      observation_content: observation_content ? observation_content.slice(0, 100) + '...' : undefined,
      thought_content: thought_content ? thought_content.slice(0, 100) + '...' : undefined
    });

    onDone?.({
      content,
      reasoning_content: reasoning_content || undefined,
      tool_content: tool_content || undefined,
      observation_content: observation_content || undefined,
      thought_content: thought_content || undefined
    });
  } catch (error) {
    console.error('Stream handling error:', error);
    throw error;
  }
}

// 兼容 OpenAI/Deepseek 的流式 SSE 响应
export async function* streamHandler(response: Response): AsyncGenerator<ExtendedChatCompletionChunk, void, unknown> {
  const decoder = new TextDecoder();
  const reader = response.body?.getReader();
  let buffer = '';

  if (!reader) return;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const chunkStr = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 2);
      if (chunkStr.startsWith('data:')) {
        const jsonStr = chunkStr.replace(/^data:\s*/, '');
        if (jsonStr === '[DONE]') break;
        try {
          const chunk = JSON.parse(jsonStr) as ExtendedChatCompletionChunk;
          yield chunk;
        } catch (e) {
          // ignore parse error
        }
      }
      boundary = buffer.indexOf('\n\n');
    }
  }
}