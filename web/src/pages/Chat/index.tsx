import React, { useState, useCallback, useEffect } from 'react';
import { useLLMConfig } from '@/hooks/useLLMConfig';
import { useModelConfig } from '@/hooks/useModelConfig';
import MessageList from './components/MessageList';
import InputSender from './components/InputSender';
import type { ChatMessage } from '@/types';
import { llmService, getCurrentStream } from '@/services/llmService';
import './styles.less';
import { CloudSyncOutlined } from '@ant-design/icons';

interface ChatProps {
  messages: ChatMessage[];
  loading?: boolean;
  onSend?: (value: string) => void;
  disabled?: boolean;
}

type MessageStatus = 'connecting' | 'thinking' | 'answering' | 'stable';

interface StreamingMessage extends ChatMessage {
  reasoning_content?: string;
  status: MessageStatus;
}

const Chat: React.FC<ChatProps> = ({ messages = [], loading = false, onSend, disabled }) => {
  const [value, setValue] = useState('');
  const [localMessages, setLocalMessages] = useState<StreamingMessage[]>(
    messages.map(msg => ({ ...msg, status: 'stable' }))
  );
  const [isGenerating, setIsGenerating] = useState(false);
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
      setIsGenerating(false);
      // 移除最后一条未完成的消息
      setLocalMessages(prev => {
        const last = prev[prev.length - 1];
        if (last.status !== 'stable') {
          return prev.slice(0, -1);
        }
        return prev;
      });
    }
  }, []);
  React.useEffect(() => {
    // Sync initial messages only when the component mounts
    if (messages.length > 0 && localMessages.length === 0) {
      setLocalMessages(messages.map(msg => ({ ...msg, status: 'stable' })));
    }
  }, [messages, localMessages]);

  // 在生成完成时通知父组件更新
  useEffect(() => {
    if (!isGenerating && localMessages.length > 0) {
      const lastMessage = localMessages[localMessages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.status === 'stable') {
        // 将所有本地消息同步回父组件
        if (onSend) {
          onSend(lastMessage.content);
        }
      }
    }
  }, [isGenerating, localMessages, onSend]);

  const handleSubmit = async () => {
    if (!value.trim() || !currentConfig?.model || !currentConfig.apiKey) return;
    const timestamp = Date.now();
    const messageId = `msg-${timestamp}`;
    
    const userMessage: StreamingMessage = {
      id: messageId,
      role: 'user',
      content: value.trim(),
      timestamp,
      status: 'stable'
    };
    
    const assistantMessage: StreamingMessage = {
      id: `${messageId}-response`,
      role: 'assistant',
      content: '',
      timestamp,
      status: 'connecting'
    };
    
    setValue('');
    setLocalMessages(prev => [...prev, userMessage, assistantMessage]);
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

      let fullResponse = '';
      let fullReasoningResponse = '';      try {
        for await (const chunk of stream) {          if (!chunk.data) continue;
          
          console.log('Chunk data:', JSON.stringify(chunk.data));
          
          let data;
          try {
            data = JSON.parse(chunk.data);

            // 如果是最后一条消息（包含finish_reason和统计信息），跳过处理
            if (data.choices?.[0]?.finish_reason === 'stop' && data.usage) {
              console.log('Stream ended with finish_reason: stop');
              console.log('Final response:', { reasoning: fullReasoningResponse, content: fullResponse });
              break;
            }          } catch {
            // 仅在非 [DONE] 标记时打印错误
            if (chunk.data !== '[DONE]') {
              console.warn('Failed to parse chunk:', chunk.data);
            }
            continue;
          }

          const delta = data.choices?.[0]?.delta;
          if (!delta) continue;
          
          // 处理 reasoning_content
          if (delta.reasoning_content) {
            fullReasoningResponse += delta.reasoning_content;
            setLocalMessages(prev => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage.status !== 'stable') {
                return [
                  ...prev.slice(0, -1),
                  { ...lastMessage, status: 'thinking', reasoning_content: fullReasoningResponse }
                ];
              }
              return prev;
            });
          }
          
          // 处理 content
          if (delta.content) {
            fullResponse += delta.content;
            setLocalMessages(prev => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage.status !== 'stable') {
                return [
                  ...prev.slice(0, -1),
                  { 
                    ...lastMessage, 
                    status: 'answering',
                    content: fullResponse,
                    reasoning_content: fullReasoningResponse || undefined 
                  }
                ];
              }
              return prev;
            });
          }
        }

        // 流式响应完成，添加最终消息
        setLocalMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage.status !== 'stable') {
            return [
              ...prev.slice(0, -1),
              { 
                ...lastMessage, 
                content: fullResponse,
                reasoning_content: fullReasoningResponse || undefined,
                status: 'stable'
              }
            ];
          }
          return prev;        });
      } catch (streamError) {
        console.error('Streaming error:', streamError);
        setLocalMessages(prev => prev.slice(0, -1));
        throw streamError;
      }
    } catch (error) {
      console.error('Chat completion error:', error);
      setLocalMessages(prev => prev.slice(0, -1));
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
