// engine/hooks/useChatMessages.ts
// 纯逻辑聊天消息管理 Hook，可多端同构
import { useState, useCallback, useEffect } from 'react';
import type { ChatMessage, RuntimeMessage } from '../types/chat';
import { getCurrentStream } from '../service/llmService';
import { ChatStorageService } from '../service/chatStorage';
import { defaultStorage } from '../utils/storage';
import { defaultChatSetting } from '../config/defaultChatSetting';

// 创建全局共享的存储服务实例
const chatStorage = new ChatStorageService(defaultStorage);

export const useChatMessages = (
  chatId: string | null,
  onSend?: (value: string) => void
) => {
  const [localMessages, setLocalMessages] = useState<RuntimeMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const safeChatId = chatId ?? '';

  useEffect(() => {
    let mounted = true;
    const loadChatMessages = async () => {
      if (safeChatId) {
        const chatData = chatStorage.getChatData(safeChatId);
        if (mounted && chatData?.messages) {
          const runtimeMessages: RuntimeMessage[] = chatData.messages.map((msg: ChatMessage) => ({ ...msg, status: 'stable' as const }));
          setLocalMessages(runtimeMessages);
        } else if (mounted) {
          setLocalMessages([]);
        }
      } else {
        setLocalMessages([]);
      }
      if (mounted) setIsGenerating(false);
    };
    loadChatMessages();
    return () => {
      mounted = false;
      if (safeChatId) {
        const currentMessages = localMessages.map(msg => {
          const { status, ...chatMessage } = msg;
          return chatMessage as ChatMessage;
        });
        chatStorage.saveChatData(safeChatId, {
          info: {
            id: safeChatId,
            title: '新对话',
            createTime: Date.now(),
            updateTime: Date.now(),
            messageCount: currentMessages.length
          },
          messages: currentMessages,
          settings: chatStorage.getChatData(safeChatId)?.settings || defaultChatSetting,
          updateTime: Date.now()
        });
      }
    };
  }, [safeChatId]);

  const addMessage = useCallback((message: RuntimeMessage) => {
    if (!safeChatId) return;
    setLocalMessages(prev => {
      const newMessages = [...prev, message];
      if (message.status === 'stable') {
        const chatData = chatStorage.getChatData(safeChatId);
        const chatMessages = newMessages.map(msg => {
          const { status, ...chatMessage } = msg;
          return chatMessage as ChatMessage;
        });
        chatStorage.saveChatData(safeChatId, {
          info: chatData?.info || {
            id: safeChatId,
            title: '新对话',
            createTime: Date.now(),
            updateTime: Date.now(),
            messageCount: chatMessages.length
          },
          messages: chatMessages,
          settings: chatData?.settings || defaultChatSetting,
          updateTime: Date.now()
        });
      }
      return newMessages;
    });
  }, [safeChatId]);

  const addClientNotice = useCallback((
    content: string,
    noticeType: 'error' | 'warning' | 'info' = 'error',
    errorCode?: string
  ): string | undefined => {
    if (!safeChatId) return;
    const id = `notice-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const noticeMessage: RuntimeMessage = {
      id,
      role: 'client-notice' as const,
      content,
      timestamp: Date.now(),
      status: 'stable' as const,
      noticeType,
      errorCode
    };
    setLocalMessages(prev => [...prev, noticeMessage] as RuntimeMessage[]);
    return id;
  }, [safeChatId]);

  const updateLastMessage = useCallback((update: Partial<RuntimeMessage> & { reasoning_content?: string }) => {
    if (!safeChatId) return;
    setLocalMessages(prev => {
      const lastMessage = prev[prev.length - 1];
      if (lastMessage) {
        const lastReasoning = lastMessage.role === 'assistant' ? (lastMessage as any).reasoning_content : undefined;
        const updatedMessage = {
          ...lastMessage,
          ...update,
          reasoning_content: update.reasoning_content || lastReasoning
        };
        const newMessages = [...prev.slice(0, -1), updatedMessage] as RuntimeMessage[];
        if (update.status === 'stable') {
          const chatData = chatStorage.getChatData(safeChatId);
          const chatMessages = newMessages.map(msg => {
            const { status, ...chatMessage } = msg;
            return chatMessage as ChatMessage;
          });
          chatStorage.saveChatData(safeChatId, {
            info: chatData?.info || {
              id: safeChatId,
              title: '新对话',
              createTime: Date.now(),
              updateTime: Date.now(),
              messageCount: chatMessages.length
            },
            messages: chatMessages,
            settings: chatData?.settings || defaultChatSetting,
            updateTime: Date.now()
          });
        }
        return newMessages;
      }
      return prev;
    });
  }, [safeChatId]);

  const removeLastMessage = useCallback(() => {
    if (!safeChatId) return;
    setLocalMessages(prev => {
      const newMessages = prev.slice(0, -1);
      const chatMessages = newMessages.map(msg => {
        const { status, ...chatMessage } = msg;
        return chatMessage as ChatMessage;
      });
      const chatData = chatStorage.getChatData(safeChatId);
      chatStorage.saveChatData(safeChatId, {
        info: chatData?.info || {
          id: safeChatId,
          title: '新对话',
          createTime: Date.now(),
          updateTime: Date.now(),
          messageCount: chatMessages.length
        },
        messages: chatMessages,
        settings: chatData?.settings || defaultChatSetting,
        updateTime: Date.now()
      });
      return newMessages;
    });
  }, [safeChatId]);

  const clearMessages = useCallback(() => {
    if (!safeChatId) return;
    setLocalMessages([]);
    const chatData = chatStorage.getChatData(safeChatId);
    chatStorage.saveChatData(safeChatId, {
      info: chatData?.info || {
        id: safeChatId,
        title: '新对话',
        createTime: Date.now(),
        updateTime: Date.now(),
        messageCount: 0
      },
      messages: [],
      settings: chatData?.settings || defaultChatSetting,
      updateTime: Date.now()
    });
  }, [safeChatId]);

  useEffect(() => {
    if (!isGenerating && localMessages.length > 0) {
      const lastMessage = localMessages[localMessages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.status === 'stable') {
        onSend?.(lastMessage.content);
      }
    }
  }, [isGenerating, localMessages, onSend]);

  const handleAbort = useCallback(() => {
    const stream = getCurrentStream();
    if (stream) {
      stream.abort();
      setIsGenerating(false);
      setLocalMessages(prev => {
        const last = prev[prev.length - 1];
        if (last && last.status !== 'stable') {
          return prev.slice(0, -1);
        }
        return prev;
      });
    }
  }, []);

  return {
    messages: localMessages,
    isGenerating,
    setIsGenerating,
    addMessage,
    addClientNotice,
    updateLastMessage,
    removeLastMessage,
    clearMessages,
    handleAbort
  };
};
