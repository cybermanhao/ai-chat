import type { ChatInfo } from '../types/chat';
export declare const useChatList: () => {
    chatList: ChatInfo[];
    currentChatId: string | null;
    loading: boolean;
    addChat: (title: string) => string;
    removeChat: (id: string) => void;
    setActiveChat: (id: string) => void;
};
//# sourceMappingURL=useChatList.d.ts.map