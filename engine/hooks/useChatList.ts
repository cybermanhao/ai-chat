// engine/hooks/useChatList.ts
// 纯逻辑聊天列表管理 Hook，可多端同构
import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ChatInfo } from '../types/chat';
import { ChatStorageService } from '../service/chatStorage';
import { defaultStorage, type StorageLike } from '../utils/storage';

export const useChatList = (storageArg?: StorageLike) => {
  const storage = storageArg || defaultStorage;
  const chatStorage = new ChatStorageService(storage);

  const [chatList, setChatList] = useState<ChatInfo[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const list = chatStorage.getChatList();
    const currentId = chatStorage.getCurrentChatId();
    setChatList(list);
    setCurrentChatId(currentId || (list.length > 0 ? list[0].id : null));
    setLoading(false);
  }, [storageArg]);

  const addChat = useCallback((title: string) => {
    const id = uuidv4();
    const newChat: ChatInfo = {
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
  }, [chatList, storageArg]);

  const removeChat = useCallback((id: string) => {
    const newList = chatList.filter(chat => chat.id !== id);
    setChatList(newList);
    chatStorage.saveChatList(newList);
    if (currentChatId === id) {
      const nextId = newList.length > 0 ? newList[0].id : null;
      setCurrentChatId(nextId);
      chatStorage.saveCurrentChatId(nextId);
    }
    chatStorage.deleteChatData(id);
  }, [chatList, currentChatId, storageArg]);

  const setActiveChat = useCallback((id: string) => {
    setCurrentChatId(id);
    chatStorage.saveCurrentChatId(id);
  }, [storageArg]);

  return {
    chatList,
    currentChatId,
    loading,
    addChat,
    removeChat,
    setActiveChat,
  };
};
