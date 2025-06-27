import { ChatMessageManager } from '../managers/MessageManager';

import { handleResponseStream } from './streamHandler';
import type { CompletionResult } from './streamHandler';
import { buildLLMRequestPayload } from '../utils/llmConfig';
import type { RuntimeMessage } from '../types/chat';
import { ToolCallAccumulator } from './streamAccumulator';

export function createLLMStreamManager({
  initialMessages,
  saveChat,
  mcpServiceInstance,
  config,
  currentConfig,
  activeLLM,
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
  activeLLM: any;
  activeServer: any;
  onAddMessage: (msg: RuntimeMessage) => void;
  onUpdateLastMessage: (patch: Partial<RuntimeMessage>) => void;
  onStreamChunk?: (chunk: any) => void;
  onStreamEnd?: (result: CompletionResult) => void;
  onError?: (msg: string) => void;
}) {
  console.log('currentConfig:', currentConfig);
  console.log('activeLLM:', activeLLM);
  const messageManager = new ChatMessageManager(initialMessages, saveChat);

  async function handleSend(inputValue: string, abortSignal: AbortSignal) {
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
      
      // 使用 buildLLMRequestPayload 构建请求
      const payload = buildLLMRequestPayload(fullMessages, {
        server: activeServer ? { 
          tools: activeServer.tools, 
          llmConfig: {
            model: currentConfig.userModel || '',
            apiKey: currentConfig.apiKeys?.[currentConfig.activeLLMId] || '',
            apiUrl: activeLLM.baseUrl,
          }
        } : undefined,
        extraOptions: {
          model: currentConfig.userModel || '',
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          systemPrompt: config.systemPrompt,
          apiKey: currentConfig.apiKeys?.[currentConfig.activeLLMId] || '',
          apiUrl: activeLLM.baseUrl,
        }
      });
      
      const llmService = activeLLM.llmService;
      const stream = await llmService.generate(
        payload,
        abortSignal
      );
      // 判断是否有 tools
      const tools = config.tools || (activeServer && activeServer.tools);
      let toolCallAccumulator: ToolCallAccumulator | undefined = undefined;
      if (tools && Array.isArray(tools) && tools.length > 0) {
        toolCallAccumulator = new ToolCallAccumulator({
          onFlush: async (toolName, toolArgs) => {
            // 这里 glue 到 handleToolCall，可按需扩展
            // await handleToolCall(toolName, toolArgs);
          }
        });
      }
      await handleResponseStream(
        stream,
        async (chunk) => {
          // 兼容 deepseek 响应字段，所有字段均为可选
          // tool_content 可能为 string 或对象，需安全处理
          let safeToolContent: string | undefined = undefined;
          if (typeof chunk.tool_content === 'string') {
            safeToolContent = chunk.tool_content;
          } else if (chunk.tool_content && typeof chunk.tool_content === 'object') {
            // 兼容 deepseek function call 对象，序列化为字符串
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
          // tool call glue
          if (toolCallAccumulator && Array.isArray((chunk as any).tool_calls)) {
            toolCallAccumulator.addChunk((chunk as any).tool_calls);
          }
          if (toolCallAccumulator && chunk.tool_content && typeof chunk.tool_content === 'object' && (chunk.tool_content as any).name) {
            const toolContent = chunk.tool_content as any;
            const toolName = toolContent.name;
            let toolArgs: Record<string, unknown> = {};
            try {
              toolArgs = toolContent.arguments ? JSON.parse(toolContent.arguments) : {};
            } catch {}
            // 直接调用 onFlush 回调（注意 options 为私有，若需更优解建议通过 addChunk+flushIfNeeded 统一处理）
            await (toolCallAccumulator as any).options.onFlush(toolName, toolArgs);
          }
          // 检查 finish_reason，flush tool_calls
          if (toolCallAccumulator) {
            const finishReason = ((chunk as any).choices?.[0]?.finish_reason)
              || ((chunk as any).finish_reason);
            if (typeof toolCallAccumulator.flushIfNeeded === 'function') {
              await toolCallAccumulator.flushIfNeeded(finishReason);
            }
          }
          if (onStreamChunk) onStreamChunk(chunk);
        },
        async (result: CompletionResult) => {
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
      );
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