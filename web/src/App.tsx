import { RouterProvider } from 'react-router-dom'
import { ConfigProvider, theme, message } from 'antd'
import { useEffect } from 'react'
import './App.css'
import './styles/themes.css'
import { router } from './router'
// [插件系统已禁用] - 注释掉插件相关的导入
// import { buttonPlugin } from './plugins/button'
import MemeLoading from '@/components/memeLoading';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from './store';
import { store } from './store';
import { resetRuntimeStates } from './store/chatSlice';
import { useInitializeApp } from '@/hooks/useInitializeApp';
import { reconnectServers } from './store/mcpStore';
// [插件系统已禁用] - 注释掉插件相关的导入
// import { addPlugin } from './store/pluginStore';

// 在开发环境中导入测试文件
if (process.env.NODE_ENV === 'development') {
  import('@/test/mcpNotificationTest');
  import('@/test/mcpReconnectTest');
}

function App() {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  // [插件系统已禁用] - 注释掉插件相关的状态获取
  // const plugins = useSelector((state: RootState) => state.plugin.plugins);
  const dispatch: AppDispatch = useDispatch();
  const loadingCount = useSelector((state: RootState) => state.globalUI.loadingCount);
  const memeLoadingBlur = useSelector((state: RootState) => state.globalUI.memeLoadingBlur);
  
  // 创建消息API实例
  const [messageApi, contextHolder] = message.useMessage();

  // 初始化应用，加载存储数据
  useInitializeApp();

  // [插件系统已禁用] - 注释掉插件注册逻辑
  // Register default plugins
  // useEffect(() => {
  //   if (!plugins.some((p: { id: string }) => p.id === buttonPlugin.id)) {
  //     dispatch(addPlugin(buttonPlugin));
  //   }
  // }, [dispatch, plugins])

  // 应用启动时重置所有运行时状态，确保 isGenerating 为 false
  useEffect(() => {
    dispatch(resetRuntimeStates());
  }, [dispatch]);

  // 应用启动时自动重连MCP服务器
  useEffect(() => {
    // 延迟执行，确保Redux persist状态已经恢复
    const timer = setTimeout(() => {
      console.log('[App] 开始检查是否需要自动重连MCP服务器');
      
      // 先获取当前状态，检查是否有需要重连的服务器
      const currentState = store.getState() as RootState;
      const serversToReconnect = currentState.mcp.servers.filter(server => server.isConnected);
      
      if (serversToReconnect.length > 0) {
        messageApi.loading(`正在自动重连 ${serversToReconnect.length} 个MCP服务器...`, 0);
        
        dispatch(reconnectServers())
          .unwrap()
          .then((result) => {
            messageApi.destroy(); // 清除loading消息
            
            if (result) {
              const { successCount, failureCount, totalCount } = result;
              if (totalCount > 0) {
                if (successCount === totalCount) {
                  messageApi.success(`所有MCP服务器重连成功 (${successCount}/${totalCount})`);
                } else if (successCount > 0) {
                  messageApi.warning(`部分MCP服务器重连成功 (${successCount}/${totalCount})`);
                } else {
                  messageApi.error(`所有MCP服务器重连失败 (${failureCount}/${totalCount})`);
                }
              }
              console.log(`[App] MCP服务器重连完成: ${successCount}/${totalCount} 个成功`);
            }
          })
          .catch((error) => {
            messageApi.destroy(); // 清除loading消息
            console.error('[App] MCP服务器自动重连失败:', error);
            messageApi.error('MCP服务器自动重连失败，请手动重连');
          });
      } else {
        console.log('[App] 没有需要重连的MCP服务器');
      }
    }, 1000); // 延迟1秒执行

    return () => clearTimeout(timer);
  }, [dispatch, messageApi]);

  // 当主题改变时，更新 body 的 data-theme 属性
  useEffect(() => {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  return (
    <>
      {contextHolder}
      <ConfigProvider
        theme={{
          algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
          token: {
            colorPrimary: isDarkMode ? '#52c41a' : '#1890ff',
            colorSuccess: '#52c41a',
            colorWarning: isDarkMode ? '#d89614' : '#faad14',
            colorError: isDarkMode ? '#a61d24' : '#f5222d',
            colorTextBase: isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)',
          },
        }}
      >
        <RouterProvider router={router} />
      </ConfigProvider>
      <MemeLoading loadingSignal={loadingCount > 0} blur={memeLoadingBlur} />
    </>
  )
}

export default App
