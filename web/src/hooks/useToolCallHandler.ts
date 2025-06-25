import { useCallback } from 'react';
import { callToolWithStatus, MCPService } from '@/services/mcpService';
import { ChatMessageConverter } from '@engine/utils/messageConverters';
import type { RuntimeMessage } from '@engine/types/chat';

export function useToolCallHandler(
  addMessage: (msg: RuntimeMessage) => void,
  updateLastMessage: (patch: Partial<RuntimeMessage>) => void,
  mcpServiceInstance: any
) {
  return useCallback(async (toolName: string, toolArgs: Record<string, any>) => {
    console.log('[useToolCallHandler] called', toolName, toolArgs, mcpServiceInstance);
    if (!mcpServiceInstance) {
      console.warn('[useToolCallHandler] mcpServiceInstance is undefined!');
      return;
    }
    await callToolWithStatus({
      mcp: mcpServiceInstance,
      name: toolName,
      args: toolArgs,
      onStatusChange: (status, payload) => {
        if (status === 'loading') {
          // 保证类型安全，转换为 RuntimeMessage
          addMessage(ChatMessageConverter.toRuntime([
            {
              id: `tool-${toolName}-${Date.now()}`,
              role: 'tool',
              toolName,
              status: 'loading',
              args: toolArgs,
              content: `正在调用工具 ${toolName}...`
            } as any // 如需更严格可定义 ToolMessage 类型
          ])[0]);
        } else if (status === 'done') {
          updateLastMessage({
            status: 'done',
            content: payload.result?.content || JSON.stringify(payload.result)
          });
        } else if (status === 'error') {
          updateLastMessage({
            status: 'error',
            content: `工具 ${toolName} 调用失败: ${payload.error}`
          });
        }
      }
    });
  }, [addMessage, updateLastMessage, mcpServiceInstance]);
}
