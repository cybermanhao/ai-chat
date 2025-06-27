// engine/managers/ToolCallManager.ts
// 工具调用管理器，处理 tool call 逻辑
import type { RuntimeMessage } from '../types/chat';
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
    // 更新当前消息状态为 tool_calling
    updateLastMessage({
      status: 'tool_calling',
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

    // 添加工具调用结果消息
    const toolResultMessage = ChatMessageManager.createAssistantMessage(
      `Tool call result: ${JSON.stringify(result)}`,
      'stable'
    );
    addMessage(toolResultMessage);

    // 更新原消息状态为 stable
    updateLastMessage({
      status: 'stable',
      tool_calls: undefined // 清除 tool_calls，因为已经处理完成
    });

    return result;
  } catch (error) {
    console.error('Tool call failed:', error);
    
    // 添加错误消息
    const errorMessage = ChatMessageManager.createClientNoticeMessage(
      `Tool call failed: ${error instanceof Error ? error.message : String(error)}`,
      'error',
      'TOOL_CALL_ERROR'
    );
    addMessage(errorMessage);

    // 更新原消息状态为 error
    updateLastMessage({
      status: 'error',
      tool_calls: undefined
    });

    throw error;
  }
}

// 批量处理工具调用
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