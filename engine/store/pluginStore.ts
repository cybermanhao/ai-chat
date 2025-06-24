// engine/store/pluginStore.ts
// 多端同构 Plugin store 纯逻辑定义
import type { Plugin } from '../types/plugin';

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
