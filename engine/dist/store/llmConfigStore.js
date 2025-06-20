import { defaultLLMConfig } from '../types/llm';
// 纯逻辑 reducer，适用于 zustand/zustand-pub/zustand-vue 等多端绑定
export const llmConfigStoreDefinition = (set) => ({
    activeLLMId: null,
    configs: {},
    setActiveLLM: (llmId) => set({ activeLLMId: llmId }),
    updateConfig: (llmId, config) => set((state) => ({
        configs: {
            ...state.configs,
            [llmId]: {
                ...(state.configs[llmId] || defaultLLMConfig),
                ...config,
            },
        },
    })),
    resetConfig: (llmId) => set((state) => ({
        configs: {
            ...state.configs,
            [llmId]: { ...defaultLLMConfig },
        },
    })),
});
// 兼容 web 端导入
export const useLLMConfigStore = () => { throw new Error('useLLMConfigStore 仅在 web 端实现'); };
