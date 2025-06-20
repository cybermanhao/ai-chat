import { create } from 'zustand';
import type { RuntimeMessage, MessageStatus, RuntimeChatState } from '@engine/types/chat';
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

// 推荐：web 端直接绑定 engine 的 chatRuntimeStoreDefinition，支持多端同构和未来跨端共享
import { chatRuntimeStoreDefinition } from '@engine/store/chatRuntimeStore';

export const useChatRuntimeStore = create<ChatRuntimeState>()(chatRuntimeStoreDefinition as any);

export type { ChatRuntimeState };
