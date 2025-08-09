// 运行时上下文管理 - 集中化环境判断和配置
// 替代分散的环境判断逻辑，提供统一的上下文管理

export type RuntimeMode = 'electron-main' | 'electron-renderer' | 'web' | 'ssc' | 'ssc-server' | 'node-server';
export type ProcessType = 'main' | 'renderer' | 'browser' | 'node';

export interface RuntimeContext {
  mode: RuntimeMode;
  processType: ProcessType;
  capabilities: RuntimeCapabilities;
  config: RuntimeConfig;
}

export interface RuntimeCapabilities {
  // LLM能力
  canCallLLMDirectly: boolean;      // 能否直接调用LLM API
  needsLLMProxy: boolean;           // 是否需要LLM代理
  llmProxyType: 'ipc' | 'http' | null;

  // MCP能力  
  canCallMCPDirectly: boolean;      // 能否直接调用MCP服务
  needsMCPProxy: boolean;           // 是否需要MCP代理
  mcpProxyType: 'ipc' | 'http' | null;

  // 存储能力
  hasLocalStorage: boolean;         // 是否有localStorage
  hasFileSystem: boolean;           // 是否有文件系统访问
  
  // 网络能力
  canMakeHTTPRequests: boolean;     // 是否能发起HTTP请求
  canUseSSE: boolean;               // 是否支持SSE
}

export interface RuntimeConfig {
  sscApiBaseUrl?: string;
  electronAPI?: any;
  nodeServerAPI?: any;
  buildMode?: RuntimeMode | null;
}

// 构建时模式注入点 - 打包SDK时会被替换为'ssc'
const BUILD_MODE: RuntimeMode | null = null;

class RuntimeContextManager {
  private _context: RuntimeContext | null = null;

  get context(): RuntimeContext {
    if (!this._context) {
      this._context = this.detectRuntimeContext();
    }
    return this._context;
  }

  // 强制重新检测（用于测试或特殊场景）
  refresh(): RuntimeContext {
    this._context = null;
    return this.context;
  }

  // 手动设置上下文（用于测试）
  setContext(context: Partial<RuntimeContext>): void {
    this._context = {
      ...this.context,
      ...context,
    };
  }

  private detectRuntimeContext(): RuntimeContext {
    const mode = this.detectRuntimeMode();
    const processType = this.detectProcessType();
    const capabilities = this.detectCapabilities(mode, processType);
    const config = this.detectConfig();

    return {
      mode,
      processType,
      capabilities,
      config,
    };
  }

  private detectRuntimeMode(): RuntimeMode {
    // 1. 构建时指定的模式优先级最高
    if (BUILD_MODE) {
      return BUILD_MODE;
    }

    // 2. 运行时检测
    // Electron 检测
    if (typeof process !== 'undefined' && process.versions?.electron) {
      if ((process as any).type === 'browser') {
        return 'electron-main';
      }
      // 在Electron渲染进程中，window.process.type === 'renderer'
      if (typeof window !== 'undefined' && (window as any).process?.type === 'renderer') {
        return 'electron-renderer';
      }
    }

    // Electron渲染进程的另一种检测方式
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      return 'electron-renderer';
    }

    // Node.js服务器环境
    if (typeof window !== 'undefined' && (window as any).NODE_SERVER_API) {
      return 'node-server';
    }

    // SSC模式检测
    if (typeof process !== 'undefined' && process.env.SSC_MODE === 'true') {
      return 'ssc';
    }

    // 通过全局变量检测SSC模式
    if (typeof globalThis !== 'undefined' && (globalThis as any).SSC_MODE === true) {
      return 'ssc';
    }

    // 默认Web模式
    return 'web';
  }

  private detectProcessType(): ProcessType {
    if (typeof process !== 'undefined' && process.versions?.node) {
      if ((process as any).type === 'browser') {
        return 'main';
      }
      return 'node';
    }

    if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
      if ((window as any).process?.type === 'renderer') {
        return 'renderer';
      }
      return 'browser';
    }

    return 'node';
  }

  private detectCapabilities(mode: RuntimeMode, processType: ProcessType): RuntimeCapabilities {
    const capabilities: RuntimeCapabilities = {
      canCallLLMDirectly: false,
      needsLLMProxy: false,
      llmProxyType: null,
      canCallMCPDirectly: false,
      needsMCPProxy: false,
      mcpProxyType: null,
      hasLocalStorage: false,
      hasFileSystem: false,
      canMakeHTTPRequests: false,
      canUseSSE: false,
    };

    switch (mode) {
      case 'web':
        capabilities.canCallLLMDirectly = true;
        capabilities.canCallMCPDirectly = true;
        capabilities.hasLocalStorage = true;
        capabilities.canMakeHTTPRequests = true;
        capabilities.canUseSSE = true;
        break;

      case 'electron-main':
        capabilities.canCallLLMDirectly = true;
        capabilities.canCallMCPDirectly = true;
        capabilities.hasFileSystem = true;
        capabilities.canMakeHTTPRequests = true;
        break;

      case 'electron-renderer':
        capabilities.needsLLMProxy = true;
        capabilities.llmProxyType = 'ipc';
        capabilities.needsMCPProxy = true;
        capabilities.mcpProxyType = 'ipc';
        capabilities.hasLocalStorage = true;
        capabilities.canMakeHTTPRequests = true;
        break;

      case 'ssc':
        capabilities.needsLLMProxy = true;
        capabilities.llmProxyType = 'http';
        capabilities.needsMCPProxy = true;
        capabilities.mcpProxyType = 'http';
        capabilities.canMakeHTTPRequests = true;
        capabilities.canUseSSE = true;
        capabilities.hasLocalStorage = typeof window !== 'undefined';
        break;

      case 'node-server':
        capabilities.needsLLMProxy = true;
        capabilities.llmProxyType = 'http';
        capabilities.needsMCPProxy = true;
        capabilities.mcpProxyType = 'http';
        capabilities.hasFileSystem = true;
        capabilities.canMakeHTTPRequests = true;
        break;
    }

    return capabilities;
  }

  private detectConfig(): RuntimeConfig {
    const config: RuntimeConfig = {};

    // SSC API配置
    config.sscApiBaseUrl = (globalThis as any).SSC_API_BASE_URL || 
                          (typeof process !== 'undefined' && process.env?.SSC_API_BASE_URL) || 
                          'http://localhost:8080';

    // Electron API
    if (typeof window !== 'undefined') {
      config.electronAPI = (window as any).electronAPI;
      config.nodeServerAPI = (window as any).NODE_SERVER_API;
    }

    // 构建模式
    config.buildMode = BUILD_MODE;

    return config;
  }
}

// 单例实例
export const runtimeContext = new RuntimeContextManager();

// 便捷方法
export function getRuntimeContext(): RuntimeContext {
  return runtimeContext.context;
}

export function getRuntimeMode(): RuntimeMode {
  return runtimeContext.context.mode;
}

export function getCapabilities(): RuntimeCapabilities {
  return runtimeContext.context.capabilities;
}

export function getConfig(): RuntimeConfig {
  return runtimeContext.context.config;
}

// 类型守卫
export function isElectronMain(): boolean {
  return getRuntimeMode() === 'electron-main';
}

export function isElectronRenderer(): boolean {
  return getRuntimeMode() === 'electron-renderer';
}

export function isWeb(): boolean {
  return getRuntimeMode() === 'web';
}

export function isSSC(): boolean {
  return getRuntimeMode() === 'ssc';
}

export function isNodeServer(): boolean {
  return getRuntimeMode() === 'node-server';
}

// 能力检查
export function canCallLLMDirectly(): boolean {
  return getCapabilities().canCallLLMDirectly;
}

export function needsLLMProxy(): boolean {
  return getCapabilities().needsLLMProxy;
}

export function getLLMProxyType(): 'ipc' | 'http' | null {
  return getCapabilities().llmProxyType;
}

export function canCallMCPDirectly(): boolean {
  return getCapabilities().canCallMCPDirectly;
}

export function needsMCPProxy(): boolean {
  return getCapabilities().needsMCPProxy;
}

export function getMCPProxyType(): 'ipc' | 'http' | null {
  return getCapabilities().mcpProxyType;
}

// 调试信息
export function getDebugInfo(): any {
  const context = getRuntimeContext();
  return {
    ...context,
    detectionInfo: {
      hasWindow: typeof window !== 'undefined',
      hasProcess: typeof process !== 'undefined',
      hasElectronAPI: typeof window !== 'undefined' && !!(window as any).electronAPI,
      processType: typeof process !== 'undefined' ? (process as any).type : 'none',
      electronVersions: typeof process !== 'undefined' ? process.versions?.electron : 'none',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'none',
      buildMode: BUILD_MODE,
    },
  };
}