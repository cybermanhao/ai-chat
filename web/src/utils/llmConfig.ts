import type { Tool } from '@engine/service/mcpService';
import { zodToJsonSchema } from 'zod-to-json-schema';

export interface LLMConfig {
  model: string;
  apiKey?: string;
  apiUrl?: string;
  [key: string]: string | number | boolean | object | undefined;
}

export const defaultLLMConfig: LLMConfig = {
  model: '',
  parallelToolCalls: false,
};

export function buildLLMRequestPayload(
  messages: Array<{ role: string; content: string; name?: string; tool_calls?: unknown; tool_call_id?: string }>,
  options: {
    server?: { tools?: Tool[]; llmConfig?: LLMConfig };
    extraOptions?: Record<string, unknown>;
  } = {}
): Record<string, unknown> {
  // 格式化消息，仅保留 API 需要的字段
  const formatMessages = (msgs: Array<{ role: string; content: string; name?: string; tool_calls?: unknown; tool_call_id?: string }>) =>
    msgs.map(({ role, content, name, tool_calls, tool_call_id }) => ({
      role,
      content,
      ...(name ? { name } : {}),
      ...(typeof tool_calls === 'object' && tool_calls !== null ? { tool_calls } : {}),
      ...(tool_call_id ? { tool_call_id } : {}),
    }));
  const { server, extraOptions = {} } = options;
  // 优先使用 extraOptions 里的 model/apiKey/apiUrl，如果没有则用 server.llmConfig
  const model = (extraOptions.model as string) || server?.llmConfig?.model || '';
  const apiKey = (extraOptions.apiKey as string) || server?.llmConfig?.apiKey;
  const apiUrl = (extraOptions.apiUrl as string) || server?.llmConfig?.apiUrl;
  // 只拼接 enabled !== false 的工具，并集中兜底 parameters 字段
  const tools = (server?.tools || [])
    .filter(tool => typeof (tool as { enabled?: boolean }).enabled !== 'boolean' || (tool as { enabled?: boolean }).enabled)
    .map(tool => {
      // 兼容 EnableToolItem 结构，直接用 inputSchema 作为 parameters
      let parameters: unknown = undefined;
      if ('parameters' in tool && typeof tool.parameters === 'object' && tool.parameters !== null) {
        parameters = tool.parameters;
      } else if ('inputSchema' in tool && tool.inputSchema && typeof tool.inputSchema === 'object') {
        parameters = tool.inputSchema;
      }
      const isValidSchema = parameters && typeof (parameters as { type?: unknown }).type === 'string' && (parameters as { type: string }).type === 'object';
      return {
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: isValidSchema ? parameters : { type: 'object', properties: {} },
        },
      };
    });
  const payload: Record<string, unknown> = {
    model,
    apiKey,
    apiUrl,
    messages: formatMessages(messages),
    parallelToolCalls: (extraOptions.parallelToolCalls ?? server?.llmConfig?.parallelToolCalls ?? defaultLLMConfig.parallelToolCalls),
    ...extraOptions,
  };
  if (tools.length > 0) {
    payload.tools = tools;
    payload.tool_choice = 'auto';
  }
  return payload;
}
