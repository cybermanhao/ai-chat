export interface LLMConfig {
    id: string;
    name: string;
    baseUrl: string;
    models: string[];
    provider: string;
    isOpenAICompatible: boolean;
    description: string;
    website: string;
    userToken?: string;
    userModel?: string;
}
export declare const llms: LLMConfig[];
//# sourceMappingURL=llms.d.ts.map