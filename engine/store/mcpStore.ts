// engine/store/mcpStore.ts
// 多端同构 MCP store 纯逻辑定义

import { MCPService, Tool } from '../service/mcpService';

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

// 通用 fetch 工具列表方法，仅保留协议层/后端适配（不再尝试多种HTTP路径）
async function fetchMcpTools(url: string): Promise<{ data: Tool[]; error?: string }> {
  console.log('[MCPStore] fetchMcpTools 已废弃');
  return { data: [], error: 'HTTP工具列表接口已废弃，请使用协议层 getMcpToolsByProtocol' };
}

// engine层 MCP工具列表协议层实现（Node/Electron等支持进程的环境）
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export async function getMcpToolsByProtocol(serverCommand: string = "node", serverArgs: string[] = ["server.js"]): Promise<{ data: any[]; error?: string }> {
  console.log(`[MCPStore] getMcpToolsByProtocol 开始执行, 命令: ${serverCommand}, 参数:`, serverArgs);
  try {
    const mcp = new Client({ name: "mcp-client", version: "1.0.0" });
    console.log('[MCPStore] 已创建 MCP 客户端');
    const transport = new StdioClientTransport({ command: serverCommand, args: serverArgs });
    console.log('[MCPStore] 已创建 STDIO 传输');
    await mcp.connect(transport);
    console.log('[MCPStore] 已连接到服务器');
    const rawTools = await mcp.listTools();
    const tools = Object.entries(rawTools).map(([name, info]: [string, any]) => ({
      name,
      title: info.title || name,
      description: info.description || ''
    }));
    console.log('[MCPStore] 已获取工具列表:', tools);
    return { data: tools };
  } catch (e: any) {
    console.error('[MCPStore] getMcpToolsByProtocol 失败:', e);
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
    const state = get();
    const server = state.servers.find((s: MCPServer) => s.id === id);
    if (!server) {
      console.error(`[MCPStore] 找不到服务器 ID: ${id}`);
      return;
    }

    console.log(`[MCPStore] 开始连接服务器 ${server.name} (${server.url})`);
    set({ isLoading: true });

    try {
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
