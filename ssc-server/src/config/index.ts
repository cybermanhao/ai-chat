// SSC Server - 简单的环境变量配置
import * as dotenv from 'dotenv';

// 加载 .env 文件
dotenv.config();

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  allowedOrigins: string[];
  logLevel: string;
  maxTokens: number;
  requestTimeout: number;
}

export interface LLMProvider {
  name: string;
  baseURL: string;
  apiKey: string;
  enabled: boolean;
}

export interface MCPConfig {
  serverUrl: string;
  enabled: boolean;
}

// 服务器配置
export const serverConfig: ServerConfig = {
  port: parseInt(process.env.PORT || '8080'),
  nodeEnv: process.env.NODE_ENV || 'development',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(','),
  logLevel: process.env.LOG_LEVEL || 'info',
  maxTokens: parseInt(process.env.MAX_TOKENS || '4000'),
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000'),
};

// LLM 提供商配置
export const llmProviders: Record<string, LLMProvider> = {
  deepseek: {
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    enabled: !!process.env.DEEPSEEK_API_KEY,
  },
  openai: {
    name: 'OpenAI', 
    baseURL: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY || '',
    enabled: !!process.env.OPENAI_API_KEY,
  },
  qwen: {
    name: 'Qwen',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKey: process.env.QWEN_API_KEY || '',
    enabled: !!process.env.QWEN_API_KEY,
  },
  claude: {
    name: 'Claude',
    baseURL: 'https://api.anthropic.com/v1',
    apiKey: process.env.CLAUDE_API_KEY || '',  
    enabled: !!process.env.CLAUDE_API_KEY,
  },
};

// 默认提供商
export const defaultProvider = process.env.DEFAULT_LLM_PROVIDER || 'deepseek';

// MCP 配置
export const mcpConfig: MCPConfig = {
  serverUrl: process.env.MCP_SERVER_URL || 'http://localhost:3001',
  enabled: process.env.MCP_SERVER_ENABLED === 'true',
};

// 根据模型名获取提供商配置
export function getProviderForModel(model: string): LLMProvider | null {
  // 模型到提供商的映射
  const modelToProvider: Record<string, string> = {
    'deepseek-chat': 'deepseek',
    'deepseek-coder': 'deepseek',
    'gpt-4': 'openai',
    'gpt-4-turbo': 'openai', 
    'gpt-3.5-turbo': 'openai',
    'qwen-turbo': 'qwen',
    'qwen-plus': 'qwen',
    'qwen-max': 'qwen',
    'claude-3-5-sonnet-20241022': 'claude',
    'claude-3-haiku-20240307': 'claude',
  };

  const providerId = modelToProvider[model];
  if (providerId && llmProviders[providerId]?.enabled) {
    return llmProviders[providerId];
  }

  return null;
}

// 获取默认提供商
export function getDefaultProvider(): LLMProvider | null {
  const provider = llmProviders[defaultProvider];
  if (provider?.enabled) {
    return provider;
  }

  // 如果默认提供商不可用，返回第一个可用的
  for (const provider of Object.values(llmProviders)) {
    if (provider.enabled) {
      return provider;
    }
  }

  return null;
}

// 验证配置
export function validateConfig(): void {
  console.log(`[Config] SSC Server 启动配置:`);
  console.log(`  端口: ${serverConfig.port}`);
  console.log(`  环境: ${serverConfig.nodeEnv}`);
  console.log(`  允许的来源: ${serverConfig.allowedOrigins.join(', ')}`);
  
  const enabledProviders = Object.entries(llmProviders)
    .filter(([, provider]) => provider.enabled);
  
  if (enabledProviders.length === 0) {
    console.error(`[Config] 错误: 没有配置可用的LLM提供商!`);
    console.error(`[Config] 请在 .env 文件中配置至少一个 API Key:`);
    console.error(`  DEEPSEEK_API_KEY=sk-...`);
    console.error(`  OPENAI_API_KEY=sk-...`);
    process.exit(1);
  }

  console.log(`[Config] 可用的LLM提供商 (${enabledProviders.length}):`);
  enabledProviders.forEach(([id, provider]) => {
    console.log(`  - ${provider.name} (${id})`);
  });

  const defaultProv = getDefaultProvider();
  if (defaultProv) {
    console.log(`[Config] 默认提供商: ${defaultProv.name}`);
  }

  if (mcpConfig.enabled) {
    console.log(`[Config] MCP服务器: ${mcpConfig.serverUrl}`);
  } else {
    console.log(`[Config] MCP服务器: 已禁用`);
  }
}