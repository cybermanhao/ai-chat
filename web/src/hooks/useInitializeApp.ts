// web/src/hooks/useInitializeApp.ts
// 应用初始化 hook，负责在应用启动时加载存储数据
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { loadChatDataFromStorage } from '@/store/chatSlice';
import { loadChatDataFromStorage as loadData } from '@/utils/chatStorage';

export const useInitializeApp = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // 应用启动时加载存储的聊天数据
    const initializeStorage = async () => {
      try {
        const savedData = loadData();
        if (savedData) {
          console.log('[useInitializeApp] 加载保存的聊天数据:', savedData);
          dispatch(loadChatDataFromStorage(savedData));
        } else {
          console.log('[useInitializeApp] 没有找到保存的聊天数据');
        }
      } catch (error) {
        console.error('[useInitializeApp] 加载聊天数据失败:', error);
      }
    };

    initializeStorage();
  }, [dispatch]);
};
