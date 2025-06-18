import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Plugin } from '@/types/plugin';
import { ContentRendererManager } from '@/renderer';

interface PluginState {
  plugins: Plugin[];
  configs: Record<string, Record<string, unknown>>;
  addPlugin: (plugin: Plugin) => void;
  removePlugin: (id: string) => void;
  enablePlugin: (id: string) => void;
  disablePlugin: (id: string) => void;
  getSystemPrompts: () => string[];
  processContent: (content: string) => Promise<string>;
  updatePluginConfig: (id: string, config: Record<string, unknown>) => void;
}

export const usePluginStore = create<PluginState>()(
  persist(
    (set, get) => ({
      plugins: [],
      configs: {},

      addPlugin: (plugin) => {
        set((state) => ({
          plugins: [...state.plugins, plugin],
          configs: {
            ...state.configs,
            [plugin.id]: {
              enabled: true,
              ...plugin.config
            }
          }
        }));
      },      removePlugin: (id) => {
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [id]: _, ...restConfigs } = state.configs;
          return {
            plugins: state.plugins.filter(p => p.id !== id),
            configs: restConfigs
          };
        });
      },

      enablePlugin: (id) => {
        set((state) => ({
          configs: {
            ...state.configs,
            [id]: {
              ...state.configs[id],
              enabled: true
            }
          }
        }));
      },

      disablePlugin: (id) => {
        set((state) => ({
          configs: {
            ...state.configs,
            [id]: {
              ...state.configs[id],
              enabled: false
            }
          }
        }));
      },

      getSystemPrompts: () => {
        const { plugins, configs } = get();
        return plugins
          .filter(p => configs[p.id]?.enabled && p.systemPrompt)
          .map(p => p.systemPrompt!)
          .filter(Boolean);
      },

      processContent: async (content: string) => {
        const { plugins, configs } = get();
        const renderer = new ContentRendererManager({
          plugins,
          pluginConfigs: configs
        });
        return await renderer.render(content);
      },

      updatePluginConfig: (id, config) => {
        set((state) => ({
          configs: {
            ...state.configs,
            [id]: {
              ...state.configs[id],
              ...config
            }
          }
        }));
      },
    }),
    {
      name: 'plugin-storage',
    }
  )
);
