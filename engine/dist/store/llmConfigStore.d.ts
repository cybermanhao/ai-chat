import type { LLMConfigState } from '../types/llm';
export declare const llmConfigStoreDefinition: (set: any) => {
    activeLLMId: string | null;
    configs: LLMConfigState["configs"];
    setActiveLLM: (llmId: string) => any;
    updateConfig: (llmId: string, config: any) => any;
    resetConfig: (llmId: string) => any;
};
export declare const useLLMConfigStore: () => never;
//# sourceMappingURL=llmConfigStore.d.ts.map