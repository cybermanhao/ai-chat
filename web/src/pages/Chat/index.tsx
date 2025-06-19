import React, { useState } from 'react';
import { useLLMConfig } from '@/hooks/useLLMConfig';
import { useModelConfig } from '@/hooks/useModelConfig';
import MessageList from './components/MessageList';
import InputSender from './components/InputSender';
import type { ChatMessage } from '@/types';
import { llmService } from '@/services/llmService';
import { createMessage } from '@/utils/messageFactory';
import { handleResponseStream } from '@/utils/streamHandler';
import { useChatMessages } from '@/hooks/useChatMessages';
import './styles.less';

interface ChatProps {
  messages: ChatMessage[];
  loading?: boolean;
  onSend?: (value: string) => void;
  disabled?: boolean;
}

const Chat: React.FC<ChatProps> = ({ messages = [], loading = false, onSend, disabled }) => {
  const [value, setValue] = useState('');
  const { activeLLM, currentConfig } = useLLMConfig();
  const { config } = useModelConfig();
  
  const {
    localMessages,
    isGenerating,
    setIsGenerating,
    addMessage,
    updateLastMessage,
    removeLastMessage,
    handleAbort
  } = useChatMessages(messages, onSend);

  const handleSubmit = async () => {
    if (!value.trim() || !currentConfig?.model || !currentConfig.apiKey) return;
    
    const userMessage = createMessage.user(value);
    const assistantMessage = createMessage.assistant(userMessage.id);
    
    setValue('');
    addMessage(userMessage);
    addMessage(assistantMessage);
    setIsGenerating(true);
    
    try {
      if (!currentConfig.baseUrl || !currentConfig.apiKey || !currentConfig.model) {
        throw new Error('Missing required configuration');
      }

      const stream = await llmService.createChatCompletion({
        baseURL: currentConfig.baseUrl,
        apiKey: currentConfig.apiKey,
        model: currentConfig.model,
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
        <MessageList messages={localMessages} />
      </div>
      <div className="input-area">
        <InputSender 
          loading={loading || disabled || !activeLLM || isGenerating}
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
          onAbort={isGenerating ? handleAbort : undefined}
          placeholder={activeLLM ? "输入消息..." : "请先在设置中选择模型..."}
        />
      </div>
    </div>
  );
};

export default Chat;
