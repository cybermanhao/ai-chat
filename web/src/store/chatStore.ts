import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware'
import type { UIMessageRole } from '@/types/openai'

export interface ChatMessage {
  id: string
  content: string
  role: UIMessageRole
  timestamp: number
}

export interface Chat {
  id: string;
  title: string;
  messages: {
    id: string;
    content: string;
    role: UIMessageRole;
  }[];
  createdAt: number;
  updatedAt: number;
}

interface ChatState {
  messages: ChatMessage[]
  currentId: string | null
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  clearMessages: () => void
  setCurrentId: (id: string | null) => void
  chats: Chat[];
  currentChat: Chat | null;
  deleteChat: (id: string) => Promise<void>;
  renameChat: (id: string, title: string) => Promise<void>;
  exportChat: (id: string) => Promise<void>;
  createChat: () => Promise<string>;
}

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (set, get) => ({
        messages: [],
        currentId: null,
        chats: [],
        currentChat: null,

        addMessage: (message) => set((state) => ({
          messages: [
            ...state.messages,
            {
              ...message,
              id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
              timestamp: Date.now(),
            },
          ],
        })),

        clearMessages: () => set({ messages: [] }),

        setCurrentId: (id) => set({ currentId: id }),

        createChat: async () => {
          const newChat: Chat = {
            id: Date.now().toString(),
            title: '新对话',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          set(state => ({
            chats: [newChat, ...state.chats],
            currentChat: newChat,
          }));

          return newChat.id;
        },

        deleteChat: async (id: string) => {
          set(state => ({
            chats: state.chats.filter(chat => chat.id !== id),
            currentChat: state.currentChat?.id === id ? null : state.currentChat,
          }));
        },

        renameChat: async (id: string, title: string) => {
          set(state => ({
            chats: state.chats.map(chat =>
              chat.id === id ? { ...chat, title, updatedAt: Date.now() } : chat
            ),
            currentChat:
              state.currentChat?.id === id
                ? { ...state.currentChat, title, updatedAt: Date.now() }
                : state.currentChat,
          }));
        },

        exportChat: async (id: string) => {
          const chat = get().chats.find(c => c.id === id);
          if (!chat) return;

          const content = chat.messages
            .map(msg => `${msg.role}: ${msg.content}`)
            .join('\n\n');

          const blob = new Blob([content], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${chat.title}.txt`;
          a.click();
          URL.revokeObjectURL(url);
        },
      }),
      {
        name: 'chat-storage',
      }
    ),
    {
      name: 'chat-store',
    }
  )
)
