// engine/store/chatStore.ts
// 多端同构 Chat store 纯逻辑定义
import { v4 as uuidv4 } from 'uuid';
import { createUserMessage, createAssistantMessage, createSystemMessage } from '../utils/messageFactory';
import { ChatStorageService } from '../service/chatStorage.js';
import { defaultStorage } from '../utils/storage';
const chatStorage = new ChatStorageService(defaultStorage);
export const chatStoreDefinition = (set, get) => ({
    messages: [],
    currentId: null,
    chats: [],
    setMessages: (messages) => set({ messages }),
    getCurrentChat: () => {
        const { currentId, chats } = get();
        return currentId ? chats.find((chat) => chat.id === currentId) ?? null : null;
    },
    addMessage: (message) => set((state) => {
        let newMessage;
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
            const newChat = {
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
        chatStorage.saveMessages(state.currentId, newMessages);
        return {
            messages: newMessages,
            chats: state.chats.map((chat) => chat.id === updatedChat.id ? updatedChat : chat),
        };
    }),
    clearMessages: () => {
        const { currentId } = get();
        if (currentId) {
            chatStorage.saveMessages(currentId, []);
        }
        set({ messages: [] });
    },
    setCurrentId: (id) => set({ currentId: id }),
    createChat: async () => {
        const id = uuidv4();
        const newChat = {
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
        set((state) => ({
            chats: [newChat, ...state.chats],
            currentId: id,
            messages: []
        }));
        return id;
    },
    deleteChat: async (id) => {
        await chatStorage.deleteChat(id);
        set((state) => ({
            chats: state.chats.filter((chat) => chat.id !== id),
            currentId: state.currentId === id ? null : state.currentId,
            messages: state.currentId === id ? [] : state.messages,
        }));
    },
    renameChat: async (id, title) => {
        set((state) => ({
            chats: state.chats.map((chat) => chat.id === id ? { ...chat, title } : chat),
        }));
        await chatStorage.saveChatInfo(id, { title });
    },
    exportChat: async (id) => {
        const chat = get().chats.find((c) => c.id === id);
        if (!chat)
            return;
        const messages = await chatStorage.loadMessages(id);
        const data = { chat, messages };
        // 导出逻辑建议由 UI 层实现
    },
    switchChat: async (chatId) => {
        const messages = await chatStorage.loadMessages(chatId);
        set({ currentId: chatId, messages });
    },
    loadChat: async (chatId) => {
        const messages = await chatStorage.loadMessages(chatId);
        set({ messages });
    },
    saveChat: async () => {
        const { currentId, messages } = get();
        if (currentId) {
            await chatStorage.saveMessages(currentId, messages);
        }
    },
});
