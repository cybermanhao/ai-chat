import { RouterProvider } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import { useThemeStore } from './store/themeStore'
import { useEffect } from 'react'
import './App.css'
import './styles/themes.css'
import { router } from './router'
import { usePluginStore } from './store/pluginStore'
import { buttonPlugin } from './plugins/button'

function App() {
  const { isDarkMode } = useThemeStore()
  const { addPlugin, plugins } = usePluginStore()

  // Register default plugins
  useEffect(() => {
    // Check if button plugin already exists to avoid duplicates
    if (!plugins.some((p: { id: string }) => p.id === buttonPlugin.id)) {
      addPlugin(buttonPlugin);
    }
  }, [addPlugin, plugins])

  // 当主题改变时，更新 body 的 data-theme 属性
  useEffect(() => {
    document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: isDarkMode ? '#52c41a' : '#1890ff', // 深色模式下使用绿色
          colorSuccess: '#52c41a',
          colorWarning: isDarkMode ? '#d89614' : '#faad14',
          colorError: isDarkMode ? '#a61d24' : '#f5222d',
          colorTextBase: isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)',
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  )
}

export default App
