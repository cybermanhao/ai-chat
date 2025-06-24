import { create } from 'zustand';
import { MCPService } from '../../../engine/service/mcpService';

export type Tool = { name: string; description: string };
export interface MCPServer {
  id: string;
  name: string;
  url: string;
  isConnected: boolean;
  loading: boolean;
  error?: string;
  tools: Tool[];
}

interface MCPStoreState {
  servers: MCPServer[];
  activeServerId?: string;
  isLoading: boolean;
  addServer: (name: string, url: string) => void;
  removeServer: (id: string) => void;
  connectServer: (id: string) => Promise<void>;
  disconnectServer: (id: string) => void;
  setActiveServer: (id: string) => void;
}

export const useMCPStore = create<MCPStoreState>((set, get) => ({
  servers: [],
  activeServerId: undefined,
  isLoading: false,
  addServer: (name, url) => {
    set(state => ({
      servers: [
        ...state.servers,
        {
          id: `${Date.now()}-${Math.random()}`,
          name,
          url,
          isConnected: false,
          loading: false,
          tools: [],
        },
      ],
    }));
  },
  removeServer: (id) => {
    set(state => ({
      servers: state.servers.filter(s => s.id !== id),
      activeServerId: state.activeServerId === id ? undefined : state.activeServerId,
    }));
  },
  connectServer: async (id) => {
    set({ isLoading: true });
    set(state => ({
      servers: state.servers.map(s =>
        s.id === id ? { ...s, loading: true, error: undefined } : s
      ),
    }));
    const server = get().servers.find(s => s.id === id);
    if (!server) return;
    try {
      const mcp = new MCPService(server.url, 'STREAMABLE_HTTP');
      const { data, error } = await mcp.listTools();
      let tools: Tool[] = [];
      if (Array.isArray(data)) {
        tools = data;
      } else if (data && typeof data === 'object' && Array.isArray((data as { tools?: Tool[] }).tools)) {
        tools = (data as { tools: Tool[] }).tools;
      }
      set(state => ({
        servers: state.servers.map(s =>
          s.id === id && !error
            ? { ...s, isConnected: true, loading: false, error: undefined, tools }
            : { ...s, isConnected: false, loading: false }
        ),
        activeServerId: error ? undefined : id,
        isLoading: false,
      }));
    } catch (e) {
      set(state => ({
        servers: state.servers.map(s =>
          s.id === id
            ? { ...s, isConnected: false, loading: false, error: e instanceof Error ? e.message : String(e), tools: [] }
            : s
        ),
        activeServerId: undefined,
        isLoading: false,
      }));
    }
  },
  disconnectServer: (id) => {
    set(state => ({
      servers: state.servers.map(s =>
        s.id === id ? { ...s, isConnected: false, tools: [] } : s
      ),
      activeServerId: state.activeServerId === id ? undefined : state.activeServerId,
    }));
  },
  setActiveServer: (id) => {
    set({ activeServerId: id });
  },
}));