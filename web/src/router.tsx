import { createBrowserRouter } from 'react-router-dom'
import Layout from './layouts/Layout'


export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <div>Home</div>
      },
      {
        path: 'chat/:chatId?',
        lazy: async () => {
          const { Chat } = await import('./pages/Chat');
          return { Component: Chat }
        },
      },
    ],
  },
])
