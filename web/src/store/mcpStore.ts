import { create } from 'zustand';
import { MCPService } from '../../../engine/service/mcpService';
import type { Tool } from '@engine/service/mcpService';
import type { MCPServer } from '@engine/store/mcpStore';

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

// localStorage 持久化 key
const STORAGE_KEY = 'zz-ai-chat-mcp-servers';

// 只持久化 servers（不含 tools/isConnected/loading）和 activeServerId
function saveServersToLocalStorage(servers: MCPServer[], activeServerId?: string) {
  if (typeof window === 'undefined') return;
  // 只保存必要字段
  const simpleServers = servers.map(s => ({
    id: s.id,
    name: s.name,
    url: s.url,
  }));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ servers: simpleServers, activeServerId }));
}

function loadServersFromLocalStorage(): { servers: MCPServer[]; activeServerId?: string } {
  if (typeof window === 'undefined') return { servers: [], activeServerId: undefined };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { servers: [], activeServerId: undefined };
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.servers)) return { servers: [], activeServerId: undefined };
    // 恢复为 MCPServer 结构，运行时字段默认
    return {
      servers: parsed.servers.map((s: { id: string; name: string; url: string }) => ({
        id: s.id,
        name: s.name,
        url: s.url,
        isConnected: false,
        loading: false,
        tools: [],
      })),
      activeServerId: parsed.activeServerId,
    };
  } catch {
    return { servers: [], activeServerId: undefined };
  }
}

export const useMCPStore = create<MCPStoreState>((set, get) => {
  // 初始化时从 localStorage 读取 servers
  const { servers: initialServers, activeServerId: initialActiveServerId } = loadServersFromLocalStorage();
  return {
    servers: initialServers,
    activeServerId: initialActiveServerId,
    isLoading: false,
    addServer: (name, url) => {
      set(state => {
        const newServers = [
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
        saveServersToLocalStorage(newServers, state.activeServerId);
        return { servers: newServers };
      });
    },
    removeServer: (id) => {
      set(state => {
        const newServers = state.servers.filter(s => s.id !== id);
        const newActive = state.activeServerId === id ? undefined : state.activeServerId;
        saveServersToLocalStorage(newServers, newActive);
        return { servers: newServers, activeServerId: newActive };
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
        } else if (data && typeof data === 'object' && Array.isArray((data as { tools?: Tool[] }).tools)) {
          tools = (data as { tools: Tool[] }).tools;
        }
        set(state => {
          const newServers = state.servers.map(s =>
            s.id === id && !error
              ? { ...s, isConnected: true, loading: false, error: undefined, tools }
              : { ...s, isConnected: false, loading: false }
          );
          // 连接/断开不自动持久化（只持久化服务器列表）
          return {
            servers: newServers,
            activeServerId: error ? undefined : id,
            isLoading: false,
          };
        });
      } catch (e) {
        set(state => {
          const newServers = state.servers.map(s =>
            s.id === id
              ? { ...s, isConnected: false, loading: false, error: e instanceof Error ? e.message : String(e), tools: [] }
              : s
          );
          return {
            servers: newServers,
            activeServerId: undefined,
            isLoading: false,
          };
        });
      }
    },
    disconnectServer: (id) => {
      set(state => {
        const newServers = state.servers.map(s =>
          s.id === id ? { ...s, isConnected: false, tools: [] } : s
        );
        // 断开连接不自动持久化（只持久化服务器列表）
        return {
          servers: newServers,
          activeServerId: state.activeServerId === id ? undefined : state.activeServerId,
        };
      });
    },
    setActiveServer: (id) => {
      set(state => {
        saveServersToLocalStorage(state.servers, id);
        return { activeServerId: id };
      });
    },
  };
});