// ========================================
// [插件系统已禁用] - 插件系统尚未完善，暂时停止开发
// 本文件保留插件store类型定义，但注释掉store实现
// 如需恢复插件功能，请取消相关注释并完善插件系统实现
// ========================================

// engine/store/pluginStore.ts
// 多端同构 Plugin store 纯逻辑定义
// [插件系统已禁用] - 注释掉插件类型导入
// import type { Plugin } from '../types/plugin';

// [插件系统已禁用] - 保留接口定义，但注释掉实际使用
/*
export interface PluginState {
  plugins: Plugin[];
  configs: Record<string, Record<string, unknown>>;
  addPlugin: (plugin: Plugin) => void;
  removePlugin: (id: string) => void;
  enablePlugin: (id: string) => void;
  disablePlugin: (id: string) => void;
  getSystemPrompts: () => string[];
  updatePluginConfig: (id: string, config: Record<string, unknown>) => void;
}
*/

// [插件系统已禁用] - 使用空接口，防止类型错误
export interface PluginState {
  plugins: any[];
  configs: Record<string, Record<string, unknown>>;
  addPlugin: (plugin: any) => void;
  removePlugin: (id: string) => void;
  enablePlugin: (id: string) => void;
  disablePlugin: (id: string) => void;
  getSystemPrompts: () => string[];
  updatePluginConfig: (id: string, config: Record<string, unknown>) => void;
}

// [插件系统已禁用] - 注释掉插件store实现
/*
export const pluginStoreDefinition = (set: any, get: any) => ({
  plugins: [],
  configs: {},

  addPlugin: (plugin: Plugin) => set((state: PluginState) => ({
    plugins: [...state.plugins, plugin],
    configs: {
      ...state.configs,
      [plugin.id]: {
        enabled: true,
        ...plugin.config
      }
    }
  })),

  removePlugin: (id: string) => set((state: PluginState) => {
    const { [id]: _, ...restConfigs } = state.configs;
    return {
      plugins: state.plugins.filter((p: Plugin) => p.id !== id),
      configs: restConfigs
    };
  }),

  enablePlugin: (id: string) => set((state: PluginState) => ({
    configs: {
      ...state.configs,
      [id]: {
        ...state.configs[id],
        enabled: true
      }
    }
  })),

  disablePlugin: (id: string) => set((state: PluginState) => ({
    configs: {
      ...state.configs,
      [id]: {
        ...state.configs[id],
        enabled: false
      }
    }
  })),

  getSystemPrompts: () => {
    const { plugins, configs } = get();
    return (plugins as Plugin[])
      .filter((p: Plugin) => configs[p.id]?.enabled && p.systemPrompt)
      .map((p: Plugin) => p.systemPrompt!)
      .filter(Boolean);
  },

  updatePluginConfig: (id: string, config: Record<string, unknown>) => set((state: PluginState) => ({
    configs: {
      ...state.configs,
      [id]: {
        ...state.configs[id],
        ...config
      }
    }
  })),
});
*/

// [插件系统已禁用] - 导出空的store定义，防止其他模块引用出错
export const pluginStoreDefinition = (set: any, get: any) => ({
  plugins: [],
  configs: {},

  addPlugin: (plugin: any) => {
    console.log('[插件系统已禁用] addPlugin 已停用');
  },

  removePlugin: (id: string) => {
    console.log('[插件系统已禁用] removePlugin 已停用');
  },

  enablePlugin: (id: string) => {
    console.log('[插件系统已禁用] enablePlugin 已停用');
  },

  disablePlugin: (id: string) => {
    console.log('[插件系统已禁用] disablePlugin 已停用');
  },

  getSystemPrompts: () => {
    console.log('[插件系统已禁用] getSystemPrompts 已停用');
    return [];
  },

  updatePluginConfig: (id: string, config: Record<string, unknown>) => {
    console.log('[插件系统已禁用] updatePluginConfig 已停用');
  },
});
