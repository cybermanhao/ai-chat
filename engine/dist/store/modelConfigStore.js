export const defaultModelConfig = {
    temperature: 0.7,
    maxTokens: 2000,
    contextBalance: 1,
    systemPrompt: 'You are a helpful assistant.',
    multiToolsEnabled: false,
    enabledTools: [],
};
export const modelConfigStoreDefinition = (set) => ({
    config: defaultModelConfig,
    loading: {},
    setConfig: (update) => set((state) => {
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
    setLoading: (key, loading) => set((state) => ({
        loading: {
            ...state.loading,
            [key]: loading,
        },
    })),
});
// 兼容 web 端导入
export const useModelConfigStore = () => { throw new Error('useModelConfigStore 仅在 web 端实现'); };
