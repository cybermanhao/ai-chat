import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useLLMConfig } from '@/hooks/useLLMConfig';
import { useModelConfig } from '@/hooks/useModelConfig';
import MessageList from './components/MessageList';
import InputSender from './components/InputSender';
import ChatHeader from './components/ChatHeader';
import { llmService } from '@/services/llmService';
import { createMessage } from '@/utils/messageFactory';
import { handleResponseStream } from '@/utils/streamHandler';
import { useChatStore } from '@/store/chatStore';
import type { StreamingMessage } from '@/types/chat';
import './styles.less';

const Chat: React.FC = () => {
  const [value, setValue] = useState('');
  const { activeLLM, currentConfig } = useLLMConfig();
  const { config } = useModelConfig();
  const { chatId: urlChatId } = useParams<{ chatId: string }>();
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    messages,
    addMessage,
    setCurrentId,
  } = useChatStore();

  const isDisabled = !urlChatId || !activeLLM || !currentConfig?.model || !currentConfig?.apiKey;

  // 当切换聊天时，清空输入框并更新当前聊天ID
  useEffect(() => {
    setValue('');
    if (urlChatId) {
      setCurrentId(urlChatId);
    }
  }, [urlChatId, setCurrentId]);  // 更新最后一条消息
  const updateLastMessage = useCallback((update: Partial<StreamingMessage>) => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      const updatedMessage = {
        role: 'assistant' as const,
        id: lastMessage.id,
        timestamp: lastMessage.timestamp,
        content: update.content || lastMessage.content,
        status: update.status || 'stable',
        reasoning_content: update.reasoning_content
      };
      addMessage(updatedMessage);
    }
  }, [messages, addMessage]);

  // 删除最后一条消息
  const removeLastMessage = useCallback(() => {
    const newMessages = [...messages];
    newMessages.pop();
    addMessage(newMessages[newMessages.length - 1]);
  }, [messages, addMessage]);
  // 处理中止请求
  const handleAbort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  }, []);

  const handleSubmit = async () => {
    if (!value.trim() || isDisabled) return;
    
    const userMessage = createMessage.user(value);
    const assistantMessage = createMessage.assistant('');
    
    setValue('');
    addMessage(userMessage);
    addMessage(assistantMessage);
    setIsGenerating(true);
      try {
      abortControllerRef.current = new AbortController();
      
      // 仅发送标准的 OpenAI 格式消息
      const standardMessages = messages
        .map(({ role, content }) => ({
          role,
          content: content.trim()
        }));
      
      // 添加当前用户消息
      standardMessages.push({
        role: 'user',
        content: value.trim()
      });
      
      const stream = await llmService.createChatCompletion({
        baseURL: currentConfig.baseUrl!,
        apiKey: currentConfig.apiKey!,
        model: currentConfig.model!,
        messages: standardMessages,
        temperature: config.temperature || 1,
        tools: config.enabledTools?.length > 0 ? [] : undefined,
        parallelToolCalls: false,

      });

      await handleResponseStream(
        stream,
        (reasoning: string) => updateLastMessage({ 
          status: 'thinking', 
          reasoning_content: reasoning 
        }),
        (content: string, reasoning: string) => updateLastMessage({
          status: 'answering',
          content,
          reasoning_content: reasoning || undefined
        }),
        (content: string, reasoning: string) => updateLastMessage({
          status: 'stable',
          content,
          reasoning_content: reasoning || undefined
        })
      );
    } catch (error) {
      console.error('Chat completion error:', error);
      removeLastMessage();
    } finally {      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="chat-container">
      <ChatHeader />
      <div className="chat-content">
        <div className="talking-inner">
          <MessageList messages={messages} />
        </div>
        <div className="input-area">
          <InputSender 
            loading={isGenerating}
            disabled={isDisabled}
            value={value}
            onChange={setValue}
            onSubmit={handleSubmit}
            onAbort={isGenerating ? handleAbort : undefined}
            placeholder={
              !urlChatId 
                ? "请先创建或选择一个对话..." 
                : !activeLLM 
                  ? "请先在设置中选择模型..." 
                  : !currentConfig?.apiKey 
                    ? "请先在设置中配置 API Key..." 
                    : "输入消息..."
            }
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;
