import { useCallback } from 'react';
import type { StreamChunk, RuntimeMessage } from '@/types/chat';
import type { ToolCallContent } from '@engine/types/chat';

// 用于缓存分片累加的 tool_calls 参数
const toolCallArgsCache = new Map<string, { args: string; name: string }>();

export const defaultLLMStreamHandlerConfig = {
  parallelToolCalls: false
};

export function useLLMStreamHandler(
  updateLastMessage: (update: Partial<RuntimeMessage>) => void,
  updateMessageContent: (update: { messageId: string } & Partial<RuntimeMessage>) => void,
  handleToolCall: (toolName: string, toolArgs: Record<string, unknown>) => Promise<void>
) {
  return useCallback(
    async (chunk: StreamChunk, currentMessages: RuntimeMessage[]) => {
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

      // 1. 兼容 OpenAI/DeepSeek function calling: tool_calls 分片累加
      const toolCalls = (chunk as unknown as { tool_calls?: Array<{ id?: string; function?: { name?: string; arguments?: string } }> }).tool_calls;
      if (Array.isArray(toolCalls)) {
        for (const call of toolCalls) {
          const callId = call.id || call.function?.name || 'default';
          const argDelta = call.function?.arguments || '';
          const toolName = call.function?.name || callId;
          if (!toolCallArgsCache.has(callId) && argDelta.trim().startsWith('{')) {
            toolCallArgsCache.set(callId, { args: '', name: toolName });
          }
          const prev = toolCallArgsCache.get(callId) || { args: '', name: toolName };
          toolCallArgsCache.set(callId, { args: prev.args + argDelta, name: toolName });
        }
      }

      // 2. 兼容单次 tool_content（如非分片 function call）
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
        } catch {
          // ignore JSON parse error
        }
        await handleToolCall(toolName, toolArgs);
      }

      // 3. 检查 finish_reason，flush tool_calls
      const finishReason = ((chunk as Partial<StreamChunk> & { choices?: Array<{ finish_reason?: string }>, finish_reason?: string }).choices?.[0]?.finish_reason)
        || ((chunk as Partial<StreamChunk> & { finish_reason?: string }).finish_reason);
      if (finishReason === 'tool_calls') {
        for (const [pendingCallId, { args: fullArgs, name: toolName }] of toolCallArgsCache.entries()) {
          let toolArgs: Record<string, unknown> = {};
          try {
            toolArgs = JSON.parse(fullArgs);
          } catch {
            // ignore JSON parse error
          }
          if (toolName) {
            await handleToolCall(toolName, toolArgs);
          }
          toolCallArgsCache.delete(pendingCallId);
        }
      }
    },
    [updateLastMessage, updateMessageContent, handleToolCall]
  );
}
