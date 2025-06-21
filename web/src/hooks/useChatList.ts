import { useEffect } from 'react';
import { useChatList as useEngineChatList } from '@engine/hooks/useChatList';
import { getStorage } from '@/utils/storage';
import { ChatStorageService } from '@engine/service/chatStorage';
import type { ChatInfo } from '@/types/chat';

// web 层持久化服务实例
const chatStorage = new ChatStorageService(getStorage());

// 包裹 engine 层 hook，监听 chatList 变化并持久化
export function useChatList() {
  const result = useEngineChatList();
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
