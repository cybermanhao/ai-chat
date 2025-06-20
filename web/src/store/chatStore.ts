import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage, ChatInfo } from '@/types/chat';

interface ChatState {
  messages: ChatMessage[];
  currentId: string | null;
  activeChatRef: React.RefObject<HTMLDivElement> | null;
  chats: ChatInfo[];
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  setCurrentId: (id: string | null) => void;
  setActiveChatRef: (ref: React.RefObject<HTMLDivElement>) => void;
  createChat: () => Promise<string>;
  deleteChat: (id: string) => Promise<void>;
  renameChat: (id: string, title: string) => Promise<void>;
  exportChat: (id: string) => Promise<void>;
  getCurrentChat: () => ChatInfo | null;
}

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set, get) => ({
        messages: [] as ChatMessage[],
        currentId: null as string | null,
        activeChatRef: null as React.RefObject<HTMLDivElement> | null,
        chats: [] as ChatInfo[],
        
        setMessages: (messages: ChatMessage[]) => set({ messages }),
        
        getCurrentChat: () => {
          const { currentId, chats } = get();
          return currentId ? chats.find((chat: ChatInfo) => chat.id === currentId) ?? null : null;
        },

        addMessage: (message) => set((state) => {
          const newMessage = {
            ...message,
            id: uuidv4(),
            timestamp: Date.now(),
          };
          
          const currentChat = state.chats.find((chat: ChatInfo) => chat.id === state.currentId);
          const newMessages = [...state.messages, newMessage];
          
          if (!currentChat) {
            // 如果没有当前聊天，创建一个新的，使用消息内容作为标题
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

            // 保存聊天数据到本地存储
            localStorage.setItem(`chat-data-${newChat.id}`, JSON.stringify({
              messages: [newMessage],
              updateTime: Date.now()
            }));
            
            return {
              messages: [newMessage],
              chats: [newChat, ...state.chats],
              currentId: newChat.id,
            };
          }
          
          // 更新现有聊天
          const updatedChat = {
            ...currentChat,
            updateTime: Date.now(),
            messageCount: currentChat.messageCount + 1,
          };

          // 保存更新后的消息到本地存储
          localStorage.setItem(`chat-data-${state.currentId}`, JSON.stringify({
            messages: newMessages,
            updateTime: Date.now()
          }));
          
          return {
            messages: newMessages,
            chats: state.chats.map((chat: ChatInfo) => 
              chat.id === updatedChat.id ? updatedChat : chat
            ),
          };
        }),
        
        clearMessages: () => set({ messages: [] }),
        
        setCurrentId: (id) => {
          // 如果没有ID，清空当前聊天和消息
          if (!id) {
            set({
              currentId: null,
              messages: []
            });
            return;
          }

          // 从本地存储加载聊天数据
          const chatData = localStorage.getItem(`chat-data-${id}`);
          let messages: ChatMessage[] = [];
          
          if (chatData) {
            try {
              const data = JSON.parse(chatData);
              if (data.messages && Array.isArray(data.messages)) {
                messages = data.messages;
              }
            } catch (e) {
              console.error('Failed to parse chat data:', e);
            }
          }

          set({
            currentId: id,
            messages
          });
        },
        
        setActiveChatRef: (ref) => set({ activeChatRef: ref }),
        
        createChat: async () => {
          const newChat: ChatInfo = {
            id: uuidv4(),
            title: '新对话',
            createTime: Date.now(),
            updateTime: Date.now(),
            messageCount: 0,
          };
          
          set((state) => ({
            chats: [newChat, ...state.chats],
            currentId: newChat.id,
          }));
          
          return newChat.id;
        },
        
        deleteChat: async (id) => {
          // 从本地存储中删除聊天数据
          localStorage.removeItem(`chat-data-${id}`);
          
          set((state) => {
            const nextChat = state.chats.find((chat: ChatInfo) => chat.id !== id);
            
            return {
              chats: state.chats.filter((chat: ChatInfo) => chat.id !== id),
              currentId: state.currentId === id ? (nextChat?.id ?? null) : state.currentId,
              messages: state.currentId === id ? [] : state.messages,
            };
          });
        },
        
        renameChat: async (id, title) => {
          set((state) => {
            const updatedChats = state.chats.map((chat: ChatInfo) =>
              chat.id === id 
                ? { ...chat, title, updateTime: Date.now() }
                : chat
            );
            return {
              chats: updatedChats,
              messages: state.currentId === id 
                ? state.messages.map((msg: ChatMessage) => ({ ...msg }))  // 触发消息列表更新
                : state.messages
            };
          });
        },
        
        exportChat: async (id) => {
          const chat = get().chats.find((chat: ChatInfo) => chat.id === id);
          if (!chat) return;
          
          const content = get().messages
            .map((msg: ChatMessage) => `${msg.role}: ${msg.content}`)
            .join('\n');
            
          const blob = new Blob([content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `chat-${chat.title}-${new Date().toISOString().split('T')[0]}.txt`;
          a.click();
          URL.revokeObjectURL(url);
        },
      }),
      {
        name: 'chat-store',
        version: 1,
      }
    )
  )
);
