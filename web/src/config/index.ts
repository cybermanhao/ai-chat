import { type Config } from '@/types';

export const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

export const config: Config = {
  providers: {
    deepseek: {
      apiKey: DEEPSEEK_API_KEY,
      defaultModel: 'deepseek-chat'
    }
  }
};

export function getConfig(): Config {
  return config;
}

export default config;
