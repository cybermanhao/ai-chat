import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage, ChatInfo, MessageStatus } from '@/types/chat';
import { chatStorage } from '@/services/chatStorage';
import { createMessage } from '@/utils/messageFactory';

export interface ChatState {
  messages: ChatMessage[];
  currentId: string | null;
  chats: ChatInfo[];
  
  // Actions
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

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set, get) => ({
        messages: [] as ChatMessage[],
        currentId: null as string | null,
        chats: [] as ChatInfo[],
        
        setMessages: (messages: ChatMessage[]) => set({ messages }),
        
        getCurrentChat: () => {
          const { currentId, chats } = get();
          return currentId ? chats.find((chat: ChatInfo) => chat.id === currentId) ?? null : null;
        },        addMessage: (message) => set((state) => {
          let newMessage: ChatMessage;
          
          // 根据消息类型创建具体的消息对象
          switch (message.role) {
            case 'user':
              newMessage = createMessage.user(message.content, message.status);
              break;
            case 'assistant':
              newMessage = createMessage.assistant(message.content, message.status);
              break;
            case 'system':
              newMessage = createMessage.system(message.content);
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
            
            // 保存到存储
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
            chats: state.chats.map((chat: ChatInfo) => 
              chat.id === updatedChat.id ? updatedChat : chat
            ),
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
          
          // 保存到存储
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
          
          set((state) => ({
            chats: [newChat, ...state.chats],
            currentId: id,
            messages: []
          }));
          
          return id;
        },
        
        deleteChat: async (id: string) => {
          await chatStorage.deleteChat(id);
          set((state) => ({
            chats: state.chats.filter((chat) => chat.id !== id),
            currentId: state.currentId === id ? null : state.currentId,
            messages: state.currentId === id ? [] : state.messages,
          }));
        },
        
        renameChat: async (id: string, title: string) => {
          set((state) => ({
            chats: state.chats.map((chat) =>
              chat.id === id ? { ...chat, title } : chat
            ),
          }));
          await chatStorage.saveChatInfo(id, { title });
        },
        
        exportChat: async (id: string) => {
          const chat = get().chats.find((c) => c.id === id);
          if (!chat) return;
          
          const messages = await chatStorage.loadMessages(id);
          const data = {
            chat,
            messages,
          };
          
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `chat-${chat.title}-${new Date().toISOString()}.json`;
          a.click();
          URL.revokeObjectURL(url);
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
      }),
      {
        name: 'chat-store',
      }
    )
  )
);
