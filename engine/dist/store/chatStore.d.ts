import type { ChatMessage, ChatInfo, MessageStatus } from '../types/chat';
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
export declare const chatStoreDefinition: (set: any, get: any) => {
    messages: ChatMessage[];
    currentId: string | null;
    chats: ChatInfo[];
    setMessages: (messages: ChatMessage[]) => any;
    getCurrentChat: () => any;
    addMessage: (message: {
        role: "user" | "assistant" | "system";
        content: string;
        status?: MessageStatus;
        name?: string;
    }) => any;
    clearMessages: () => void;
    setCurrentId: (id: string | null) => any;
    createChat: () => Promise<string>;
    deleteChat: (id: string) => Promise<void>;
    renameChat: (id: string, title: string) => Promise<void>;
    exportChat: (id: string) => Promise<void>;
    switchChat: (chatId: string) => Promise<void>;
    loadChat: (chatId: string) => Promise<void>;
    saveChat: () => Promise<void>;
};
//# sourceMappingURL=chatStore.d.ts.map