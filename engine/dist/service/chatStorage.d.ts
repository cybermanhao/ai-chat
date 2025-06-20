import type { ChatInfo, ChatMessage, ChatData } from '../types/chat';
import type { StorageLike } from '../utils/storage';
export declare class ChatStorageService {
    private storage;
    constructor(storage: StorageLike);
    getChatList(): ChatInfo[];
    saveChatList(list: ChatInfo[]): void;
    getChatData(chatId: string): ChatData | null;
    saveChatData(chatId: string, data: ChatData): void;
    deleteChatData(chatId: string): void;
    getCurrentChatId(): string | null;
    saveCurrentChatId(chatId: string | null): void;
    loadMessages(chatId: string): Promise<ChatMessage[]>;
    saveMessages(chatId: string, messages: ChatMessage[]): Promise<void>;
    saveChatInfo(chatId: string, info: Partial<ChatInfo>): Promise<void>;
    deleteChat(chatId: string): Promise<void>;
}
//# sourceMappingURL=chatStorage.d.ts.map