import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { useChatRuntimeStore } from '@/store/chatRuntimeStore';
import { useStore } from 'zustand';
import type { StreamChunk, RuntimeMessage } from '@/types/chat';
import type { AssistantMessage } from '@/types/chat';
import type { CompletionResult } from '@/utils/streamHandler';
import GlobalLoading from '@/components/GlobalLoading';
import MemeLoading from '@/components/memeLoading';
import { useThemeStore } from '@/store/themeStore';
import { ChatStorageService } from '@/services/chatStorage';
import { getStorage } from '@/utils/storage';
import './styles.less';

// 实例化 llmService
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

  // 获取消息运行时状态更新函数
  const updateMessageContent = useStore(useChatRuntimeStore, state => state.updateMessageContent);

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
  useEffect(() => {

    if (messages.length > 0) {

      saveChat();
    }
  }, [messages, saveChat]);

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
  }, [messages, scrollToBottom]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };  const handleSend = async () => {
    if (!inputValue.trim() || !urlChatId) return;
    setLlmError(null);
    try {
      // 创建用户消息
      const userMessage = createMessage.user(inputValue.trim()) as RuntimeMessage;

      
      addMessage(userMessage);
      setInputValue('');
      scrollToBottom();

      try {
        setIsGenerating(true);
        // 创建助手消息
        const assistantMessage = createMessage.assistant('') as RuntimeMessage;

        
        addMessage(assistantMessage);
        
        // 检查 LLM 支持
        if (activeLLM.id !== 'deepseek') {
          throw new Error(`当前仅支持 DeepSeek，${activeLLM.name} 暂未实现`);
        }

        // 构建完整的消息列表，包括系统提示词
        const currentMessages = [...messages, userMessage];
        const systemMessage = createMessage.system(config.systemPrompt) as RuntimeMessage;
        const fullMessages = [systemMessage, ...currentMessages];
        
        // 发送请求
        abortControllerRef.current = new AbortController();
        const stream = await llmService.generate(
          fullMessages,
          config,
          { ...currentConfig, model: currentConfig.userModel || '', temperature: config.temperature, maxTokens: config.maxTokens, systemPrompt: config.systemPrompt },
          abortControllerRef.current.signal
        );
        
        // 处理流式响应
        await handleResponseStream(
          stream,          async (chunk: StreamChunk) => {

            // 更新消息内容和状态
            updateLastMessage({
              content: chunk.content,
              reasoning_content: chunk.reasoning_content,
              tool_content: chunk.tool_content,
              observation_content: chunk.observation_content,
              thought_content: chunk.thought_content,
              status: chunk.status || 'generating'
            });
            
            // 确保运行时状态也保存特定内容
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.id) {
              updateMessageContent({
                messageId: lastMessage.id,
                content: chunk.content,
                reasoning_content: chunk.reasoning_content,
                tool_content: chunk.tool_content,
                observation_content: chunk.observation_content,
                thought_content: chunk.thought_content,
              });
            }
            
            scrollToBottom();
          },
          async (result: CompletionResult) => {

              // 更新最终内容和状态
            updateLastMessage({
              content: result.content,
              reasoning_content: result.reasoning_content,
              tool_content: result.tool_content,
              observation_content: result.observation_content,
              thought_content: result.thought_content,
              status: 'stable'
            });
              // 确保运行时状态也保存所有内容
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.id) {
              updateMessageContent({
                messageId: lastMessage.id,
                content: result.content,
                reasoning_content: result.reasoning_content,
                tool_content: result.tool_content,
                observation_content: result.observation_content,
                thought_content: result.thought_content,
              });
            }
            scrollToBottom();
          }
        );
      } catch (err) {
        setLlmError(err instanceof Error ? err.message : String(err));
        setIsGenerating(false);
        
        // 使用错误处理器生成适当的客户端提示消息
        const errorNotice = handleLLMError(err);
        
        // 先移除"生成中"的消息
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.status !== 'stable') {
          addMessage({
            ...lastMessage,
            content: '',
            status: 'done'
          });
        }
        
        // 添加错误提示消息
        addMessage(errorNotice);
      } finally {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    } catch (error) {
      console.error('Send message failed:', error);
    }
  };  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
        const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.id) {
        // 只更新状态为done
        updateLastMessage({
          content: lastMessage.content,
          status: 'done'
        });
        
        // 同步运行时状态，但保留现有的reasoning_content
        if (lastMessage.role === 'assistant') {          // 使用类型断言访问助手消息特有的属性
          const assistantMessage = lastMessage as { reasoning_content?: string };
          const reasoning = assistantMessage.reasoning_content;
          updateMessageContent({
  messageId: lastMessage.id,
  content: lastMessage.content,
  reasoning_content: reasoning
});
        }
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
