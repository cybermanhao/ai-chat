import { RouterProvider } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import { useEffect } from 'react'
import './App.css'
import './styles/themes.css'
import { router } from './router'
// [插件系统已禁用] - 注释掉插件相关的导入
// import { buttonPlugin } from './plugins/button'
import MemeLoading from '@/components/memeLoading';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from './store';
import { resetRuntimeStates } from './store/chatSlice';
import { useInitializeApp } from '@/hooks/useInitializeApp';
// [插件系统已禁用] - 注释掉插件相关的导入
// import { addPlugin } from './store/pluginStore';

function App() {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  // [插件系统已禁用] - 注释掉插件相关的状态获取
  // const plugins = useSelector((state: RootState) => state.plugin.plugins);
  const dispatch: AppDispatch = useDispatch();
  const loadingCount = useSelector((state: RootState) => state.globalUI.loadingCount);

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

  // 当主题改变时，更新 body 的 data-theme 属性
  useEffect(() => {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  return (
    <>
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
      <MemeLoading loadingSignal={loadingCount > 0} />
    </>
  )
}

export default App
