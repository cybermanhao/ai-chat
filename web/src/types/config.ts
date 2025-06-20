export interface ProviderConfig {
  apiKey: string | undefined;
  defaultModel: string;
}

export interface Config {
  providers: {
    deepseek: ProviderConfig;
    [key: string]: ProviderConfig;
  };
}

export type DeepseekConfig = ProviderConfig;
