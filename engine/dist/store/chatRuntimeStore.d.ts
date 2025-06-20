import type { RuntimeMessage, MessageStatus, RuntimeChatState } from '../types/chat';
export interface ChatRuntimeState {
    isGenerating: boolean;
    abortController: AbortController | null;
    runtimeMessages: Record<string, RuntimeMessage>;
    setMessageStatus: (messageId: string, status: MessageStatus) => void;
    updateMessageContent: (params: {
        messageId: string;
        content: string;
        reasoning_content?: string;
        tool_content?: string;
        observation_content?: string;
        thought_content?: string;
    }) => void;
    runtimeStates: Record<string, RuntimeChatState>;
    setRuntimeState: (chatId: string, state: Partial<RuntimeChatState>) => void;
    clearRuntimeState: (chatId: string) => void;
    clearAllRuntimeStates: () => void;
}
export declare const useChatRuntimeStore: (set: any, get: any) => {
    isGenerating: boolean;
    abortController: null;
    runtimeMessages: {};
    runtimeStates: {};
    setMessageStatus: (messageId: string, status: MessageStatus) => void;
    updateMessageContent: (params: {
        messageId: string;
        content: string;
        reasoning_content?: string;
        tool_content?: string;
        observation_content?: string;
        thought_content?: string;
    }) => void;
    setRuntimeState: (chatId: string, newState: Partial<RuntimeChatState>) => void;
    clearRuntimeState: (chatId: string) => void;
    clearAllRuntimeStates: () => void;
};
export declare const chatRuntimeStoreDefinition: (set: any, get: any) => {
    isGenerating: boolean;
    abortController: null;
    runtimeMessages: {};
    runtimeStates: {};
    setMessageStatus: (messageId: string, status: MessageStatus) => void;
    updateMessageContent: (params: {
        messageId: string;
        content: string;
        reasoning_content?: string;
        tool_content?: string;
        observation_content?: string;
        thought_content?: string;
    }) => void;
    setRuntimeState: (chatId: string, newState: Partial<RuntimeChatState>) => void;
    clearRuntimeState: (chatId: string) => void;
    clearAllRuntimeStates: () => void;
};
//# sourceMappingURL=chatRuntimeStore.d.ts.map