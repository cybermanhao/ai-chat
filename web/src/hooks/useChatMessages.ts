import { useState, useCallback, useEffect } from 'react';
import type { ChatMessage } from '../types';
import type { StreamingMessage } from '../types/chat';
import { getCurrentStream, llmService } from '../services/llmService';

export const useChatMessages = (messages: ChatMessage[], onSend?: (value: string) => void) => {
  const [localMessages, setLocalMessages] = useState<StreamingMessage[]>(
    messages.map(msg => ({ ...msg, status: 'stable' }))
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const addMessage = useCallback((message: StreamingMessage) => {
    setLocalMessages(prev => [...prev, message]);
  }, []);

  const updateLastMessage = useCallback((update: Partial<StreamingMessage>) => {
    setLocalMessages(prev => {
      const lastMessage = prev[prev.length - 1];
      if (lastMessage.status !== 'stable') {
        return [
          ...prev.slice(0, -1),
          { ...lastMessage, ...update }
        ];
      }
      return prev;
    });
  }, []);

  const removeLastMessage = useCallback(() => {
    setLocalMessages(prev => prev.slice(0, -1));
  }, []);

  // 同步初始消息
  useEffect(() => {
    if (messages.length > 0 && localMessages.length === 0) {
      setLocalMessages(messages.map(msg => ({ ...msg, status: 'stable' })));
    }
  }, [messages, localMessages.length]);

  // 在生成完成时通知父组件更新
  useEffect(() => {
    if (!isGenerating && localMessages.length > 0) {
      const lastMessage = localMessages[localMessages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.status === 'stable') {
        onSend?.(lastMessage.content);
      }
    }
  }, [isGenerating, localMessages, onSend]);

  // 处理中止
  const handleAbort = useCallback(() => {
    const stream = getCurrentStream();
    if (stream) {
      llmService.abortCurrentStream();
      setIsGenerating(false);
      setLocalMessages(prev => {
        const last = prev[prev.length - 1];
        if (last.status !== 'stable') {
          return prev.slice(0, -1);
        }
        return prev;
      });
    }
  }, []);

  return {
    localMessages,
    isGenerating,
    setIsGenerating,
    addMessage,
    updateLastMessage,
    removeLastMessage,
    handleAbort
  };
};
