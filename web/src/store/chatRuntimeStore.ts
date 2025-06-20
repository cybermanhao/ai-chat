import { create } from 'zustand';
import type { RuntimeMessage, MessageStatus, RuntimeChatState } from '@/types/chat';
// 由于聊天时具有多种特殊情况，例如网络错误，大模型错误，因此设计额外的状态管理
interface ChatRuntimeState {
  // 连接状态
  isGenerating: boolean;
  abortController: AbortController | null;
    // 消息状态
  runtimeMessages: Record<string, RuntimeMessage>;
  setMessageStatus: (messageId: string, status: MessageStatus) => void;
  updateMessageContent: (params: {
    messageId: string;
    content: string;
    reasoning_content?: string;
    tool_content?: string;
    observation_content?: string;
    thought_content?: string;
  }) => void;
  
  // 运行时聊天状态
  runtimeStates: Record<string, RuntimeChatState>;
  setRuntimeState: (chatId: string, state: Partial<RuntimeChatState>) => void;
  
  // 清理方法
  clearRuntimeState: (chatId: string) => void;
  clearAllRuntimeStates: () => void;
}

export const useChatRuntimeStore = create<ChatRuntimeState>((set) => ({
  // 初始状态
  isGenerating: false,
  abortController: null,
  runtimeMessages: {},
  runtimeStates: {},
  
  // 消息状态管理
  setMessageStatus: (messageId: string, status: MessageStatus) => {
    console.log('Setting message status:', { messageId, status });
    set((state) => ({
      runtimeMessages: {
        ...state.runtimeMessages,
        [messageId]: {
          ...(state.runtimeMessages[messageId] || {}),
          status
        }
      }
    }));
  },
  
  // 更新消息的内容和推理过程
  updateMessageContent: (params) => {
    const { messageId, content, reasoning_content, tool_content, observation_content, thought_content } = params;
    console.log('Updating message content:', {
      messageId,
      content: content.slice(0, 50) + '...',
      reasoning_content: reasoning_content ? reasoning_content.slice(0, 50) + '...' : undefined,
      tool_content: tool_content ? tool_content.slice(0, 50) + '...' : undefined,
      observation_content: observation_content ? observation_content.slice(0, 50) + '...' : undefined,
      thought_content: thought_content ? thought_content.slice(0, 50) + '...' : undefined
    });
    set((state) => {
      const message = state.runtimeMessages[messageId];
      if (!message) {
        console.warn('Message not found in runtime store:', messageId);
        return state;
      }
      return {
        runtimeMessages: {
          ...state.runtimeMessages,
          [messageId]: {
            ...message,
            content,
            ...(reasoning_content !== undefined ? { reasoning_content } : {}),
            ...(tool_content !== undefined ? { tool_content } : {}),
            ...(observation_content !== undefined ? { observation_content } : {}),
            ...(thought_content !== undefined ? { thought_content } : {})
          }
        }
      };
    });
  },
  
  // 运行时状态管理
  setRuntimeState: (chatId: string, newState: Partial<RuntimeChatState>) => {
    set((state) => ({
      runtimeStates: {
        ...state.runtimeStates,
        [chatId]: {
          ...(state.runtimeStates[chatId] || {
            isGenerating: false,
            currentMessageId: null,
            abortController: null
          }),
          ...newState
        }
      }
    }));
  },
  
  // 清理方法
  clearRuntimeState: (chatId: string) => {
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [chatId]: removed, ...rest } = state.runtimeStates;
      return {
        runtimeStates: rest
      };
    });
  },
  
  clearAllRuntimeStates: () => {
    set({
      isGenerating: false,
      abortController: null,
      runtimeMessages: {},
      runtimeStates: {}
    });
  }
}));
