// engine/utils/llmConfig.ts
// LLM 配置相关工具函数
import type { Tool } from '../types/tool';
import type { RuntimeMessage } from '../types/chat';

export interface LLMConfig {
  model: string;
  apiKey?: string;
  apiUrl?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  parallelToolCalls?: boolean;
  [key: string]: string | number | boolean | object | undefined;
}

export const defaultLLMConfig: LLMConfig = {
  model: '',
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: 'You are a helpful assistant.',
  parallelToolCalls: false,
};

export function buildLLMRequestPayload(
  messages: RuntimeMessage[],
  options: {
    server?: { tools?: Tool[]; llmConfig?: LLMConfig };
    extraOptions?: Record<string, unknown>;
  } = {}
): Record<string, unknown> {
  const { server, extraOptions = {} } = options;
  
  // 格式化消息，仅保留 API 需要的字段
  const formatMessages = (msgs: RuntimeMessage[]) =>
    msgs.map((msg) => {
      const baseMessage = {
        role: msg.role,
        content: msg.content,
        ...(msg.name ? { name: msg.name } : {}),
      };

      // 根据消息类型添加特定字段
      if (msg.role === 'assistant' && 'tool_calls' in msg && msg.tool_calls) {
        return { ...baseMessage, tool_calls: msg.tool_calls };
      }
      
      if (msg.role === 'tool' && 'tool_call_id' in msg) {
        return { ...baseMessage, tool_call_id: msg.tool_call_id };
      }

      return baseMessage;
    });

  // 优先使用 extraOptions 里的配置，如果没有则用 server.llmConfig
  const model = (extraOptions.model as string) || server?.llmConfig?.model || defaultLLMConfig.model;
  const apiKey = (extraOptions.apiKey as string) || server?.llmConfig?.apiKey;
  const apiUrl = (extraOptions.apiUrl as string) || server?.llmConfig?.apiUrl;
  const temperature = (extraOptions.temperature as number) ?? server?.llmConfig?.temperature ?? defaultLLMConfig.temperature;
  const maxTokens = (extraOptions.max_tokens as number) ?? server?.llmConfig?.maxTokens ?? defaultLLMConfig.maxTokens;
  const systemPrompt = (extraOptions.systemPrompt as string) ?? server?.llmConfig?.systemPrompt ?? defaultLLMConfig.systemPrompt;
  const parallelToolCalls = (extraOptions.parallelToolCalls as boolean) ?? server?.llmConfig?.parallelToolCalls ?? defaultLLMConfig.parallelToolCalls;

  // 处理工具配置
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
    temperature,
    max_tokens: maxTokens,
    systemPrompt,
    parallelToolCalls,
    stream: true,
    ...extraOptions,
  };

  if (tools.length > 0) {
    payload.tools = tools;
    payload.tool_choice = parallelToolCalls ? 'auto' : 'none';
  }

  return payload;
}

// 从 Redux store 状态构建 LLM 配置
export function buildLLMConfigFromStore(
  llmConfigState: { activeLLMId: string; apiKey: string; userModel: string },
  llms: Array<{ id: string; baseUrl: string; userModel?: string }>,
  chatConfig: { temperature: number; maxTokens: number; systemPrompt: string }
): LLMConfig {
  const activeLLM = llms.find(llm => llm.id === llmConfigState.activeLLMId);
  
  return {
    model: llmConfigState.userModel || activeLLM?.userModel || defaultLLMConfig.model,
    apiKey: llmConfigState.apiKey,
    apiUrl: activeLLM?.baseUrl,
    temperature: chatConfig.temperature,
    maxTokens: chatConfig.maxTokens,
    systemPrompt: chatConfig.systemPrompt,
    parallelToolCalls: defaultLLMConfig.parallelToolCalls,
  };
} 