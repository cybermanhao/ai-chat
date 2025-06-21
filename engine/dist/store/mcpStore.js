export const mcpStoreDefinition = (set) => ({
    servers: [],
    activeServerId: undefined,
    messages: [],
    isLoading: false,
    currentModel: '',
    addServer: (name, url) => {
        const id = Math.random().toString(36).substring(7);
        set((state) => ({
            servers: [...state.servers, {
                    id,
                    name,
                    url,
                    isConnected: false,
                    tools: [],
                    error: undefined
                }]
        }));
    },
    removeServer: (id) => {
        set((state) => ({
            servers: state.servers.filter(server => server.id !== id),
            activeServerId: state.activeServerId === id ? undefined : state.activeServerId,
        }));
    },
    updateServer: (id, data) => {
        set((state) => ({
            servers: state.servers.map(server => server.id === id ? { ...server, ...data } : server)
        }));
    },
    setActiveServer: (id) => {
        set({ activeServerId: id });
    },
    addMessage: (message) => {
        set((state) => ({
            messages: [...state.messages, message],
        }));
    },
    updateLastMessage: (content) => {
        set((state) => {
            const messages = [...state.messages];
            if (messages.length > 0) {
                messages[messages.length - 1] = {
                    ...messages[messages.length - 1],
                    content,
                };
            }
            return { messages };
        });
    },
    clearMessages: () => {
        set({ messages: [] });
    },
    setCurrentModel: (modelName) => {
        set({ currentModel: modelName });
    },
    connectServer: async (id) => {
        // 仅前端 mock，实际后端未接入
        set((state) => ({
            servers: state.servers.map(server => server.id === id
                ? { ...server, isConnected: true, error: undefined, tools: [] }
                : server),
            activeServerId: id,
            isLoading: false
        }));
    },
    disconnectServer: (id) => {
        set((state) => ({
            servers: state.servers.map(server => server.id === id
                ? { ...server, isConnected: false }
                : server),
            isLoading: false
        }));
    },
});
