import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useLLMConfig } from '@/hooks/useLLMConfig';
// web 端请勿复用 engine/hooks/useModelConfig，需从 web/hooks/useModelConfig 导入
import { useModelConfig } from '@/hooks/useModelConfig';
import MessageList from './components/MessageList';
import InputSender from './components/InputSender';
import ChatHeader from './components/ChatHeader';

import { createMessage } from '@engine/utils/messageFactory';
import { handleResponseStream } from '@/utils/streamHandler';
import { useChatStore } from '@/store/chatStore';
import { useChatMessages } from '@/hooks/useChatMessages';
import { handleLLMError } from '@/utils/errorHandler';
import { useChatRuntimeStore } from '@/store/chatRuntimeStore';
import WebLLMService from '@/services/llmService';
import type { StreamChunk, RuntimeMessage } from '@/types/chat';
import type { AssistantMessage } from '@/types/chat';
import type { CompletionResult } from '@/utils/streamHandler';
import './styles.less';

// 在组件外部创建单例 llmService 实例
const llmService = new WebLLMService();

export const Chat = () => {
  const [inputValue, setInputValue] = useState('');
  const { activeLLM, currentConfig, updateLLMConfig } = useLLMConfig();
  const { config } = useModelConfig();
  const { chatId: urlChatId } = useParams<{ chatId: string }>();
  const abortControllerRef = useRef<AbortController | null>(null);
  const messageListRef = useRef<HTMLDivElement>(null);

  // 获取消息运行时状态更新函数
  const updateMessageContent = useChatRuntimeStore(state => state.updateMessageContent);

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

  // 判断禁用原因
  let disabledReason = '';
  if (!urlChatId) disabledReason = '未选择对话';
  else if (!activeLLM) disabledReason = '未选择模型';
  else if (!currentConfig?.userModel) disabledReason = '未选择模型类型';
  else if (!currentConfig?.apiKey) disabledReason = '未配置 API Key';

  const isDisabled = Boolean(disabledReason);

  // 当切换聊天时，清空输入框、加载消息并更新当前聊天ID
  useEffect(() => {
    setInputValue('');
    if (urlChatId) {
      setCurrentId(urlChatId);
      loadChat(urlChatId);
    }
  }, [urlChatId, setCurrentId, loadChat]);

  // 只在新建/切换对话且 userModel 为空时分配默认模型，彻底避免死循环
  useEffect(() => {
    if (
      urlChatId &&
      activeLLM &&
      (!currentConfig.userModel || currentConfig.userModel === '') &&
      Array.isArray(activeLLM.models) &&
      activeLLM.models.length > 0
    ) {
      updateLLMConfig({ userModel: activeLLM.models[0] });
    }
  }, [urlChatId, activeLLM, currentConfig.userModel]);
  // 自动保存聊天内容
  useEffect(() => {
    console.log('Saving messages:', messages.length);
    if (messages.length > 0) {
      console.log('Messages to save:', messages.map(m => ({
        role: m.role,
        content: m.content.slice(0, 50) + '...',
        reasoning: 'reasoning_content' in m ? (m as AssistantMessage).reasoning_content?.slice(0, 50) + '...' : undefined
      })));
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

    try {
      // 创建用户消息
      const userMessage = createMessage.user(inputValue.trim()) as RuntimeMessage;
      console.log('Created user message:', userMessage);
      
      addMessage(userMessage);
      setInputValue('');
      scrollToBottom();

      try {
        setIsGenerating(true);
        // 创建助手消息
        const assistantMessage = createMessage.assistant('') as RuntimeMessage;
        console.log('Created assistant message:', assistantMessage);
        
        addMessage(assistantMessage);
        
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
            console.log('Received chunk:', {
              content: chunk.content.slice(0, 50) + '...',
              reasoning_content: chunk.reasoning_content ? chunk.reasoning_content.slice(0, 50) + '...' : undefined,
              tool_content: chunk.tool_content ? chunk.tool_content.slice(0, 50) + '...' : undefined,
              observation_content: chunk.observation_content ? chunk.observation_content.slice(0, 50) + '...' : undefined,
              thought_content: chunk.thought_content ? chunk.thought_content.slice(0, 50) + '...' : undefined,
              status: chunk.status
            });
            
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
            console.log('Stream completed:', {
              content: result.content.slice(0, 50) + '...',
              reasoning_content: result.reasoning_content ? result.reasoning_content.slice(0, 50) + '...' : undefined,
              tool_content: result.tool_content ? result.tool_content.slice(0, 50) + '...' : undefined,
              observation_content: result.observation_content ? result.observation_content.slice(0, 50) + '...' : undefined,
              thought_content: result.thought_content ? result.thought_content.slice(0, 50) + '...' : undefined
            });
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
        {isDisabled && (
          <div style={{ color: 'var(--error-color)', marginTop: 8, textAlign: 'center' }}>
            {disabledReason}
          </div>
        )}
      </div>
    </div>
  );
};
