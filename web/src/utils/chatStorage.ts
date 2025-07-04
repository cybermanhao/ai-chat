// web/src/utils/chatStorage.ts
// 聊天配置的持久化存储工具

export interface ChatStorageData {
  chatData: Record<string, any>;
  chatList: any[];
  currentChatId: string | null;
}

const STORAGE_KEY = 'zz-ai-chat-data';

/**
 * 保存聊天数据到 localStorage
 */
export function saveChatDataToStorage(data: ChatStorageData): void {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serialized);
    console.log('[ChatStorage] 数据已保存到本地存储');
  } catch (error) {
    console.error('[ChatStorage] 保存数据失败:', error);
  }
}

/**
 * 从 localStorage 加载聊天数据
 */
export function loadChatDataFromStorage(): ChatStorageData | null {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      return null;
    }
    
    const data = JSON.parse(serialized);
    console.log('[ChatStorage] 从本地存储加载数据成功');
    return data;
  } catch (error) {
    console.error('[ChatStorage] 加载数据失败:', error);
    return null;
  }
}

/**
 * 清空本地存储的聊天数据
 */
export function clearChatDataFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    console.log('[ChatStorage] 已清空本地存储数据');
  } catch (error) {
    console.error('[ChatStorage] 清空数据失败:', error);
  }
}

/**
 * 自动保存聊天数据的防抖函数
 */
let saveTimer: NodeJS.Timeout | null = null;

export function autoSaveChatData(data: ChatStorageData, delay: number = 1000): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  
  saveTimer = setTimeout(() => {
    saveChatDataToStorage(data);
    saveTimer = null;
  }, delay);
}
