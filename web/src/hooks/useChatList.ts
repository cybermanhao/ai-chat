import { useEffect } from 'react';
import { getStorage } from '@/utils/storage';
import { ChatStorageService } from '@engine/service/chatStorage';
import { useChatList as useEngineChatList } from '@engine/hooks/useChatList';

// web 层持久化服务实例
const storage = getStorage();
const chatStorage = new ChatStorageService(storage);

// 包裹 engine 层 hook，监听 chatList 变化并持久化
export function useChatList() {
  // 传递 localStorage 实例，确保 engine 层读写一致
  const result = useEngineChatList(storage);
  const { chatList, currentChatId } = result;

  useEffect(() => {
    if (chatList && chatList.length > 0) {
      chatStorage.saveChatList(chatList);
    }
  }, [chatList]);

  useEffect(() => {
    chatStorage.saveCurrentChatId(currentChatId);
  }, [currentChatId]);

  return result;
}

// 兼容原有导出
export * from '@engine/hooks/useChatList';
