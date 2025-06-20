import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LLMConfigState } from '@/types/llm';
import { defaultLLMConfig } from '@/types/llm';

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
              ...(state.configs[llmId] || defaultLLMConfig),
              ...config,
            },
          },
        })),

      resetConfig: (llmId) =>
        set((state) => ({
          configs: {
            ...state.configs,
            [llmId]: { ...defaultLLMConfig },
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
