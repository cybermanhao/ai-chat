// web/src/hooks/useInitializeApp.ts
// 应用初始化 hook，负责在应用启动时加载存储数据
import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadChatDataFromStorage } from '@/store/chatSlice';
import { loadChatDataFromStorage as loadData } from '@/utils/chatStorage';
import { reconnectServers } from '@/store/mcpStore';
import type { AppDispatch, RootState } from '@/store';

export const useInitializeApp = () => {
  const dispatch = useDispatch<AppDispatch>();
  const servers = useSelector((state: RootState) => state.mcp.servers);
  const [hasAttemptedReconnect, setHasAttemptedReconnect] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // MCP 服务器自动重连逻辑
  const autoReconnectMCPServers = useCallback(async () => {
    if (hasAttemptedReconnect) return;
    
    try {
      console.log('[useInitializeApp] 开始 MCP 服务器自动重连...');
      
      const serversToReconnect = servers.filter(server => server.isConnected);
      
      if (serversToReconnect.length === 0) {
        console.log('[useInitializeApp] 没有需要重连的 MCP 服务器');
        setHasAttemptedReconnect(true);
        return;
      }
      
      console.log('[useInitializeApp] 发现需要重连的服务器:', serversToReconnect.map(s => s.name));
      
      // 调用 reconnectServers，消息提示已经在 store 中处理了
      await dispatch(reconnectServers()).unwrap();
      
      setHasAttemptedReconnect(true);
    } catch (error) {
      console.error('[useInitializeApp] MCP 服务器自动重连失败:', error);
      setHasAttemptedReconnect(true);
    }
  }, [dispatch, servers, hasAttemptedReconnect]);

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
      } finally {
        // 延迟设置初始化完成，确保 Redux persist 状态已经恢复
        setTimeout(() => {
          console.log('[useInitializeApp] 初始化完成，准备自动重连...');
          setIsInitialized(true);
        }, 1000);
      }
    };

    initializeStorage();
  }, [dispatch]);

  // 监听servers状态变化进行重连
  useEffect(() => {
    // 如果未初始化、已经尝试过重连，则不执行
    if (!isInitialized || hasAttemptedReconnect) {
      return;
    }

    // 检查是否有需要重连的服务器（状态为已连接的服务器）
    const serversToReconnect = servers.filter(server => server.isConnected);
    
    if (serversToReconnect.length === 0) {
      console.log('[useInitializeApp] 没有需要重连的 MCP 服务器');
      setHasAttemptedReconnect(true);
      return;
    }

    // 延迟执行，确保Redux persist状态已经恢复
    const timer = setTimeout(() => {
      autoReconnectMCPServers();
    }, 1000); // 延迟1秒执行

    return () => clearTimeout(timer);
  }, [servers, hasAttemptedReconnect, isInitialized, autoReconnectMCPServers]);
};
