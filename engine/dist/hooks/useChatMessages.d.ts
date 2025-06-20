import type { RuntimeMessage } from '../types/chat';
export declare const useChatMessages: (chatId: string | null, onSend?: (value: string) => void) => {
    messages: RuntimeMessage[];
    isGenerating: boolean;
    setIsGenerating: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    addMessage: (message: RuntimeMessage) => void;
    addClientNotice: (content: string, noticeType?: "error" | "warning" | "info", errorCode?: string) => string | undefined;
    updateLastMessage: (update: Partial<RuntimeMessage> & {
        reasoning_content?: string;
    }) => void;
    removeLastMessage: () => void;
    clearMessages: () => void;
    handleAbort: () => void;
};
//# sourceMappingURL=useChatMessages.d.ts.map