import React, { useState } from 'react';
import { useLLMConfig } from '@/hooks/useLLMConfig';
import { useModelConfig } from '@/hooks/useModelConfig';
import MessageList from './components/MessageList';
import InputSender from './components/InputSender';
import type { ChatMessage } from '@/types';
import { llmService } from '@/services/llmService';
import './styles.less';

interface ChatProps {
  messages: ChatMessage[];
  loading?: boolean;
  onSend?: (value: string) => void;
  disabled?: boolean;
}

interface StreamingMessage extends ChatMessage {
  streaming?: boolean;
}

const Chat: React.FC<ChatProps> = ({ messages = [], loading = false, onSend, disabled }) => {
  const [value, setValue] = useState('');
  const [localMessages, setLocalMessages] = useState<StreamingMessage[]>(messages);
  const [isStreaming, setIsStreaming] = useState(false);
  const { activeLLM, currentConfig } = useLLMConfig();
  const { config } = useModelConfig();  React.useEffect(() => {
    // Only sync messages when not streaming
    if (!isStreaming) {
      setLocalMessages(messages);
    }
  }, [messages, isStreaming]);

  const handleSubmit = async () => {
    if (!value.trim() || !currentConfig?.model || !currentConfig.apiKey) return;
      const timestamp = Date.now();
    const messageId = `msg-${timestamp}`;
    const trimmedValue = value.trim();
    
    const userMessage: StreamingMessage = {
      id: messageId,
      role: 'user',
      content: trimmedValue,
      timestamp,
    };
    
    const assistantMessage: StreamingMessage = {
      id: `${messageId}-response`,
      role: 'assistant',
      content: '',
      timestamp,
      streaming: true,
    };
    
    setValue('');
    setLocalMessages(prev => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);    try {
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

      let fullResponse = '';
      for await (const chunk of stream) {
        const data = JSON.parse(chunk.data);
        if (data.content) {
          fullResponse += data.content;
          setLocalMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage.streaming) {
              return [
                ...prev.slice(0, -1),
                { ...lastMessage, content: fullResponse },
              ];
            }
            return prev;
          });
        }
      }

      if (onSend) {
        onSend(trimmedValue);
      }
    } catch (error) {
      console.error('Chat completion error:', error);
      setLocalMessages(prev => prev.slice(0, -1));
    } finally {
      setIsStreaming(false);
    }
  };  return (
    <div className="talking">
      <div className="talking-inner">
        <MessageList messages={localMessages} />
      </div>
      <div className="input-area">
        <InputSender 
          loading={loading || disabled || !activeLLM || isStreaming}
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
          placeholder={activeLLM ? "输入消息..." : "请先在设置中选择模型..."}
        />
      </div>
    </div>
  );
};

export default Chat;
