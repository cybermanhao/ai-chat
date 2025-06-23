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
  connectServer: (id: string) => void;
  disconnectServer: (id: string) => void;
}

// 通用 fetch 工具列表方法，适配多端与多种返回结构
async function fetchMcpTools(url: string): Promise<{ data: Tool[]; error?: string }> {
  try {
    // 兼容 /tools、/listTools、/list-tools 等多种路径
    const candidates = [
      `${url}/tools`,
      `${url}/listTools`,
      `${url}/list-tools`
    ];
    let lastError = '';
    for (const endpoint of candidates) {
      try {
        const res = await fetch(endpoint, { headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) {
          lastError = `HTTP ${res.status}`;
          continue;
        }
        const json = await res.json();
        // 兼容 { tools }, { data }, 直接数组三种格式
        const data = json.tools || json.data || (Array.isArray(json) ? json : []);
        if (Array.isArray(data) && data.length >= 0) {
          return { data, error: json.error };
        }
      } catch (e: any) {
        lastError = e.message;
      }
    }
    return { data: [], error: lastError || 'No valid MCP tools endpoint found' };
  } catch (e: any) {
    return { data: [], error: e.message };
  }
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
        error: undefined
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

  connectServer: async (id: string) => {
    set((state: MCPState) => ({ isLoading: true }));
    const server = get().servers.find((s: MCPServer) => s.id === id);
    if (!server) return;
    const { data, error } = await fetchMcpTools(server.url);
    if (error) {
      set((state: MCPState) => ({
        servers: state.servers.map(s =>
          s.id === id
            ? { ...s, isConnected: false, error, tools: [] }
            : s
        ),
        isLoading: false
      }));
      return;
    }
    set((state: MCPState) => ({
      servers: state.servers.map(s =>
        s.id === id
          ? { ...s, isConnected: true, error: undefined, tools: data || [] }
          : s
      ),
      activeServerId: id,
      isLoading: false
    }));
  },
  disconnectServer: (id: string) => {
    set((state: MCPState) => ({
      servers: state.servers.map(server =>
        server.id === id
          ? { ...server, isConnected: false }
          : server
      ),
      isLoading: false
    }));
  },
});
