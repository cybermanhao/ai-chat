import type { ModelConfig } from '../types/model';
export interface ModelConfigState {
    config: ModelConfig;
    loading: Record<string, boolean>;
    setConfig: (config: Partial<ModelConfig> | ((prev: ModelConfig) => Partial<ModelConfig>)) => void;
    setLoading: (key: string, loading: boolean) => void;
}
export declare const defaultModelConfig: ModelConfig;
export declare const modelConfigStoreDefinition: (set: any) => {
    config: ModelConfig;
    loading: {};
    setConfig: (update: Partial<ModelConfig> | ((prev: ModelConfig) => Partial<ModelConfig>)) => any;
    setLoading: (key: string, loading: boolean) => any;
};
export declare const useModelConfigStore: () => never;
//# sourceMappingURL=modelConfigStore.d.ts.map