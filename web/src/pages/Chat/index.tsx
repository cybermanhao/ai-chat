import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useLLMConfig } from '@/hooks/useLLMConfig';
import { useModelConfig } from '@/hooks/useModelConfig';
import MessageList from './components/MessageList';
import InputSender from './components/InputSender';
import ChatHeader from './components/ChatHeader';
import { llmService } from '@/services/llmService';
import { createMessage } from '@/utils/messageFactory';
import { handleResponseStream } from '@/utils/streamHandler.new';
import { useChatStore } from '@/store/chatStore';
import { useChatMessages } from '@/hooks/useChatMessages';
import { handleLLMError } from '@/utils/errorHandler';
import type { StreamChunk, RuntimeMessage } from '@/types/chat';
import './styles.less';

export const Chat = () => {
  const [inputValue, setInputValue] = useState('');
  const { activeLLM, currentConfig } = useLLMConfig();
  const { config } = useModelConfig();
  const { chatId: urlChatId } = useParams<{ chatId: string }>();
  const abortControllerRef = useRef<AbortController | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);

  const {
    setCurrentId,
    getCurrentChat,
    saveChat,
    loadChat,
  } = useChatStore();
    // 使用增强的消息管理Hook
  const {
    messages,
    isGenerating,
    setIsGenerating,
    addMessage,
    updateLastMessage
    // 未使用的功能
    // addClientNotice,
    // handleAbort
  } = useChatMessages(urlChatId || null);

  const isDisabled = !urlChatId || !activeLLM || !currentConfig?.model || !currentConfig?.apiKey;

  // 当切换聊天时，清空输入框、加载消息并更新当前聊天ID
  useEffect(() => {
    setInputValue('');
    if (urlChatId) {
      setCurrentId(urlChatId);
      loadChat(urlChatId);
    }
  }, [urlChatId, setCurrentId, loadChat]);

  // 自动保存聊天内容
  useEffect(() => {
    if (messages.length > 0) {
      saveChat();
    }
  }, [messages, saveChat]);

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

    try {      // 创建用户消息
      const userMessage = createMessage.user(inputValue.trim()) as RuntimeMessage;
      addMessage(userMessage);
      setInputValue('');
      scrollToBottom();

      try {
        setIsGenerating(true);
        // 创建助手消息
        const assistantMessage = createMessage.assistant('') as RuntimeMessage;
        addMessage(assistantMessage);
        
        // 构建包含新用户消息的消息列表
        const currentMessages = [...messages, userMessage];        // 构建完整的消息列表，包括系统提示词
        const systemMessage = createMessage.system(config.systemPrompt) as RuntimeMessage;
        const fullMessages = [systemMessage, ...currentMessages];
        
        // 发送请求
        abortControllerRef.current = new AbortController();
        const stream = await llmService.generate(
          fullMessages,
          config,
          currentConfig!,
          abortControllerRef.current.signal
        );
        
        // 处理流式响应
        await handleResponseStream(
          stream,
          async (chunk: StreamChunk) => {
            updateLastMessage({
              content: chunk.content,
              status: chunk.status || 'generating'
            });
            scrollToBottom();
          },
          async (result: { content: string; reasoning?: string }) => {
            updateLastMessage({
              content: result.content,
              status: 'stable'
            });
            scrollToBottom();
          }
        );
      } catch (err) {
        console.error('Generate failed:', err);
        
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
  };
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
      updateLastMessage({
        content: messages[messages.length - 1].content,
        status: 'done'
      });
    }
  };

  const chat = getCurrentChat();
  
  return (
    <div className="chat-page">
      <ChatHeader title={chat?.title} />
      <div className="chat-content">        <MessageList 
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
    </div>
  );
};
