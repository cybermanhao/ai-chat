import { createBrowserRouter, Navigate } from 'react-router-dom'
import Layout from './layouts/Layout'


export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        // 首页重定向到 /chat
        element: <Navigate to="/chat" replace />,
      },
      {
        path: 'chat/:chatId?',
        lazy: async () => {
          const { Chat } = await import('./pages/Chat');
          return { Component: Chat };
        },
      },
    ],
  },
])
