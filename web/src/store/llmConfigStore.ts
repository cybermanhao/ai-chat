import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LLMConfig {
  apiKey?: string;
  baseUrl?: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
}

interface LLMConfigState {
  activeLLMId: string | null;
  configs: Record<string, LLMConfig>;
  
  // Actions
  setActiveLLM: (llmId: string | null) => void;
  updateConfig: (llmId: string, config: Partial<LLMConfig>) => void;
  resetConfig: (llmId: string) => void;
}

const defaultConfig: LLMConfig = {
  model: '',
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: 'You are a helpful assistant.',
};

export const useLLMConfigStore = create<LLMConfigState>()(
  persist(
    (set) => ({
      activeLLMId: null,
      configs: {},

      setActiveLLM: (llmId) => set({ activeLLMId: llmId }),

      updateConfig: (llmId, config) => 
        set((state) => ({
          configs: {
            ...state.configs,
            [llmId]: {
              ...(state.configs[llmId] || defaultConfig),
              ...config,
            },
          },
        })),

      resetConfig: (llmId) =>
        set((state) => ({
          configs: {
            ...state.configs,
            [llmId]: { ...defaultConfig },
          },
        })),
    }),
    {
      name: 'llm-config-storage',
      partialize: (state) => ({
        configs: state.configs,
        activeLLMId: state.activeLLMId,
      }),
    }
  )
);
