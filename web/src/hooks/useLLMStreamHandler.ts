import { useCallback } from 'react';
import type { StreamChunk, RuntimeMessage } from '@/types/chat';
import type { ToolCallContent } from '@engine/types/chat';

export function useLLMStreamHandler(
  updateLastMessage: (update: Partial<RuntimeMessage>) => void,
  updateMessageContent: (update: { messageId: string } & Partial<RuntimeMessage>) => void,
  handleToolCall: (toolName: string, toolArgs: Record<string, unknown>) => Promise<void>
) {
  return useCallback(
    async (chunk: StreamChunk, currentMessages: RuntimeMessage[]) => {
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
      // 检测 tool_call/tool_use
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
          toolArgs = {};
        }
        await handleToolCall(toolName, toolArgs);
      }
    },
    [updateLastMessage, updateMessageContent, handleToolCall]
  );
}
