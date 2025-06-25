import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLLMConfig } from '@/hooks/useLLMConfig';
import { useModelConfig } from '@/hooks/useModelConfig';
import MessageList from './components/MessageList';
import InputSender from './components/InputSender';
import ChatHeader from './components/ChatHeader';
import { Card } from 'antd';
import WebLLMService from '@/services/llmService';
import { createMessage } from '@engine/utils/messageFactory';
import { handleResponseStream } from '@/utils/streamHandler';
import { useChatStore } from '@/store/chatStore';
import { useChatMessages } from '@/hooks/useChatMessages';
import { handleLLMError } from '@/utils/errorHandler';
import { useStore } from 'zustand';
import { useChatRuntimeStore as useChatRuntimeStoreHook } from '@/store/chatRuntimeStore';
import { useThemeStore } from '@/store/themeStore';
import { ChatStorageService } from '@/services/chatStorage';
import { getStorage } from '@/utils/storage';
import { useMCPStore, getMCPServiceById } from '@/store/mcpStore';
import { buildLLMRequestPayload } from '@/utils/llmConfig';
import { useToolCallHandler } from '@/hooks/useToolCallHandler';
import { useLLMStreamHandler } from '@/hooks/useLLMStreamHandler';
import './styles.less';
import type { StreamChunk, RuntimeMessage } from '@/types/chat';
import type { CompletionResult } from '@/utils/streamHandler';
import MemeLoading from '@/components/memeLoading';

// 实例化 llmService，使用 Web 端继承后的 LLMService
const llmService = new WebLLMService();

export const Chat = () => {
  const [inputValue, setInputValue] = useState('');
  const { activeLLM, currentConfig } = useLLMConfig();
  const { config } = useModelConfig();
  const { chatId: urlChatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const abortControllerRef = useRef<AbortController | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);
  const [llmError, setLlmError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { dmMode } = useThemeStore();
  const { servers, activeServerId } = useMCPStore();

  // 获取消息运行时状态更新函数
  const updateMessageContentRaw = useStore(useChatRuntimeStoreHook, state => state.updateMessageContent);
  // updateMessageContent 需要 Partial<RuntimeMessage> & { messageId: string }, 但实际 store 只接受 content: string 必填
  // 包装一层，保证 content 字段始终为 string
  const updateMessageContentSafe = (params: Partial<RuntimeMessage> & { messageId: string }) => {
    const { messageId } = params;
    const content = params.content ?? '';
    const reasoning_content = 'reasoning_content' in params ? params.reasoning_content : undefined;
    const tool_content = 'tool_content' in params ? params.tool_content : undefined;
    const observation_content = 'observation_content' in params ? params.observation_content : undefined;
    const thought_content = 'thought_content' in params ? params.thought_content : undefined;
    updateMessageContentRaw({
      messageId,
      content,
      reasoning_content,
      tool_content,
      observation_content,
      thought_content
    });
  };

  const {
    setCurrentId,
    getCurrentChat,
    saveChat,
    loadChat,
    initFromStorage, // 新增
  } = useStore(useChatStore);

  // 使用增强的消息管理Hook
  // 修正 useChatMessages 参数类型
  const {
    messages,
    isGenerating,
    setIsGenerating,
    addMessage,
    updateLastMessage
  } = useChatMessages(urlChatId || '');

  const isDisabled = !urlChatId || !activeLLM || !currentConfig?.models || !currentConfig?.apiKey;

  // 当切换聊天时，清空输入框、加载消息并更新当前聊天ID
  // 防止死循环：只在新建/切换对话时分配一次默认模型
  // 只在切换对话时分配一次默认模型，彻底避免死循环
  useEffect(() => {
    setInputValue('');
    if (urlChatId) {
      setCurrentId(urlChatId);
      // 载入消息时显示 loading
      setLoading(true);
      Promise.resolve(loadChat(urlChatId)).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [urlChatId, setCurrentId, loadChat]);
  // 自动保存聊天内容
  // useEffect(() => {
  //   if (messages.length > 0) {
  //     saveChat();
  //   }
  // }, [messages, saveChat]);

  // 页面挂载时，优先从本地存储同步 chatData 到 zust道
  useEffect(() => {
    if (urlChatId) {
      initFromStorage(urlChatId);
    }
  }, [urlChatId, initFromStorage]);

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, []);
  // 滚动到当前聊天 - 暂时不使用这个功能
  // const scrollToChat = useCallback((id: string) => {
  //   const target = document.getElementById(id);
  //   if (target) {
  //     target.scrollIntoView({ behavior: 'smooth' });
  //   }
  // }, []);

  // 监听消息变化自动滚动
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  // 发送消息时显式保存
  const handleSend = async () => {

    if (!inputValue.trim() || !urlChatId) return;
    setLlmError(null);
    try {
      const userMessage = createMessage.user(inputValue.trim()) as RuntimeMessage;
      addMessage(userMessage);
      setInputValue('');
      scrollToBottom();
      saveChat();
      try {
        setIsGenerating(true);
        const assistantMessage = createMessage.assistant('') as RuntimeMessage;
        addMessage(assistantMessage);
        saveChat();
        if (activeLLM.id !== 'deepseek') {
          throw new Error(`当前仅支持 DeepSeek，${activeLLM.name} 暂未实现`);
        }
        // 用局部变量追踪最新消息，避免闭包问题
        const currentMessages = [...messages, userMessage, assistantMessage];
        const systemMessage = createMessage.system(config.systemPrompt) as RuntimeMessage;
        const fullMessages = [systemMessage, ...currentMessages];
        abortControllerRef.current = new AbortController();
        // 获取当前激活的 MCP server
        const activeServer = servers.find(s => s.id === activeServerId);
        // 构造 LLMConfig，UI 配置优先
        const llmConfig = {
          model: currentConfig.userModel || '',
          apiKey: currentConfig.apiKey,
          apiUrl: activeLLM.baseUrl, // 用 baseUrl 作为 apiUrl
        };
        // 构造 extraOptions，UI 配置优先
        const extraOptions: Record<string, unknown> = {
          model: currentConfig.userModel || '',
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          systemPrompt: config.systemPrompt,
          apiKey: currentConfig.apiKey,
          apiUrl: activeLLM.baseUrl, // 用 baseUrl 作为 apiUrl
        };
        // 如果有 tools，强制加 parallelToolCalls: false
        if (activeServer && Array.isArray(activeServer.tools) && activeServer.tools.length > 0) {
          extraOptions.parallelToolCalls = false;
        }
        const payload = buildLLMRequestPayload(
          fullMessages,
          {
            server: activeServer ? { tools: activeServer.tools, llmConfig } : undefined,
            extraOptions,
          }
        );
        const stream = await llmService.generate(
          payload,
          abortControllerRef.current.signal
        );
        // 替换 handleResponseStream 的 onChunk 回调：
        await handleResponseStream(
          stream,
          (chunk: StreamChunk) => handleLLMStream(chunk, currentMessages),
          async (result: CompletionResult) => {
            patchMessage({
              updateLastMessage,
              currentMessages,
              patch: {
                content: result.content,
                reasoning_content: result.reasoning_content,
                tool_content: result.tool_content,
                observation_content: result.observation_content,
                thought_content: result.thought_content,
              },
              status: 'stable'
            });
            scrollToBottom();
            saveChat();
          }
        );
      } catch (err) {
        setLlmError(err instanceof Error ? err.message : String(err));
        setIsGenerating(false);
        const errorNotice = handleLLMError(err);
        // 用最新 closure
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.status !== 'stable') {
          addMessage({
            ...lastMessage,
            content: '',
            status: 'done'
          });
        }
        addMessage(errorNotice);
        saveChat();
      } finally {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    } catch (error) {
      console.error('Send message failed:', error);
    }
    
  };

  // 停止流式响应时也保存
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
      // 用最新 closure
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.id) {
        updateLastMessage({
          content: lastMessage.content,
          status: 'done'
        });
        if (lastMessage.role === 'assistant') {
          const assistantMessage = lastMessage as { reasoning_content?: string };
          const reasoning = assistantMessage.reasoning_content;
          updateMessageContentSafe({
            messageId: lastMessage.id,
            content: lastMessage.content,
            reasoning_content: reasoning
          });
        }
        saveChat();
      }
    }
  };

  const chat = getCurrentChat();
  
  // 打开项目时自动跳转到本地上次聊天
  useEffect(() => {
    const chatStorage = new ChatStorageService(getStorage());
    const lastChatId = chatStorage.getCurrentChatId();
    if (!urlChatId && lastChatId) {
      navigate(`/chat/${lastChatId}`, { replace: true });
    }
  }, [urlChatId, navigate]);

  const mcpServiceInstance = activeServerId ? getMCPServiceById(activeServerId) : undefined;
  const handleToolCall = useToolCallHandler(addMessage, updateLastMessage, mcpServiceInstance);
  const handleLLMStream = useLLMStreamHandler(updateLastMessage, updateMessageContentSafe, handleToolCall);

  // 工具函数：统一 patch 消消息
  function patchMessage({
    updateLastMessage,
    currentMessages,
    patch,
    status
  }: {
    updateLastMessage: (patch: Partial<RuntimeMessage>) => void;
    currentMessages: RuntimeMessage[];
    patch: Partial<RuntimeMessage>;
    status: RuntimeMessage['status'];
  }) {
    updateLastMessage({ ...patch, status });
    const lastMessage = currentMessages[currentMessages.length - 1];
    if (lastMessage && lastMessage.id) {
      updateMessageContentSafe({
        messageId: lastMessage.id,
        ...patch
      });
    }
  }

  // 渲染部分
  return (
    <div className="chat-page">
      {llmError && (
        <Card type="inner" style={{ marginBottom: 16, borderColor: '#ff4d4f' }}>
          {llmError}
        </Card>
      )}
      <ChatHeader title={chat?.title} />
      <div className="chat-content">
        <MessageList 
          messages={messages}
          isGenerating={isGenerating}
          ref={messageListRef}
        />
        <InputSender
          value={inputValue}
          disabled={isDisabled}
          isGenerating={isGenerating}
          onInputChange={handleInputChange}
          onSend={handleSend}
          onStop={handleStop}
        />
      </div>
      <MemeLoading loadingSignal={loading} safemod={!dmMode} />
    </div>
  );
};
