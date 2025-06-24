// engine/store/llmConfigStore.ts
// 多端同构 LLM 配置 store 纯逻辑定义
import type { LLMConfigState } from '../types/llm';
import { defaultLLMConfig } from '../types/llm';

// 纯逻辑 reducer，适用于 zustand/zustand-pub/zustand-vue 等多端绑定
export const llmConfigStoreDefinition = (set: any) => ({
  activeLLMId: null as string | null,
  configs: {} as LLMConfigState['configs'],

  setActiveLLM: (llmId: string) => set({ activeLLMId: llmId }),

  updateConfig: (llmId: string, config: any) =>
    set((state: LLMConfigState) => ({
      configs: {
        ...state.configs,
        [llmId]: {
          ...(state.configs[llmId] || defaultLLMConfig),
          ...config,
        },
      },
    })),

  resetConfig: (llmId: string) =>
    set((state: LLMConfigState) => ({
      configs: {
        ...state.configs,
        [llmId]: { ...defaultLLMConfig },
      },
    })),
});

// 兼容 web 端导入
export const useLLMConfigStore = () => { throw new Error('useLLMConfigStore 仅在 web 端实现'); };
