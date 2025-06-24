import { useCallback } from 'react';
import { callToolWithStatus, MCPService } from '@/services/mcpService';

export function useToolCallHandler(addMessage, updateLastMessage, mcpServiceInstance) {
  return useCallback(async (toolName: string, toolArgs: Record<string, any>) => {
    if (!mcpServiceInstance) return;
    await callToolWithStatus({
      mcp: mcpServiceInstance,
      name: toolName,
      args: toolArgs,
      onStatusChange: (status, payload) => {
        if (status === 'loading') {
          addMessage({
            id: `tool-${toolName}-${Date.now()}`,
            role: 'tool',
            toolName,
            status: 'loading',
            args: toolArgs,
            content: `正在调用工具 ${toolName}...`
          });
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
