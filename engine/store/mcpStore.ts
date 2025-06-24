// engine/store/mcpStore.ts
// 多端同构 MCP store 纯逻辑定义

import { MCPService } from '../service/mcpService';
import type { Tool } from '../service/mcpService';

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
  connectServer: (id: string) => Promise<void>;
  disconnectServer: (id: string) => void;
}

// engine层 MCP工具列表协议层实现（Node/Electron等支持进程的环境）
// import { Client } from "@modelcontextprotocol/sdk/client/index.js";
// import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

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
    const state = get();
    const server = state.servers.find((s: MCPServer) => s.id === id);
    if (!server) {
      console.error(`[MCPStore] 找不到服务器 ID: ${id}`);
      return;
    }
    set({ isLoading: true });
    try {
      console.log(`[MCPStore] 开始连接服务器 ${server.name} (${server.url})`);
      const mcpService = new MCPService(server.url, "STREAMABLE_HTTP");
      console.log('[MCPStore] MCPService 实例已创建');
      const { data: tools, error } = await mcpService.listTools();
      if (error) {
        console.error('[MCPStore] 获取工具列表失败:', error);
        set((state: MCPState) => ({
          servers: state.servers.map(s =>
            s.id === id ? { ...s, error, isConnected: false } : s
          ),
          isLoading: false
        }));
        return;
      }
      console.log(`[MCPStore] 成功获取工具列表, 数量: ${tools.length}, 工具:`, tools);
      set((state: MCPState) => ({
        servers: state.servers.map(s =>
          s.id === id ? { ...s, tools, isConnected: true, error: undefined } : s
        ),
        isLoading: false
      }));
    } catch (e: any) {
      console.error('[MCPStore] 连接服务器失败:', e);
      set((state: MCPState) => ({
        servers: state.servers.map(s =>
          s.id === id ? { ...s, error: e.message, isConnected: false } : s
        ),
        isLoading: false
      }));
    }
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