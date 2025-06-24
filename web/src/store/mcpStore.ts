import { create } from 'zustand';
import { MCPService } from '../../../engine/service/mcpService';
import type { Tool } from '@engine/service/mcpService';

export interface MCPServer {
  id: string;
  name: string;
  url: string;
  isConnected: boolean;
  loading: boolean;
  tools: Tool[];
  error?: string;
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

// 本地存储 key
const STORAGE_KEY = 'mcp_servers_v1';

function saveServersToStorage(servers: MCPServer[], activeServerId?: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ servers, activeServerId }));
  } catch { /* ignore */ }
}

function loadServersFromStorage(): { servers: MCPServer[]; activeServerId?: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { servers: [], activeServerId: undefined };
}

export const useMCPStore = create<MCPStoreState>((set, get) => {
  // 初始化时从本地存储加载
  const { servers: initialServers, activeServerId: initialActive } = loadServersFromStorage();
  return {
    servers: initialServers,
    activeServerId: initialActive,
    isLoading: false,
    addServer: (name, url) => {
      set(state => {
        const servers: MCPServer[] = [
          ...state.servers,
          {
            id: `${Date.now()}-${Math.random()}`,
            name,
            url,
            isConnected: false,
            loading: false,
            tools: [],
          },
        ];
        saveServersToStorage(servers, state.activeServerId);
        return { servers };
      });
    },
    removeServer: (id) => {
      set(state => {
        const servers = state.servers.filter(s => s.id !== id);
        const activeServerId = state.activeServerId === id ? undefined : state.activeServerId;
        saveServersToStorage(servers, activeServerId);
        return { servers, activeServerId };
      });
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
        } // 只保留数组分支
        set(state => {
          const servers = state.servers.map(s =>
            s.id === id && !error
              ? { ...s, isConnected: true, loading: false, error: undefined, tools }
              : { ...s, isConnected: false, loading: false }
          );
          const activeServerId = error ? undefined : id;
          saveServersToStorage(servers, activeServerId);
          return { servers, activeServerId, isLoading: false };
        });
      } catch (e) {
        set(state => {
          const servers = state.servers.map(s =>
            s.id === id
              ? { ...s, isConnected: false, loading: false, error: e instanceof Error ? e.message : String(e), tools: [] }
              : s
          );
          saveServersToStorage(servers, undefined);
          return { servers, activeServerId: undefined, isLoading: false };
        });
      }
    },
    disconnectServer: (id) => {
      set(state => {
        const servers = state.servers.map(s =>
          s.id === id ? { ...s, isConnected: false, tools: [] } : s
        );
        const activeServerId = state.activeServerId === id ? undefined : state.activeServerId;
        saveServersToStorage(servers, activeServerId);
        return { servers, activeServerId };
      });
    },
    setActiveServer: (id) => {
      set(state => {
        saveServersToStorage(state.servers, id);
        return { activeServerId: id };
      });
    },
  };
});