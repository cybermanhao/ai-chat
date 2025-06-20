// 通用配置类型，供 web 端和 engine 端复用
export interface ProviderConfig {
  apiKey?: string;
  defaultModel?: string;
}

export interface Config {
  providers: {
    [provider: string]: ProviderConfig;
  };
}
