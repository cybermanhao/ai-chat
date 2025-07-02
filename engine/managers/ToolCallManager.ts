// 废弃
// @ts-nocheck
// engine/managers/ToolCallManager.ts


import { ChatMessageManager } from './MessageManager';

export interface ToolCallHandlerOptions {
  mcpServiceInstance: any;
  updateLastMessage: (patch: Partial<RuntimeMessage>) => void;
  addMessage: (msg: RuntimeMessage) => void;
}

export async function handleToolCall(
  toolName: string,
  toolArgs: Record<string, unknown>,
  options: ToolCallHandlerOptions
) {
  const { mcpServiceInstance, updateLastMessage, addMessage } = options;
  try {
    // 状态流转交由 glue 层
    updateLastMessage({
      tool_calls: [{
        id: `call-${Date.now()}`,
        type: 'function',
        function: {
          name: toolName,
          arguments: JSON.stringify(toolArgs)
        }
      }]
    });
    // 调用 MCP 服务
    const result = await mcpServiceInstance.callTool(toolName, toolArgs);
    // 工具调用结果消息
    const toolResultMessage = ChatMessageManager.createAssistantMessage(
      `Tool call result: ${JSON.stringify(result)}`
    );
    addMessage(toolResultMessage);
    // 清除 tool_calls
    updateLastMessage({ tool_calls: undefined });
    return result;
  } catch (error) {
    // 错误消息
    const errorMessage = ChatMessageManager.createClientNoticeMessage(
      `Tool call failed: ${error instanceof Error ? error.message : String(error)}`,
      'error',
      'TOOL_CALL_ERROR'
    );
    addMessage(errorMessage);
    updateLastMessage({ tool_calls: undefined });
    throw error;
  }
}

export async function handleToolCalls(
  toolCalls: Array<{ name: string; arguments: Record<string, unknown> }>,
  options: ToolCallHandlerOptions
) {
  const results: Array<{ success: true; result: unknown } | { success: false; error: unknown }> = [];
  for (const toolCall of toolCalls) {
    try {
      const result = await handleToolCall(toolCall.name, toolCall.arguments, options);
      results.push({ success: true, result });
    } catch (error) {
      results.push({ success: false, error });
    }
  }
  return results;
}