import { useState, useCallback, useEffect } from 'react'
import type { ChatMessage, RuntimeMessage } from '@/types/chat';
import { getCurrentStream } from '@/services/llmService';
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
  const [localMessages, setLocalMessages] = useState<RuntimeMessage[]>([]);
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
          const runtimeMessages: RuntimeMessage[] = [];
          for (const msg of chatData.messages) {
            // Ensure the message conforms to RuntimeMessage type by explicitly setting status
            const runtimeMsg = { 
              ...msg, 
              status: 'stable' as const 
            } as RuntimeMessage;
            runtimeMessages.push(runtimeMsg);
          }
          setLocalMessages(runtimeMessages);
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

    // Cleanup function - 只在组件卸载或chatId变化时执行
    return () => {
      mounted = false;
      // 清理和保存当前状态 - 使用最新可用的状态，但不依赖它进行重渲染
      if (chatId) {
        // 获取最新的 localMessages，但不将其作为依赖
        // 这样在组件卸载时会保存一次数据，但不会因为数据变化而触发重新渲染
        const currentMessages = localMessages.map(msg => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { status, ...chatMessage } = msg;
          return chatMessage as ChatMessage;
        });
        
        chatStorage.saveChatData(chatId, {
          info: {
            id: chatId,
            title: '新对话',
            createTime: Date.now(),
            updateTime: Date.now(),
            messageCount: currentMessages.length
          },
          messages: currentMessages,
          settings: {
            modelIndex: 0,
            systemPrompt: '',
            enableTools: [],
            temperature: 0.7,
            enableWebSearch: false,
            contextLength: 2000,
            parallelToolCalls: false
          },
          updateTime: Date.now()
        });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]); 
  // 添加新消息
  const addMessage = useCallback((message: RuntimeMessage) => {
    if (!chatId) return;
    
    setLocalMessages(prev => {
      const newMessages = [...prev, message];
      // 保存到存储
      const chatData = chatStorage.getChatData(chatId);
      
      // 将RuntimeMessage转换为ChatMessage (去除status属性)
      // 并过滤掉客户端提示消息，因为它们不应该存储和发送给模型
      const chatMessages = newMessages
        .filter(msg => msg.role !== 'client-notice')
        .map(msg => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { status, ...chatMessage } = msg;
          return chatMessage as ChatMessage;
        });
      
      chatStorage.saveChatData(chatId, {
        info: chatData?.info || {
          id: chatId,
          title: '新对话',
          createTime: Date.now(),
          updateTime: Date.now(),
          messageCount: chatMessages.length
        },
        messages: chatMessages,
        settings: chatData?.settings || {
          modelIndex: 0,
          systemPrompt: '',
          enableTools: [],
          temperature: 0.7,
          enableWebSearch: false,
          contextLength: 2000,
          parallelToolCalls: false
        },
        updateTime: Date.now()
      });
      return newMessages;
    });
  }, [chatId]);  /**
   * 添加客户端提示消息（不进入大模型上下文）
   * 用于显示错误、警告或提示信息的卡片
   * @param content - 提示消息内容
   * @param noticeType - 消息类型：error/warning/info
   * @param errorCode - 可选的错误代码
   * @returns 生成的消息ID
   */
  const addClientNotice = useCallback((
    content: string, 
    noticeType: 'error' | 'warning' | 'info' = 'error', 
    errorCode?: string
  ): string | undefined => {
    if (!chatId) return;
    
    // 生成唯一ID
    const id = `notice-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // 创建符合 ClientNoticeMessage 类型的消息
    const noticeMessage: RuntimeMessage = {
      id,
      role: 'client-notice' as const,
      content,
      timestamp: Date.now(),
      status: 'stable' as const,
      noticeType,
      errorCode
    };
    
    // 使用函数式更新确保类型安全
    setLocalMessages(prev => {
      return [...prev, noticeMessage] as RuntimeMessage[];
    });
    
    // 客户端提示消息不需要保存到持久化存储中
    return id;
  }, [chatId]);

// 更新最后一条消息
  const updateLastMessage = useCallback((update: Partial<RuntimeMessage>) => {
    if (!chatId) return;
    
    setLocalMessages(prev => {
      const lastMessage = prev[prev.length - 1];
      if (lastMessage && lastMessage.status !== 'stable') {
        // 确保保留reasoning_content字段
        const updatedMessage = {
          ...lastMessage,
          ...update,
          // 如果update中没有reasoning_content但lastMessage有，则保留原有的reasoning_content
          reasoning_content: update.reasoning_content || lastMessage.reasoning_content
        };
        const newMessages = [
          ...prev.slice(0, -1),
          updatedMessage
        ] as RuntimeMessage[];
        // 如果消息状态变为稳定，保存到存储
        if (update.status === 'stable') {
          const chatData = chatStorage.getChatData(chatId);
          
          // 将RuntimeMessage转换为ChatMessage (去除status属性)
          const chatMessages = newMessages.map(msg => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { status, ...chatMessage } = msg;
            return chatMessage as ChatMessage;
          });
          
          chatStorage.saveChatData(chatId, {
            info: chatData?.info || {
              id: chatId,
              title: '新对话',
              createTime: Date.now(),
              updateTime: Date.now(),
              messageCount: chatMessages.length
            },
            messages: chatMessages,
            settings: chatData?.settings || {
              modelIndex: 0,
              systemPrompt: '',
              enableTools: [],
              temperature: 0.7,
              enableWebSearch: false,
              contextLength: 2000,
              parallelToolCalls: false
            },
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
      
      // 将RuntimeMessage转换为ChatMessage (去除status属性)
      const chatMessages = newMessages.map(msg => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { status, ...chatMessage } = msg;
        return chatMessage as ChatMessage;
      });
      
      const chatData = chatStorage.getChatData(chatId);
      chatStorage.saveChatData(chatId, {
        info: chatData?.info || {
          id: chatId,
          title: '新对话',
          createTime: Date.now(),
          updateTime: Date.now(),
          messageCount: chatMessages.length
        },
        messages: chatMessages,
        settings: chatData?.settings || {
          modelIndex: 0,
          systemPrompt: '',
          enableTools: [],
          temperature: 0.7,
          enableWebSearch: false,
          contextLength: 2000,
          parallelToolCalls: false
        },
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
      settings: chatData?.settings || {
        modelIndex: 0,
        systemPrompt: '',
        enableTools: [],
        temperature: 0.7,
        enableWebSearch: false,
        contextLength: 2000,
        parallelToolCalls: false
      },
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
  }, [isGenerating, localMessages, onSend]);  // 处理中止生成
  const handleAbort = useCallback(() => {
    const stream = getCurrentStream();
    if (stream) {
      // 直接使用全局的函数而不是类方法
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
  }, []); // 不需要依赖 localMessages，因为我们使用了函数式更新
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