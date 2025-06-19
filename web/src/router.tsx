import { createBrowserRouter } from 'react-router-dom'
import Layout from './layouts/Layout'
import { ContextProvider } from './components/ContextProvider'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: 'chat/:chatId',
        lazy: async () => {
          const { default: Component } = await import('./pages/Chat')
          return {
            Component: () => <Component messages={[]} loading={false} />,
          }
        },
      },
    ],
  },
])
