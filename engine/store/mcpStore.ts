// engine/store/mcpStore.ts
// 多端同构 MCP store 纯逻辑定义
export interface Tool {
  name: string;
  description: string;
}

export interface MCPServer {
  id: string;
  name: string;
  url: string;
  isConnected: boolean;
  tools: Tool[];
  error?: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
}

export interface MCPState {
  servers: MCPServer[];
  activeServerId?: string;
  isLoading: boolean;
  messages: Message[];
  currentModel: string;
  addServer: (name: string, url: string) => void;
  removeServer: (id: string) => void;
  updateServer: (id: string, data: Partial<MCPServer>) => void;
  setActiveServer: (id: string) => void;
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string) => void;
  clearMessages: () => void;
  setCurrentModel: (modelName: string) => void;
}

export const mcpStoreDefinition = (set: any, get: any) => ({
  servers: [],
  activeServerId: undefined,
  messages: [],
  isLoading: false,
  currentModel: '',

  addServer: (name: string, url: string) => {
    const id = Math.random().toString(36).substring(7);
    set((state: MCPState) => ({
      servers: [...state.servers, {
        id,
        name,
        url,
        isConnected: false,
        tools: [],
      }]
    }));
  },

  removeServer: (id: string) => {
    set((state: MCPState) => ({
      servers: state.servers.filter(server => server.id !== id),
      activeServerId: state.activeServerId === id ? undefined : state.activeServerId,
    }));
  },

  updateServer: (id: string, data: Partial<MCPServer>) => {
    set((state: MCPState) => ({
      servers: state.servers.map(server =>
        server.id === id ? { ...server, ...data } : server
      )
    }));
  },

  setActiveServer: (id: string) => {
    set({ activeServerId: id });
  },

  addMessage: (message: Message) => {
    set((state: MCPState) => ({
      messages: [...state.messages, message],
    }));
  },

  updateLastMessage: (content: string) => {
    set((state: MCPState) => {
      const messages = [...state.messages];
      if (messages.length > 0) {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          content,
        };
      }
      return { messages };
    });
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  setCurrentModel: (modelName: string) => {
    set({ currentModel: modelName });
  },
});
