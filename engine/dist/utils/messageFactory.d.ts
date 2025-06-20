import type { MessageStatus, UserMessage, AssistantMessage, SystemMessage, ClientNoticeMessage } from '../types/chat';
export declare function createUserMessage(content: string, status?: MessageStatus, extra?: Partial<UserMessage>): UserMessage;
export declare function createAssistantMessage(content: string, status?: MessageStatus, extra?: Partial<AssistantMessage>): AssistantMessage;
export declare function createSystemMessage(content: string, extra?: Partial<SystemMessage>): SystemMessage;
export declare const createMessage: {
    user: (content: string, status?: MessageStatus) => UserMessage;
    assistant: (content?: string, status?: MessageStatus) => AssistantMessage;
    system: (content: string) => SystemMessage;
    clientNotice: (content: string, noticeType?: "error" | "warning" | "info", errorCode?: string) => ClientNoticeMessage;
};
export {};
//# sourceMappingURL=messageFactory.d.ts.map