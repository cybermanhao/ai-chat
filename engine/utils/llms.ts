// 多端同构 LLM 配置列表，纯数据与类型定义
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

export const llms: LLMConfig[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    provider: 'DeepSeek',
    isOpenAICompatible: true,
    description: '深度求索推出的大模型，擅长中文和代码',
    website: 'https://www.deepseek.com',
    userToken: '',
    userModel: 'deepseek-chat'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    provider: 'OpenAI',
    isOpenAICompatible: true,
    description: 'OpenAI官方API',
    website: 'https://openai.com',
    userToken: '',
    userModel: 'gpt-4-turbo'
  },
  // ...可继续补充其它模型，保持与 web/src/utils/llms/llms.ts 同步 ...
];
