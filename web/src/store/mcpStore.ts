import { mcpStoreDefinition } from '@engine/store/mcpStore';
import { create } from 'zustand';
// 类型补全，消除 unknown 推断
import type { MCPState } from '@engine/store/mcpStore';

// 仅为编译通过的 mock，connect/disconnectServer 仅做 UI 状态切换
export const useMCPStore = create<MCPState & {
  connectServer: (id: string) => Promise<void>;
  disconnectServer: (id: string) => void;
}>((set, get) => ({
  ...mcpStoreDefinition(set, get),
  connectServer: async (id: string) => {
    set((state) => ({
      servers: state.servers.map((s) =>
        s.id === id ? { ...s, isConnected: true, error: undefined } : s
      ),
    }));
  },
  disconnectServer: (id: string) => {
    set((state) => ({
      servers: state.servers.map((s) =>
        s.id === id ? { ...s, isConnected: false } : s
      ),
    }));
  },
}));