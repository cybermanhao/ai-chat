// engine/store/modelConfigStore.ts
// 多端同构 ModelConfig store 纯逻辑定义
import type { ModelConfig } from '../types/model';

export interface ModelConfigState {
  config: ModelConfig;
  loading: Record<string, boolean>;
  setConfig: (config: Partial<ModelConfig> | ((prev: ModelConfig) => Partial<ModelConfig>)) => void;
  setLoading: (key: string, loading: boolean) => void;
}

export const defaultModelConfig: ModelConfig = {
  temperature: 0.7,
  maxTokens: 2000,
  contextBalance: 1,
  systemPrompt: 'You are a helpful assistant.',
  multiToolsEnabled: false,
  enabledTools: [],
};

export const modelConfigStoreDefinition = (set: any) => ({
  config: defaultModelConfig,
  loading: {},

  setConfig: (update: Partial<ModelConfig> | ((prev: ModelConfig) => Partial<ModelConfig>)) =>
    set((state: ModelConfigState) => {
      const newConfig = typeof update === 'function'
        ? update(state.config)
        : update;
      return {
        config: {
          ...state.config,
          ...newConfig,
        },
      };
    }),

  setLoading: (key: string, loading: boolean) =>
    set((state: ModelConfigState) => ({
      loading: {
        ...state.loading,
        [key]: loading,
      },
    })),
});

// 兼容 web 端导入
export const useModelConfigStore = () => { throw new Error('useModelConfigStore 仅在 web 端实现'); };
