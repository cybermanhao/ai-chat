import React, { useState, useCallback, useEffect } from 'react';
import { useLLMConfig } from '@/hooks/useLLMConfig';
import { useModelConfig } from '@/hooks/useModelConfig';
import MessageList from './components/MessageList';
import InputSender from './components/InputSender';
import type { ChatMessage } from '@/types';
import { llmService, getCurrentStream } from '@/services/llmService';
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
  const { config } = useModelConfig();

  // 在组件卸载时中止流
  useEffect(() => {
    return () => {
      const stream = getCurrentStream();
      if (stream) {
        llmService.abortCurrentStream();
      }
    };
  }, []);

  // 处理中止
  const handleAbort = useCallback(() => {
    const stream = getCurrentStream();
    if (stream) {
      llmService.abortCurrentStream();
      setIsStreaming(false);
      // 移除最后一条未完成的消息
      setLocalMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.streaming) {
          return prev.slice(0, -1);
        }
        return prev;
      });
    }
  }, []);

  React.useEffect(() => {
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
    setIsStreaming(true);
    
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

      let fullResponse = '';
      try {
        for await (const chunk of stream) {
          if (!chunk.data) continue;
          
          console.log('Received chunk:', chunk.data);
          
          // 处理 [DONE] 标记
          if (chunk.data === '[DONE]') {
            console.log('Stream completed');
            break;
          }
          
          try {
            const data = JSON.parse(chunk.data);
            // 处理 OpenAI 格式的响应
            if (data.choices?.[0]?.delta?.content) {
              const content = data.choices[0].delta.content;
              console.log('Content chunk:', content);
              fullResponse += content;
              setLocalMessages(prev => {
                const lastMessage = prev[prev.length - 1];
                if (lastMessage?.streaming) {
                  return [
                    ...prev.slice(0, -1),
                    { ...lastMessage, content: fullResponse },
                  ];
                }
                return prev;
              });
            }
          } catch {
            console.warn('Failed to parse chunk:', chunk.data);
            continue;
          }
        }

        // 流式响应完成，添加最终消息
        setLocalMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage?.streaming) {
            return [
              ...prev.slice(0, -1),
              { ...lastMessage, content: fullResponse, streaming: false },
            ];
          }
          return prev;
        });
      } catch (streamError) {
        console.error('Streaming error:', streamError);
        // 出错时移除最后一条消息
        setLocalMessages(prev => prev.slice(0, -1));
        throw streamError;
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
          onAbort={isStreaming ? handleAbort : undefined}
          placeholder={activeLLM ? "输入消息..." : "请先在设置中选择模型..."}
        />
      </div>
    </div>
  );
};

export default Chat;
