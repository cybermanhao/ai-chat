import { useState, useCallback } from 'react';
import { useStore } from 'zustand';
import { useChatStore } from '@/store/chatStore';
import { getStorage } from '@/utils/storage';
import { ChatStorageService } from '@engine/service/chatStorage';
import { ChatMessageConverter } from '@engine/utils/messageConverters';
import type { ChatMessage, RuntimeMessage } from '@/types/chat';
import { defaultChatSetting } from '@/config/defaultChatSetting';

// engine 层通用消息管理器
class MessageManager {
  protected messages: RuntimeMessage[];
  constructor(initialMessages: RuntimeMessage[]) {
    this.messages = initialMessages;
  }
  getMessages() {
    return this.messages;
  }
  addMessage(msg: RuntimeMessage) {
    this.messages.push(msg);
  }
  updateLastMessage(patch: Partial<RuntimeMessage>) {
    if (this.messages.length === 0) return;
    const last = this.messages[this.messages.length - 1];
    Object.assign(last, patch);
  }
  clearMessages() {
    this.messages = [];
  }
}

// web 层持久化服务实例
const chatStorage = new ChatStorageService(getStorage());

// web 层消息管理器，扩展持久化和 UI 响应
class WebMessageManager extends MessageManager {
  private chatId: string;
  constructor(initialMessages: RuntimeMessage[], chatId: string) {
    super(initialMessages);
    this.chatId = chatId;
  }
  override addMessage(msg: RuntimeMessage) {
    super.addMessage(msg);
    this.saveIfStable(msg);
  }
  override updateLastMessage(patch: Partial<RuntimeMessage>) {
    super.updateLastMessage(patch);
    const last = this.messages[this.messages.length - 1];
    this.saveIfStable(last);
  }
  private saveIfStable(msg: RuntimeMessage) {
    if (msg.status === 'stable' && this.chatId) {
      const chatData = chatStorage.getChatData(this.chatId);
      // 只持久化 user/assistant/system/tool 类型，去除 status 字段，类型安全
      const chatMessages = ChatMessageConverter.toPersisted(this.messages);
      chatStorage.saveChatData(this.chatId, {
        info: chatData?.info || {
          id: this.chatId,
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
  }
}

export function useChatMessages(chatId: string) {
  // 响应式获取当前聊天的消息
  const rawMessages = useStore(useChatStore, s => s.messages);
  // 保证 messages 始终为 RuntimeMessage[]
  const messages: RuntimeMessage[] = rawMessages.map(msg => ({
    ...msg,
    status: msg.status ?? 'stable',
  }));
  // Use real state for isGenerating
  const [isGenerating, setIsGenerating] = useState(false);
  // 用扩展的消息管理器
  const manager = new WebMessageManager(messages, chatId);

  const addMessage = useCallback((msg: ChatMessage) => {
    if (msg.role === 'user' || msg.role === 'assistant' || msg.role === 'system') {
      useChatStore.getState().addMessage({
        role: msg.role,
        content: msg.content,
        status: msg.status,
        name: (msg as { name?: string }).name
      });
    } else {
      const msgs = useChatStore.getState().messages;
      useChatStore.getState().setMessages([...msgs, msg]);
    }
    manager.addMessage(msg as RuntimeMessage);
  }, [manager]);

  const updateLastMessage = useCallback((update: Partial<ChatMessage>) => {
    const msgs = useChatStore.getState().messages;
    if (msgs.length > 0) {
      const last = msgs[msgs.length - 1];
      const patched = { ...last, ...update };
      const newMessages = [...msgs.slice(0, -1), patched] as ChatMessage[];
      useChatStore.getState().setMessages(newMessages);
      manager.updateLastMessage(update as Partial<RuntimeMessage>);
    }
  }, [manager]);

  return {
    messages,
    isGenerating,
    setIsGenerating,
    addMessage,
    updateLastMessage
  };
}

// 兼容原有导出
export * from '@engine/hooks/useChatMessages';