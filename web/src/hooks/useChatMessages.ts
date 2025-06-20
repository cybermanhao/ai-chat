import { useState, useCallback, useEffect } from 'react'
import type { ChatMessage, StreamingMessage } from '@/types/chat';
import { getCurrentStream, llmService } from '@/services/llmService';
import { ChatStorageService } from '@/services/chatStorage';
import { defaultStorage } from '@/utils/storage';

// 创建全局共享的存储服务实例
const chatStorage = new ChatStorageService(defaultStorage);

/**
 * 聊天消息管理Hook
 * 处理聊天消息的展示、更新和存储
 * @param chatId - 当前聊天的ID
 */
export const useChatMessages = (
  chatId: string | null,
  onSend?: (value: string) => void
) => {
  // 本地消息状态，包含流式传输状态
  const [localMessages, setLocalMessages] = useState<StreamingMessage[]>([]);
  // 是否正在生成回复
  const [isGenerating, setIsGenerating] = useState(false);

  // 初始化加载聊天数据和清理函数
  useEffect(() => {
    let mounted = true;

    const loadChatMessages = async () => {
      if (chatId) {
        const chatData = chatStorage.getChatData(chatId);
        if (mounted && chatData?.messages) {
          // 加载聊天数据并设置所有消息为稳定状态
          setLocalMessages(chatData.messages.map((msg: ChatMessage) => ({ 
            ...msg, 
            status: 'stable' 
          })));
        } else if (mounted) {
          // 如果没有消息，清空本地消息列表
          setLocalMessages([]);
        }
      } else {
        // 如果没有选中的聊天，清空本地消息列表
        if (mounted) {
          setLocalMessages([]);
        }
      }
      // 切换聊天时重置生成状态
      if (mounted) {
        setIsGenerating(false);
      }
    };

    loadChatMessages();

    // Cleanup function
    return () => {
      mounted = false;
      // 清理和保存当前状态
      if (chatId) {
        const currentMessages = localMessages.map(msg => ({
          ...msg,
          status: 'stable' as const
        }));
        chatStorage.saveChatData(chatId, {
          info: {
            id: chatId,
            title: '新对话',
            createTime: Date.now(),
            updateTime: Date.now(),
            messageCount: currentMessages.length
          },
          messages: currentMessages,
          updateTime: Date.now()
        });
      }
    };
  }, [chatId, localMessages]); // Include localMessages since it's used in cleanup

  // 添加新消息
  const addMessage = useCallback((message: StreamingMessage) => {
    if (!chatId) return;
    
    setLocalMessages(prev => {
      const newMessages = [...prev, message];
      // 保存到存储
      const chatData = chatStorage.getChatData(chatId);
      chatStorage.saveChatData(chatId, {
        info: chatData?.info || {
          id: chatId,
          title: '新对话',
          createTime: Date.now(),
          updateTime: Date.now(),
          messageCount: newMessages.length
        },
        messages: newMessages,
        updateTime: Date.now()
      });
      return newMessages;
    });
  }, [chatId]);

  // 更新最后一条消息
  const updateLastMessage = useCallback((update: Partial<StreamingMessage>) => {
    if (!chatId) return;
    
    setLocalMessages(prev => {
      const lastMessage = prev[prev.length - 1];
      if (lastMessage && lastMessage.status !== 'stable') {
        const newMessages = [
          ...prev.slice(0, -1),
          { ...lastMessage, ...update }
        ];
        // 如果消息状态变为稳定，保存到存储
        if (update.status === 'stable') {
          const chatData = chatStorage.getChatData(chatId);
          chatStorage.saveChatData(chatId, {
            info: chatData?.info || {
              id: chatId,
              title: '新对话',
              createTime: Date.now(),
              updateTime: Date.now(),
              messageCount: newMessages.length
            },
            messages: newMessages,
            updateTime: Date.now()
          });
        }
        return newMessages;
      }
      return prev;
    });
  }, [chatId]);

  // 删除最后一条消息
  const removeLastMessage = useCallback(() => {
    if (!chatId) return;
    
    setLocalMessages(prev => {
      const newMessages = prev.slice(0, -1);
      const chatData = chatStorage.getChatData(chatId);
      chatStorage.saveChatData(chatId, {
        info: chatData?.info || {
          id: chatId,
          title: '新对话',
          createTime: Date.now(),
          updateTime: Date.now(),
          messageCount: newMessages.length
        },
        messages: newMessages,
        updateTime: Date.now()
      });
      return newMessages;
    });
  }, [chatId]);

  // 清空消息
  const clearMessages = useCallback(() => {
    if (!chatId) return;
    
    setLocalMessages([]);
    const chatData = chatStorage.getChatData(chatId);
    chatStorage.saveChatData(chatId, {
      info: chatData?.info || {
        id: chatId,
        title: '新对话',
        createTime: Date.now(),
        updateTime: Date.now(),
        messageCount: 0
      },
      messages: [],
      updateTime: Date.now()
    });
  }, [chatId]);

  // 生成完成时触发回调
  useEffect(() => {
    if (!isGenerating && localMessages.length > 0) {
      const lastMessage = localMessages[localMessages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.status === 'stable') {
        onSend?.(lastMessage.content);
      }
    }
  }, [isGenerating, localMessages, onSend]);

  // 处理中止生成
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
    messages: localMessages,
    isGenerating,
    setIsGenerating,
    addMessage,
    updateLastMessage,
    removeLastMessage,
    clearMessages,
    handleAbort
  };
};
