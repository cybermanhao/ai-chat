import type { StreamChunk, MessageStatus, ToolCallContent } from '../types/chat';
import type { ExtendedChatCompletionChunk } from '../types/openai-extended';

export interface CompletionResult {
  content: string;
  reasoning_content?: string;
  tool_content?: string;
  observation_content?: string;
  thought_content?: string;
}

// 可扩展流式响应处理器，适配多模型/多工具链/插件 glue
export interface StreamHandlerOptions {
  onChunk?: (msg: Record<string, any>) => void;
  onDone?: (msg: Record<string, any>) => void;
  // 扩展点：自定义 delta 处理
  onDelta?: (delta: any, acc: Record<string, any>) => void;
  // 扩展点：流程控制
  onControl?: (delta: any, acc: Record<string, any>) => void;
}

export async function handleResponseStream(
  stream: AsyncIterable<any>,
  options: StreamHandlerOptions = {}
) {
  // 累加器，存储所有需要拼接的字段
  const acc: Record<string, any> = {
    content: '',
    reasoning_content: '',
    tool_content: '',
    observation_content: '',
    tool_calling: undefined,
    calltool: undefined,
    status: 'generating'
  };

    for await (const chunk of stream) {
    const choice = chunk.choices?.[0];
    const delta = choice?.delta || {};

    // 默认字段累加
    if (typeof delta.content === 'string') acc.content += delta.content;
    if (typeof delta.reasoning_content === 'string') acc.reasoning_content += delta.reasoning_content;
    if (typeof delta.tool_content === 'string') acc.tool_content += delta.tool_content;
    if (typeof delta.observation_content === 'string') acc.observation_content += delta.observation_content;

    // 工具链/流程 glue
    if (delta.tool_calling) {
      acc.status = 'tool_calling';
      acc.tool_calling = delta.tool_calling;
      }
    if (delta.calltool) {
      acc.status = 'calltool';
      acc.calltool = delta.calltool;
      }

    // 扩展点：自定义 delta 处理
    if (options.onDelta) options.onDelta(delta, acc);
    // 扩展点：流程控制
    if (options.onControl) options.onControl(delta, acc);

    // glue 到上层
    options.onChunk?.({ ...acc });

    // 流程控制
    if (choice?.finish_reason === 'stop') break;
  }

  acc.status = 'stable';
  options.onDone?.({ ...acc });
}

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