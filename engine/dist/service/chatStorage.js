export class ChatStorageService {
    storage;
    constructor(storage) {
        this.storage = storage;
    }
    getChatList() {
        const raw = this.storage.getItem('chat_list');
        return raw ? JSON.parse(raw) : [];
    }
    saveChatList(list) {
        this.storage.setItem('chat_list', JSON.stringify(list));
    }
    getChatData(chatId) {
        const raw = this.storage.getItem('chat_data_' + chatId);
        return raw ? JSON.parse(raw) : null;
    }
    saveChatData(chatId, data) {
        this.storage.setItem('chat_data_' + chatId, JSON.stringify(data));
    }
    deleteChatData(chatId) {
        this.storage.removeItem('chat_data_' + chatId);
    }
    getCurrentChatId() {
        return this.storage.getItem('current_chat_id');
    }
    saveCurrentChatId(chatId) {
        if (chatId) {
            this.storage.setItem('current_chat_id', chatId);
        }
        else {
            this.storage.removeItem('current_chat_id');
        }
    }
    async loadMessages(chatId) {
        const data = this.getChatData(chatId);
        return data?.messages || [];
    }
    async saveMessages(chatId, messages) {
        const existingData = this.getChatData(chatId);
        const data = existingData || {
            info: {
                id: chatId,
                title: '新对话',
                createTime: Date.now(),
                updateTime: Date.now(),
                messageCount: messages.length,
            },
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
        };
        data.messages = messages;
        data.updateTime = Date.now();
        data.info.messageCount = messages.length;
        data.info.updateTime = Date.now();
        this.saveChatData(chatId, data);
    }
    async saveChatInfo(chatId, info) {
        const list = this.getChatList();
        const updatedList = list.map(chat => chat.id === chatId ? { ...chat, ...info } : chat);
        this.saveChatList(updatedList);
    }
    async deleteChat(chatId) {
        const list = this.getChatList();
        this.saveChatList(list.filter(chat => chat.id !== chatId));
        this.deleteChatData(chatId);
    }
}
