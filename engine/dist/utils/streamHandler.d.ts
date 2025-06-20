import type { StreamChunk } from '../types/chat';
import type { ExtendedChatCompletionChunk } from '../types/openai-extended';
export interface CompletionResult {
    content: string;
    reasoning_content?: string;
    tool_content?: string;
    observation_content?: string;
    thought_content?: string;
}
export declare function handleResponseStream(stream: AsyncIterable<ExtendedChatCompletionChunk>, onChunk?: (chunk: StreamChunk) => void | Promise<void>, onDone?: (result: CompletionResult) => void | Promise<void>): Promise<void>;
export declare function streamHandler(response: Response): AsyncGenerator<ExtendedChatCompletionChunk, void, unknown>;
//# sourceMappingURL=streamHandler.d.ts.map