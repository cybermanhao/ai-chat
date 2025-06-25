import { useRef, useCallback } from 'react';
import { ChatMessageManager } from '@engine/utils/ChatMessageManager';
import { webLLMStreamHandler } from '@engine/utils/webLLMStreamHandler';
import { useToolCallHandler } from '@/hooks/useToolCallHandler';
import { handleResponseStream } from '@/utils/streamHandler';
import { createMessage } from '@engine/utils/messageFactory';
import type { RuntimeMessage } from '@engine/types/chat';
import type { CompletionResult } from '@/utils/streamHandler';

export function useLLMStreamManager({
  initialMessages,
  saveChat,
  mcpServiceInstance,
  config,
  currentConfig,
  activeLLM,
  activeServer,
  scrollToBottom,
  setIsGenerating,
  setLlmError,
}: {
  initialMessages: RuntimeMessage[];
  saveChat: () => void;
  mcpServiceInstance: any;
  config: any;
  currentConfig: any;
  activeLLM: any;
  activeServer: any;
  scrollToBottom: () => void;
  setIsGenerating: (v: boolean) => void;
  setLlmError: (msg: string | null) => void;
}) {
  const abortControllerRef = useRef<AbortController | null>(null);
  const messageManagerRef = useRef(new ChatMessageManager(initialMessages, saveChat));
  const messageManager = messageManagerRef.current;

  const handleToolCall = useToolCallHandler(
    (msg: RuntimeMessage) => messageManager.addMessage(msg),
    (patch: Partial<RuntimeMessage>) => messageManager.updateLastMessage(patch),
    mcpServiceInstance
  );

  const handleSend = useCallback(async (inputValue: string) => {
    if (!inputValue.trim()) return;
    setLlmError(null);
    try {
      const userMessage = createMessage.user(inputValue.trim()) as RuntimeMessage;
      messageManager.addMessage(userMessage);
      scrollToBottom();
      setIsGenerating(true);
      const assistantMessage = createMessage.assistant('') as RuntimeMessage;
      messageManager.addMessage(assistantMessage);
      // 用局部变量追踪最新消息，避免闭包问题
      const currentMessages = [...messageManager.getMessages()];
      const systemMessage = createMessage.system(config.systemPrompt) as RuntimeMessage;
      const fullMessages = [systemMessage, ...currentMessages];
      abortControllerRef.current = new AbortController();
      // 构造 LLMConfig，UI 配置优先
      const llmConfig = {
        model: currentConfig.userModel || '',
        apiKey: currentConfig.apiKey,
        apiUrl: activeLLM.baseUrl,
      };
      // 构造 extraOptions，UI 配置优先
      const extraOptions: Record<string, unknown> = {
        model: currentConfig.userModel || '',
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        systemPrompt: config.systemPrompt,
        apiKey: currentConfig.apiKey,
        apiUrl: activeLLM.baseUrl,
      };
      if (activeServer && Array.isArray(activeServer.tools) && activeServer.tools.length > 0) {
        extraOptions.parallelToolCalls = false;
      }
      const payload = {
        messages: fullMessages,
        server: activeServer ? { tools: activeServer.tools, llmConfig } : undefined,
        extraOptions,
      };
      const llmService = activeLLM.llmService;
      const stream = await llmService.generate(
        payload,
        abortControllerRef.current.signal
      );
      await handleResponseStream(
        stream,
        async (chunk) => {
          await webLLMStreamHandler(chunk, currentMessages, {
            updateLastMessage: (patch) => messageManager.updateLastMessage(patch),
            updateMessageContent: (params) => messageManager.updateLastMessage(params),
            handleToolCall,
          });
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
          scrollToBottom();
        }
      );
    } catch (err) {
      setLlmError(err instanceof Error ? err.message : String(err));
      setIsGenerating(false);
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [messageManager, mcpServiceInstance, config, currentConfig, activeLLM, activeServer, scrollToBottom, setIsGenerating, setLlmError]);

  const handleStop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  }, [setIsGenerating]);

  return {
    handleSend,
    handleStop,
    getMessages: () => messageManager.getMessages(),
    addMessage: (msg: RuntimeMessage) => messageManager.addMessage(msg),
    updateLastMessage: (patch: Partial<RuntimeMessage>) => messageManager.updateLastMessage(patch),
    clearMessages: () => messageManager.clearMessages(),
  };
}
