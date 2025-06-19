import React, { useState } from 'react';
import { useLLMConfig } from '@/hooks/useLLMConfig';
import { useModelConfig } from '@/hooks/useModelConfig';
import MessageList from './components/MessageList';
import InputSender from './components/InputSender';
import { llmService } from '@/services/llmService';
import { createMessage } from '@/utils/messageFactory';
import { handleResponseStream } from '@/utils/streamHandler';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useChatList } from '@/hooks/useChatList';
import './styles.less';

const Chat: React.FC = () => {
  const [value, setValue] = useState('');
  const { activeLLM, currentConfig } = useLLMConfig();
  const { config } = useModelConfig();
  const { currentChatId } = useChatList();
  
  const {
    messages,
    isGenerating,
    setIsGenerating,
    addMessage,
    updateLastMessage,
    removeLastMessage,
    handleAbort
  } = useChatMessages(currentChatId, []);

  const isDisabled = !currentChatId || !activeLLM || !currentConfig?.model || !currentConfig?.apiKey;

  const handleSubmit = async () => {
    if (!value.trim() || isDisabled) return;
    
    const userMessage = createMessage.user(value);
    const assistantMessage = createMessage.assistant(userMessage.id);
    
    setValue('');
    addMessage(userMessage);
    addMessage(assistantMessage);
    setIsGenerating(true);
    
    try {
      const stream = await llmService.createChatCompletion({
        baseURL: currentConfig.baseUrl!,
        apiKey: currentConfig.apiKey!,
        model: currentConfig.model!,
        messages: [...messages, userMessage],
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
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="talking">
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
            !currentChatId 
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
  );
};

export default Chat;
