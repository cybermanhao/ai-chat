export const useChatRuntimeStore = (set, get) => ({
    isGenerating: false,
    abortController: null,
    runtimeMessages: {},
    runtimeStates: {},
    setMessageStatus: (messageId, status) => {
        set((state) => ({
            runtimeMessages: {
                ...state.runtimeMessages,
                [messageId]: {
                    ...(state.runtimeMessages[messageId] || {}),
                    status
                }
            }
        }));
    },
    updateMessageContent: (params) => {
        const { messageId, content, reasoning_content, tool_content, observation_content, thought_content } = params;
        set((state) => {
            const message = state.runtimeMessages[messageId];
            if (!message) {
                return state;
            }
            return {
                runtimeMessages: {
                    ...state.runtimeMessages,
                    [messageId]: {
                        ...message,
                        content,
                        ...(reasoning_content !== undefined ? { reasoning_content } : {}),
                        ...(tool_content !== undefined ? { tool_content } : {}),
                        ...(observation_content !== undefined ? { observation_content } : {}),
                        ...(thought_content !== undefined ? { thought_content } : {})
                    }
                }
            };
        });
    },
    setRuntimeState: (chatId, newState) => {
        set((state) => ({
            runtimeStates: {
                ...state.runtimeStates,
                [chatId]: {
                    ...(state.runtimeStates[chatId] || {
                        isGenerating: false,
                        currentMessageId: null,
                        abortController: null
                    }),
                    ...newState
                }
            }
        }));
    },
    clearRuntimeState: (chatId) => {
        set((state) => {
            const { [chatId]: removed, ...rest } = state.runtimeStates;
            return {
                runtimeStates: rest
            };
        });
    },
    clearAllRuntimeStates: () => {
        set({
            isGenerating: false,
            abortController: null,
            runtimeMessages: {},
            runtimeStates: {}
        });
    }
});
// 导出 storeDefinition 供多端绑定
export const chatRuntimeStoreDefinition = useChatRuntimeStore;
