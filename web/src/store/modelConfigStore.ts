import { create } from 'zustand';
import type { ModelConfig, ModelConfigState, ModelConfigLoading } from '@/types/model';

const defaultConfig: ModelConfig = {
  temperature: 0.7,
  contextBalance: 1,
  systemPrompt: '',
  multiToolsEnabled: false,
  enabledTools: [],
};

const defaultLoading: ModelConfigLoading = {
  temperature: false,
  contextBalance: false,
  systemPrompt: false,
  multiTools: false,
  tools: false,
};

export const useModelConfigStore = create<ModelConfigState>((set) => ({
  config: defaultConfig,
  loading: defaultLoading,

  setConfig: (update) => 
    set((state) => ({
      config: {
        ...state.config,
        ...(typeof update === 'function' ? update(state.config) : update),
      },
    })),

  setLoading: (key, value) =>
    set((state) => ({
      loading: { ...state.loading, [key]: value },
    })),

  reset: () =>
    set({
      config: defaultConfig,
      loading: defaultLoading,
    }),
}));
