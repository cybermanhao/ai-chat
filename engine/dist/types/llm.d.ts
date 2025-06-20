export interface LLM {
    id: string;
    name: string;
    baseUrl: string;
    models: string[];
    provider: string;
    isOpenAICompatible: boolean;
    description: string;
    website: string;
    userToken: string;
    userModel: string;
}
export interface LLMConfig {
    apiKey?: string;
    baseUrl: string;
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
    tools?: import('openai/resources/chat/completions').ChatCompletionCreateParams['tools'];
    parallelToolCalls?: boolean;
}
export interface LLMConfigState {
    activeLLMId: string | null;
    configs: Record<string, LLMConfig>;
    setActiveLLM?: (llmId: string | null) => void;
    updateConfig?: (llmId: string, config: Partial<LLMConfig>) => void;
    resetConfig?: (llmId: string) => void;
}
export declare const defaultLLMConfig: LLMConfig;
//# sourceMappingURL=llm.d.ts.map