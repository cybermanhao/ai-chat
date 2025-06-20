export const pluginStoreDefinition = (set, get) => ({
    plugins: [],
    configs: {},
    addPlugin: (plugin) => set((state) => ({
        plugins: [...state.plugins, plugin],
        configs: {
            ...state.configs,
            [plugin.id]: {
                enabled: true,
                ...plugin.config
            }
        }
    })),
    removePlugin: (id) => set((state) => {
        const { [id]: _, ...restConfigs } = state.configs;
        return {
            plugins: state.plugins.filter((p) => p.id !== id),
            configs: restConfigs
        };
    }),
    enablePlugin: (id) => set((state) => ({
        configs: {
            ...state.configs,
            [id]: {
                ...state.configs[id],
                enabled: true
            }
        }
    })),
    disablePlugin: (id) => set((state) => ({
        configs: {
            ...state.configs,
            [id]: {
                ...state.configs[id],
                enabled: false
            }
        }
    })),
    getSystemPrompts: () => {
        const { plugins, configs } = get();
        return plugins
            .filter((p) => configs[p.id]?.enabled && p.systemPrompt)
            .map((p) => p.systemPrompt)
            .filter(Boolean);
    },
    updatePluginConfig: (id, config) => set((state) => ({
        configs: {
            ...state.configs,
            [id]: {
                ...state.configs[id],
                ...config
            }
        }
    })),
});
