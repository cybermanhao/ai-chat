// 存储中间件 - 处理自动加载和保存
import type { Middleware, AnyAction } from '@reduxjs/toolkit';
import { loadChatDataFromStorage } from './chatSlice';
import { loadChatDataFromStorage as loadData } from '@/utils/chatStorage';

// 创建存储中间件
export const storageMiddleware: Middleware = storeAPI => next => action => {
  const result = next(action);
  
  // 应用启动时自动加载数据
  if ((action as AnyAction).type === '@@INIT' || (action as AnyAction).type === 'store/init') {
    setTimeout(() => {
      try {
        const savedData = loadData();
        if (savedData) {
          console.log('[StorageMiddleware] 加载保存的聊天数据:', savedData);
          storeAPI.dispatch(loadChatDataFromStorage(savedData));
        }
      } catch (error) {
        console.error('[StorageMiddleware] 加载聊天数据失败:', error);
      }
    }, 100); // 延迟加载，确保store完全初始化
  }
  
  return result;
};

// 手动初始化存储数据的 action
export const initializeStorage = () => async (dispatch: any) => {
  try {
    const savedData = loadData();
    if (savedData) {
      console.log('[InitializeStorage] 手动加载保存的聊天数据:', savedData);
      dispatch(loadChatDataFromStorage(savedData));
    }
  } catch (error) {
    console.error('[InitializeStorage] 加载聊天数据失败:', error);
  }
};
