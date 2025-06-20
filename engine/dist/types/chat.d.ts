import type { ChatCompletionMessageToolCall } from 'openai/resources/chat/completions';
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool' | 'client-notice';
export type MessageStatus = 'connecting' | 'thinking' | 'generating' | 'stable' | 'done' | 'error';
export type BaseMessage = {
    id: string;
    timestamp: number;
    content: string;
    status?: MessageStatus;
    name?: string;
};
export type SystemMessage = BaseMessage & {
    role: 'system';
};
export type UserMessage = BaseMessage & {
    role: 'user';
};
export type AssistantMessage = BaseMessage & {
    role: 'assistant';
    reasoning_content?: string;
    tool_content?: string;
    observation_content?: string;
    thought_content?: string;
    tool_calls?: Array<ChatCompletionMessageToolCall>;
};
export type ToolMessage = BaseMessage & {
    role: 'tool';
    tool_call_id: string;
};
export type ClientNoticeMessage = BaseMessage & {
    role: 'client-notice';
    noticeType: 'error' | 'warning' | 'info';
    errorCode?: string;
    status: MessageStatus;
};
export type ChatMessage = SystemMessage | UserMessage | AssistantMessage | ToolMessage | ClientNoticeMessage;
export interface StreamChunk {
    content: string;
    reasoning_content?: string;
    tool_content?: string;
    observation_content?: string;
    thought_content?: string;
    error?: string;
    status?: MessageStatus;
}
export type RuntimeMessage = (SystemMessage & {
    status: MessageStatus;
}) | (UserMessage & {
    status: MessageStatus;
}) | (AssistantMessage & {
    status: MessageStatus;
}) | (ToolMessage & {
    status: MessageStatus;
}) | ClientNoticeMessage;
export interface ChatInfo {
    id: string;
    title: string;
    createTime: number;
    updateTime: number;
    messageCount: number;
}
export interface RuntimeChatState {
    isGenerating: boolean;
    currentMessageId: string | null;
    abortController: AbortController | null;
}
export interface EnableToolItem {
    name: string;
    description: string;
    enabled: boolean;
    inputSchema: Record<string, unknown>;
}
export interface ChatSetting {
    modelIndex: number;
    systemPrompt: string;
    enableTools: EnableToolItem[];
    temperature: number;
    enableWebSearch: boolean;
    contextLength: number;
    parallelToolCalls: boolean;
}
export interface ChatData {
    info: ChatInfo;
    messages: ChatMessage[];
    updateTime: number;
    settings: ChatSetting;
}
export declare function isAssistantMessage(msg: RuntimeMessage): msg is (AssistantMessage & {
    status: MessageStatus;
});
export declare function isClientNoticeMessage(msg: RuntimeMessage): msg is ClientNoticeMessage;
//# sourceMappingURL=chat.d.ts.map