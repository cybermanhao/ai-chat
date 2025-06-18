import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { message } from 'antd'
import { mcpService } from '@/services/mcpService'
import { config } from '@/config'

interface Tool {
  name: string
  description: string
}

interface MCPServer {
  id: string
  name: string
  url: string
  isConnected: boolean
  tools: Tool[]
  error?: string
}

interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  toolName?: string
  toolArgs?: Record<string, unknown>
}

interface MCPState {
  servers: MCPServer[]
  activeServerId?: string
  isLoading: boolean
  messages: Message[]
  currentModel: string

  addServer: (name: string, url: string) => void
  removeServer: (id: string) => void
  updateServer: (id: string, data: Partial<MCPServer>) => void
  connectServer: (id: string) => Promise<void>
  disconnectServer: (id: string) => void
  setActiveServer: (id: string) => void
  addMessage: (message: Message) => void
  updateLastMessage: (content: string) => void
  clearMessages: () => void
  setCurrentModel: (modelName: string) => void
}

export const useMCPStore = create<MCPState>()(
  devtools(
    (set, get) => ({
      servers: [],
      activeServerId: undefined,
      messages: [],
      isLoading: false,
      currentModel: config.defaultModelName,

      addServer: (name: string, url: string) => {
        const id = Math.random().toString(36).substring(7)
        set((state) => ({
          servers: [...state.servers, { 
            id,
            name, 
            url,
            isConnected: false,
            tools: [],
          }]
        }))
      },

      removeServer: (id: string) => {
        set((state) => ({
          servers: state.servers.filter(server => server.id !== id),
          activeServerId: state.activeServerId === id ? undefined : state.activeServerId,
        }))
      },

      updateServer: (id: string, data: Partial<MCPServer>) => {
        set((state) => ({
          servers: state.servers.map(server => 
            server.id === id ? { ...server, ...data } : server
          )
        }))
      },      connectServer: async (id: string) => {
        const state = get()
        const server = state.servers.find(s => s.id === id)
        if (!server) return

        set((state) => ({
          isLoading: true,
          servers: state.servers.map(server =>
            server.id === id ? { ...server, error: undefined } : server
          )
        }))

        try {
          mcpService.setBaseUrl(server.url)
          const tools = await mcpService.listTools()
          
          if (tools.error) throw new Error(tools.error)

          set((state) => ({
            servers: state.servers.map(server =>
              server.id === id ? {
                ...server,
                isConnected: true,
                tools: tools.data || [],
                error: undefined,
              } : server
            )
          }))
        } catch (error) {
          message.error(error instanceof Error ? error.message : 'Failed to connect to MCP server')
          set((state) => ({
            servers: state.servers.map(server =>
              server.id === id ? {
                ...server,
                isConnected: false,
                error: error instanceof Error ? error.message : 'Failed to connect to MCP server',
              } : server
            )
          }))
        } finally {
          set({ isLoading: false })
        }
      },

      disconnectServer: (id: string) => {
        set((state) => ({
          servers: state.servers.map(server =>
            server.id === id ? { ...server, isConnected: false, tools: [] } : server
          )
        }))
      },

      setActiveServer: (id: string) => {
        set({ activeServerId: id })
      },

      addMessage: (message: Message) => {
        set((state) => ({
          messages: [...state.messages, message],
        }))
      },

      updateLastMessage: (content: string) => {
        set((state) => {
          const messages = [...state.messages]
          if (messages.length > 0) {
            messages[messages.length - 1] = {
              ...messages[messages.length - 1],
              content,
            }
          }
          return { messages }
        })
      },

      clearMessages: () => {
        set({ messages: [] })
      },

      setCurrentModel: (modelName: string) => {
        set({ currentModel: modelName })
      },
    }),
    { name: 'mcp-store' }
  )
)
