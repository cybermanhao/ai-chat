import type { ExtendedChatCompletionChunk } from '../types/openai-extended';
import type { OpenAI } from 'openai';
import type { ChatCompletionMessageToolCall } from 'openai/resources/chat/completions';

// ToolCall 类型声明 - 用于 delta 处理
export type ToolCall = OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta.ToolCall;

// 流状态类型
export type StreamPhase = 'connecting' | 'thinking' | 'generating' | 'tool_calling';

// 扩展的 chunk 信息，包含状态信息
export interface EnhancedChunk {
  role: 'assistant';
  content: string;
  reasoning_content: string;
  tool_calls: ChatCompletionMessageToolCall[]; // 使用完整的工具调用类型
  phase: StreamPhase;
  isFirstChunk?: boolean;
  isFirstContent?: boolean;
}

// 聚合 content、reasoning_content、tool_calls 字段，支持分片累积
export async function handleResponseStream(
  stream: AsyncIterable<any>,
  onChunk?: (chunk: EnhancedChunk) => void
): Promise<{ content: string; reasoning_content: string; tool_calls: ChatCompletionMessageToolCall[] }> {
  const acc: { content: string; reasoning_content: string; tool_calls: ChatCompletionMessageToolCall[] } = {
    content: '',
    reasoning_content: '',
    tool_calls: []
  };

  // 状态跟踪变量
  let isFirstChunk = true;
  let hasReceivedContent = false;
  let hasReceivedReasoning = false;

  // 独立的内存累加量，避免 Redux/Immer 冻结问题
  const toolCallsAccumulator = new Map<number, {
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>();
  for await (const chunk of stream) {
    const choice = chunk.choices?.[0];
    const delta = choice?.delta || {};

    // 判断当前 chunk 的状态
    let phase: StreamPhase = 'connecting';
    let isFirstContent = false;

    if (delta.content !== undefined && delta.content !== null) {
      if (!hasReceivedContent) {
        hasReceivedContent = true;
        isFirstContent = true;
      }
      phase = 'generating';
    } else if (delta.reasoning_content !== undefined && delta.reasoning_content !== null) {
      if (!hasReceivedReasoning) {
        hasReceivedReasoning = true;
      }
      phase = 'thinking';
    } else if (delta.tool_calls !== undefined && delta.tool_calls !== null) {
      phase = 'tool_calling';
    } else if (isFirstChunk) {
      phase = 'connecting';
    } else {
      // 继续使用之前的状态
      if (hasReceivedContent) phase = 'generating';
      else if (hasReceivedReasoning) phase = 'thinking';
      else phase = 'connecting';
    }

    if (typeof delta.content === 'string') acc.content += delta.content;
    if (typeof delta.reasoning_content === 'string') acc.reasoning_content += delta.reasoning_content;

    // 累加 tool_calls 分片，支持多工具并发和分片聚合
    // 使用独立的内存累加器，避免 Redux/Immer 冻结问题
    if (Array.isArray(delta.tool_calls) && delta.tool_calls.length > 0) {
      console.log('[streamHandler] 处理 tool_calls delta:', JSON.stringify(delta.tool_calls, null, 2));
      
      const toolCall = delta.tool_calls[0]; // 只处理第一个，简化逻辑
      const index = toolCall.index ?? 0;
      console.log('[streamHandler] 处理工具调用 index:', index, 'toolCall:', JSON.stringify(toolCall, null, 2));
      
      if (!toolCallsAccumulator.has(index)) {
        // 新的工具调用开始 - 在独立的累加器中创建
        const newToolCall = {
          id: toolCall.id || `call_${Date.now()}_${index}`,
          type: 'function' as const,
          function: {
            name: toolCall.function?.name || '',
            arguments: toolCall.function?.arguments || ''
          }
        };
        toolCallsAccumulator.set(index, newToolCall);
        console.log('[streamHandler] 在累加器中创建新工具调用:', JSON.stringify(newToolCall, null, 2));
      } else {
        // 累积现有工具调用的信息 - 直接修改累加器中的对象
        const existingCall = toolCallsAccumulator.get(index)!;
        
        if (toolCall.id && toolCall.id !== existingCall.id) {
          console.log('[streamHandler] 更新工具调用 ID:', existingCall.id, '->', toolCall.id);
          existingCall.id = toolCall.id;
        }
        if (toolCall.function?.name) {
          existingCall.function.name = toolCall.function.name;
        }
        if (toolCall.function?.arguments !== undefined) {
          console.log('[streamHandler] 累加 arguments，之前:', JSON.stringify(existingCall.function.arguments), '新增:', JSON.stringify(toolCall.function.arguments));
          existingCall.function.arguments += toolCall.function.arguments;
          console.log('[streamHandler] 累加后的 arguments:', JSON.stringify(existingCall.function.arguments));
        }
        console.log('[streamHandler] 更新后的累加器工具调用:', JSON.stringify(existingCall, null, 2));
      }
      
      // 从累加器创建全新的数组传递给 Redux
      acc.tool_calls = Array.from(toolCallsAccumulator.values()).map(call => ({
        id: call.id,
        type: call.type,
        function: {
          name: call.function.name,
          arguments: call.function.arguments
        }
      }));
      
      console.log('[streamHandler] 更新后的 acc.tool_calls:', JSON.stringify(acc.tool_calls, null, 2));
      console.log('[streamHandler] 当前累加器状态:', JSON.stringify(Array.from(toolCallsAccumulator.values()), null, 2));
    }

    // 每个 chunk 都调用 onChunk 实现流式更新
    // 注意：流式更新中不包含 timestamp/id，避免不必要的性能开销
    if (onChunk) {
      onChunk({
        role: 'assistant',
        content: acc.content,
        reasoning_content: acc.reasoning_content,
        tool_calls: acc.tool_calls,
        phase,
        isFirstChunk,
        isFirstContent
        // 注意：不包含 timestamp, id 等元数据，这些只在消息完成时设置
        // 这样可以避免每次 chunk 更新都触发完整的对象比较
      });
    }

    isFirstChunk = false;

    if (choice?.finish_reason === 'stop') break;
  }
  
  // 最终返回时，从累加器创建全新的数组
  acc.tool_calls = Array.from(toolCallsAccumulator.values()).map(call => ({
    id: call.id,
    type: call.type,
    function: {
      name: call.function.name,
      arguments: call.function.arguments
    }
  }));
  
  console.log('[streamHandler] 流处理完成，最终 tool_calls:', JSON.stringify(acc.tool_calls, null, 2));
  
  return acc;
}