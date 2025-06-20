export interface ProviderConfig {
    apiKey?: string;
    defaultModel?: string;
}
export interface Config {
    providers: {
        [provider: string]: ProviderConfig;
    };
}
//# sourceMappingURL=config.d.ts.map