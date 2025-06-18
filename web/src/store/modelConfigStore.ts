import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ModelConfig } from '@/types/model';

interface ModelConfigState {
  config: ModelConfig;
  loading: Record<string, boolean>;
  setConfig: (config: Partial<ModelConfig> | ((prev: ModelConfig) => Partial<ModelConfig>)) => void;
  setLoading: (key: string, loading: boolean) => void;
}

const defaultConfig: ModelConfig = {
  temperature: 0.7,
  maxTokens: 2000,
  contextBalance: 1,
  systemPrompt: 'You are a helpful assistant.',
  multiToolsEnabled: false,
  enabledTools: [],
};

export const useModelConfigStore = create<ModelConfigState>()(
  persist(
    (set) => ({
      config: defaultConfig,
      loading: {},
      
      setConfig: (update) => 
        set((state) => {
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

      setLoading: (key, loading) =>
        set((state) => ({
          loading: {
            ...state.loading,
            [key]: loading,
          },
        })),
    }),
    {
      name: 'model-config-storage',
    }
  )
);
