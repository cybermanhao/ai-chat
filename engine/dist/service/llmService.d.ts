import { OpenAI } from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { ChatMessage } from '../types/chat';
import type { ModelConfig } from '../types/model';
import type { Stream } from 'openai/streaming';
import type { ExtendedChatCompletionChunk } from '../types/openai-extended';
import type { LLMConfig } from '../types/llm';
export declare class LLMService {
    protected getDangerouslyAllowBrowser(): boolean;
    protected createClient(config: LLMConfig): OpenAI;
    protected formatMessages(messages: Array<ChatMessage>): ChatCompletionMessageParam[];
    generate(messages: ChatMessage[], modelConfig: ModelConfig, llmConfig: LLMConfig, signal?: AbortSignal): Promise<Stream<ExtendedChatCompletionChunk>>;
    protected getErrorMessage(error: Error): string;
    protected getErrorCode(error: Error): string;
    abortCurrentStream(): void;
}
export declare const getCurrentStream: () => AbortController | null;
//# sourceMappingURL=llmService.d.ts.map