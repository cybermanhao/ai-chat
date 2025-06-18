import { createBrowserRouter } from 'react-router-dom'
import Layout from './layouts/Layout'
import { ContextProvider } from './components/ContextProvider'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        element: <ContextProvider context={{ setCurrentChatId: null }} />,
        children: [
          {
            path: 'chats',
            lazy: async () => {
              const { default: Component } = await import('./pages/ChatList')
              return { Component }
            },
          },
          {
            path: 'roles',
            lazy: async () => {
              const { default: Component } = await import('./pages/RoleList')
              return { Component }
            },
          },
          {
            path: 'settings',
            lazy: async () => {
              const { default: Component } = await import('./pages/Settings')
              return { Component }
            },
          },          {
            path: 'plugins',
            lazy: async () => {
              const { default: Component } = await import('./pages/Plugins')
              return { Component }
            },
          },
          {
            path: 'mcp',
            lazy: async () => {
              const { default: Component } = await import('./pages/Mcp')
              return { Component }
            },
          },
          {
            path: 'profile',
            lazy: async () => {
              const { default: Component } = await import('./pages/Profile')
              return { Component }
            },
          },
        ],
      },
    ],
  },
])
