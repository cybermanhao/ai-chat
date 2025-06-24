import type { Tool } from '@engine/service/mcpService';

export interface LLMConfig {
  model: string;
  apiKey?: string;
  apiUrl?: string;
  [key: string]: string | number | boolean | object | undefined;
}

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
  // 只拼接 enabled !== false 的工具
  const tools = (server?.tools || [])
    .filter(tool => typeof (tool as { enabled?: boolean }).enabled !== 'boolean' || (tool as { enabled?: boolean }).enabled)
    .map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: "parameters" in tool && typeof (tool as { parameters?: object }).parameters === "object"
          ? (tool as { parameters?: object }).parameters
          : {},
      },
    }));
  const payload: Record<string, unknown> = {
    model,
    apiKey,
    apiUrl,
    messages: formatMessages(messages),
    ...extraOptions,
  };
  if (tools.length > 0) {
    payload.tools = tools;
    payload.tool_choice = 'auto';
  }
  return payload;
}
