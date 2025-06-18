import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { llms } from '@/utils/llms/llms';

interface LLMState {
  selectedLLM: string | null;
  selectedModel: string;
  tokens: Record<string, string>;
  setSelectedLLM: (llmId: string) => void;
  setSelectedModel: (model: string) => void;
  setToken: (llmId: string, token: string) => void;
}

export const useLLMStore = create<LLMState>()(
  devtools(
    persist(
      (set) => ({
        selectedLLM: llms[0].id,
        selectedModel: llms[0].userModel,
        tokens: {},

        setSelectedLLM: (llmId: string) => {
          const llm = llms.find(l => l.id === llmId);
          if (llm) {
            set({
              selectedLLM: llm.id,
              selectedModel: llm.userModel,
            });
          }
        },

        setSelectedModel: (model: string) => {
          set({ selectedModel: model });
        },

        setToken: (llmId: string, token: string) => {
          set(state => ({
            tokens: {
              ...state.tokens,
              [llmId]: token,
            },
          }));
        },
      }),
      {
        name: 'llm-storage',
      }
    ),
    {
      name: 'llm-store',
    }
  )
);
