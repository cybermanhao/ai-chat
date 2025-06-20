import type { ChatCompletionChunk, ChatCompletionRole, ChatCompletionChunk as OpenAIChatCompletionChunk } from 'openai/resources/chat/completions';
export type BasePlatformExtension = Record<string, unknown>;
export interface DeepseekExtension extends BasePlatformExtension {
    reasoning_content?: string | null;
    system_fingerprint?: string;
    tool_content?: string | null;
    observation_content?: string | null;
    thought_content?: string | null;
    safe_mode?: boolean;
    random_seed?: number;
    tools?: Array<{
        type: 'function';
        function: {
            name: string;
            description?: string;
            parameters?: Record<string, unknown>;
        };
    }>;
}
export type AnthropicExtension = BasePlatformExtension;
export type ClaudeExtension = BasePlatformExtension;
export type PlatformExtensions = DeepseekExtension & Partial<AnthropicExtension> & Partial<ClaudeExtension>;
export type ExtendedDelta = {
    content?: string | null;
    role?: ChatCompletionRole;
    tool_calls?: Array<{
        index: number;
        id?: string;
        function?: {
            name?: string;
            arguments?: string;
        };
        type?: 'function';
    }>;
} & PlatformExtensions;
export interface ExtendedChoice {
    index: number;
    delta: ExtendedDelta;
    finish_reason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'function_call' | null;
    logprobs: null;
}
export interface ExtendedChatCompletionChunk extends Omit<ChatCompletionChunk, 'choices' | 'object'> {
    id: string;
    created: number;
    model: string;
    choices: ExtendedChoice[];
    object: 'chat.completion.chunk';
}
export declare function isPlatformChunk<T extends PlatformExtensions>(chunk: ExtendedChatCompletionChunk | OpenAIChatCompletionChunk, field: keyof T): chunk is ExtendedChatCompletionChunk & {
    choices: Array<{
        delta: T;
    }>;
};
export declare function isDeepseekChunk(chunk: ExtendedChatCompletionChunk | OpenAIChatCompletionChunk): chunk is ExtendedChatCompletionChunk & {
    choices: Array<{
        delta: DeepseekExtension;
    }>;
};
//# sourceMappingURL=openai-extended.d.ts.map