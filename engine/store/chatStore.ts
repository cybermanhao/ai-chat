// engine/store/chatStore.ts
// 多端同构 Chat store 纯逻辑定义
import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage, ChatInfo, MessageStatus } from '../types/chat';
import { createUserMessage, createAssistantMessage, createSystemMessage } from '../utils/messageFactory';
import { ChatStorageService } from '../service/chatStorage.js';
import { defaultStorage } from '../utils/storage';

export interface ChatState {
  messages: ChatMessage[];
  currentId: string | null;
  chats: ChatInfo[];
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: {
    role: 'user' | 'assistant' | 'system';
    content: string;
    status?: MessageStatus;
    name?: string;
  }) => void;
  clearMessages: () => void;
  setCurrentId: (id: string | null) => void;
  createChat: () => Promise<string>;
  deleteChat: (id: string) => Promise<void>;
  renameChat: (id: string, title: string) => Promise<void>;
  exportChat: (id: string) => Promise<void>;
  getCurrentChat: () => ChatInfo | null;
  switchChat: (chatId: string) => void;
  loadChat: (chatId: string) => Promise<void>;
  saveChat: () => Promise<void>;
}

const chatStorage = new ChatStorageService(defaultStorage);

export const chatStoreDefinition = (set: any, get: any) => ({
  messages: [] as ChatMessage[],
  currentId: null as string | null,
  chats: [] as ChatInfo[],

  setMessages: (messages: ChatMessage[]) => set({ messages }),

  getCurrentChat: () => {
    const { currentId, chats } = get();
    return currentId ? chats.find((chat: ChatInfo) => chat.id === currentId) ?? null : null;
  },

  addMessage: (message: { role: 'user' | 'assistant' | 'system'; content: string; status?: MessageStatus; name?: string }) => set((state: ChatState) => {
    let newMessage: ChatMessage;
    switch (message.role) {
      case 'user':
        newMessage = createUserMessage(message.content, message.status, { name: message.name });
        break;
      case 'assistant':
        newMessage = createAssistantMessage(message.content, message.status, { name: message.name });
        break;
      case 'system':
        newMessage = createSystemMessage(message.content, { name: message.name });
        break;
      default:
        throw new Error(`Unsupported message role: ${message.role}`);
    }
    const currentChat = state.chats.find(chat => chat.id === state.currentId);
    const newMessages = [...state.messages, newMessage];
    if (!currentChat) {
      const title = message.role === 'user'
        ? message.content.slice(0, 20) + (message.content.length > 20 ? '...' : '')
        : '新对话';
      const newChat: ChatInfo = {
        id: uuidv4(),
        title,
        createTime: Date.now(),
        updateTime: Date.now(),
        messageCount: 1,
      };
      chatStorage.saveMessages(newChat.id, [newMessage]);
      return {
        messages: [newMessage],
        chats: [newChat, ...state.chats],
        currentId: newChat.id,
      };
    }
    const updatedChat = {
      ...currentChat,
      updateTime: Date.now(),
      messageCount: currentChat.messageCount + 1,
    };
    chatStorage.saveMessages(state.currentId!, newMessages);
    return {
      messages: newMessages,
      chats: state.chats.map((chat: ChatInfo) => chat.id === updatedChat.id ? updatedChat : chat),
    };
  }),

  clearMessages: () => {
    const { currentId } = get();
    if (currentId) {
      chatStorage.saveMessages(currentId, []);
    }
    set({ messages: [] });
  },

  setCurrentId: (id: string | null) => set({ currentId: id }),

  createChat: async () => {
    const id = uuidv4();
    const newChat: ChatInfo = {
      id,
      title: '新对话',
      createTime: Date.now(),
      updateTime: Date.now(),
      messageCount: 0
    };
    await chatStorage.saveChatData(id, {
      info: newChat,
      messages: [],
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
    set((state: ChatState) => ({
      chats: [newChat, ...state.chats],
      currentId: id,
      messages: []
    }));
    return id;
  },

  deleteChat: async (id: string) => {
    await chatStorage.deleteChat(id);
    set((state: ChatState) => ({
      chats: state.chats.filter((chat) => chat.id !== id),
      currentId: state.currentId === id ? null : state.currentId,
      messages: state.currentId === id ? [] : state.messages,
    }));
  },

  renameChat: async (id: string, title: string) => {
    set((state: ChatState) => ({
      chats: state.chats.map((chat) => chat.id === id ? { ...chat, title } : chat),
    }));
    await chatStorage.saveChatInfo(id, { title });
  },

  exportChat: async (id: string) => {
    const chat = get().chats.find((c: ChatInfo) => c.id === id);
    if (!chat) return;
    // const messages = await chatStorage.loadMessages(id); // 移除未使用变量，消除 warning
    // 导出逻辑建议由 UI 层实现
  },

  switchChat: async (chatId: string) => {
    const messages = await chatStorage.loadMessages(chatId);
    set({ currentId: chatId, messages });
  },

  loadChat: async (chatId: string) => {
    const messages = await chatStorage.loadMessages(chatId);
    set({ messages });
  },

  saveChat: async () => {
    const { currentId, messages } = get();
    if (currentId) {
      await chatStorage.saveMessages(currentId, messages);
    }
  },

  /**
   * 主动从本地存储加载指定 chatId 的聊天数据到 store
   */
  initFromStorage: (chatId: string | null) => {
    if (!chatId) return;
    const chatData = chatStorage.getChatData(chatId);
    if (chatData) {
      set({
        currentId: chatId,
        messages: chatData.messages || [],
        chats: [
          // 保证当前聊天在 chats 列表中
          chatData.info,
          ...get().chats.filter((c: ChatInfo) => c.id !== chatId)
        ]
      });
    }
  },
});
