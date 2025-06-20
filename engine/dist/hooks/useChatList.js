// engine/hooks/useChatList.ts
// 纯逻辑聊天列表管理 Hook，可多端同构
import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatStorageService } from '../service/chatStorage';
import { defaultStorage } from '../utils/storage';
const chatStorage = new ChatStorageService(defaultStorage);
export const useChatList = () => {
    const [chatList, setChatList] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const list = chatStorage.getChatList();
        const currentId = chatStorage.getCurrentChatId();
        setChatList(list);
        setCurrentChatId(currentId || (list.length > 0 ? list[0].id : null));
        setLoading(false);
    }, []);
    const addChat = useCallback((title) => {
        const id = uuidv4();
        const newChat = {
            id,
            title,
            createTime: Date.now(),
            updateTime: Date.now(),
            messageCount: 0
        };
        const newList = [newChat, ...chatList];
        setChatList(newList);
        chatStorage.saveChatList(newList);
        setCurrentChatId(id);
        chatStorage.saveCurrentChatId(id);
        return id;
    }, [chatList]);
    const removeChat = useCallback((id) => {
        const newList = chatList.filter(chat => chat.id !== id);
        setChatList(newList);
        chatStorage.saveChatList(newList);
        if (currentChatId === id) {
            const nextId = newList.length > 0 ? newList[0].id : null;
            setCurrentChatId(nextId);
            chatStorage.saveCurrentChatId(nextId);
        }
        chatStorage.deleteChatData(id);
    }, [chatList, currentChatId]);
    const setActiveChat = useCallback((id) => {
        setCurrentChatId(id);
        chatStorage.saveCurrentChatId(id);
    }, []);
    return {
        chatList,
        currentChatId,
        loading,
        addChat,
        removeChat,
        setActiveChat,
    };
};
