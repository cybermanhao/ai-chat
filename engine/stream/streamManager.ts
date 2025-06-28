import { ChatMessageManager } from '../managers/MessageManager';

import { handleResponseStream } from './streamHandler';
import type { CompletionResult } from './streamHandler';
import { buildLLMRequestPayload } from '../utils/llmConfig';
import type { RuntimeMessage } from '../types/chat';
import { ToolCallAccumulator } from './streamAccumulator';
import { streamLLMChat, abortLLMStream } from '../service/llmService';

export function createLLMStreamManager({
  initialMessages,
  saveChat,
  mcpServiceInstance,
  config,
  currentConfig,
  activeLLMConfig,
  activeServer,
  onAddMessage,
  onUpdateLastMessage,
  onStreamChunk,
  onStreamEnd,
  onError,
}: {
  initialMessages: RuntimeMessage[];
  saveChat: () => void;
  mcpServiceInstance: any;
  config: any;
  currentConfig: any;
  activeLLMConfig: any;
  activeServer: any;
  onAddMessage: (msg: RuntimeMessage) => void;
  onUpdateLastMessage: (patch: Partial<RuntimeMessage>) => void;
  onStreamChunk?: (chunk: any) => void;
  onStreamEnd?: (result: CompletionResult) => void;
  onError?: (msg: string) => void;
}) {
  console.log('currentConfig:', currentConfig);
  console.log('activeLLMConfig:', activeLLMConfig);
  const messageManager = new ChatMessageManager(initialMessages, saveChat);

  async function handleSend(inputValue: string, abortSignal: AbortSignal) {
    console.log('[streamManager] handleSend called', { inputValue });
    if (!inputValue.trim()) return;
    try {
      const userMessage = ChatMessageManager.createUserMessage(inputValue.trim());
      messageManager.addMessage(userMessage);
      onAddMessage(userMessage);
      const assistantMessage = ChatMessageManager.createAssistantMessage('');
      messageManager.addMessage(assistantMessage);
      onAddMessage(assistantMessage);
      const currentMessages = [...messageManager.getMessages()];
      const systemMessage = ChatMessageManager.createSystemMessage(config.systemPrompt);
      const fullMessages = [systemMessage, ...currentMessages];

      // 构建参数对象
      const llmParams = {
        baseURL: activeLLMConfig.baseUrl,
        apiKey: currentConfig.apiKeys?.[currentConfig.activeLLMId] || '',
        model: currentConfig.userModel || '',
        messages: fullMessages,
        temperature: config.temperature,
        tools: config.tools || (activeServer && activeServer.tools) || [],
        parallelToolCalls: config.parallelToolCalls,
        proxyServer: undefined, // 如有 proxy 需求可补充
        postProcessMessages: undefined, // 如有后处理可补充
        customFetch: undefined, // 如有自定义 fetch 可补充
        onChunk: async (chunk: any) => {
          console.log('[streamManager] onChunk', chunk);
          // 工具链 glue
          let safeToolContent: string | undefined = undefined;
          if (typeof chunk.tool_content === 'string') {
            safeToolContent = chunk.tool_content;
          } else if (chunk.tool_content && typeof chunk.tool_content === 'object') {
            try {
              safeToolContent = JSON.stringify(chunk.tool_content);
            } catch {
              safeToolContent = undefined;
            }
          }
          messageManager.updateLastMessage({
            content: chunk.content,
            reasoning_content: chunk.reasoning_content,
            tool_content: safeToolContent,
            observation_content: chunk.observation_content,
            thought_content: chunk.thought_content,
            status: chunk.status || 'generating'
          });
          onUpdateLastMessage({
            content: chunk.content,
            reasoning_content: chunk.reasoning_content,
            tool_content: safeToolContent,
            observation_content: chunk.observation_content,
            thought_content: chunk.thought_content,
            status: chunk.status || 'generating'
          });
        },
        onDone: async (result: any) => {
          console.log('[streamManager] onDone', result);
          messageManager.updateLastMessage({
            content: result.content,
            reasoning_content: result.reasoning_content,
            tool_content: result.tool_content,
            observation_content: result.observation_content,
            thought_content: result.thought_content,
            status: 'stable',
          });
          onUpdateLastMessage({
            content: result.content,
            reasoning_content: result.reasoning_content,
            tool_content: result.tool_content,
            observation_content: result.observation_content,
            thought_content: result.thought_content,
            status: 'stable',
          });
          if (onStreamEnd) onStreamEnd(result);
        }
      };
      console.log('[streamManager] before streamLLMChat', llmParams);
      await streamLLMChat(llmParams);
      console.log('[streamManager] after streamLLMChat');
    } catch (err) {
      if (onError) onError(err instanceof Error ? err.message : String(err));
    }
  }

  return {
    handleSend,
    getMessages: () => messageManager.getMessages(),
    addMessage: (msg: RuntimeMessage) => messageManager.addMessage(msg),
    updateLastMessage: (patch: Partial<RuntimeMessage>) => messageManager.updateLastMessage(patch),
    clearMessages: () => messageManager.clearMessages(),
  };
} 