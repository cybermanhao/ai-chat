// ========================================
// [插件系统已禁用] - 插件系统尚未完善，暂时停止开发
// 本文件保留插件类型定义，供后续恢复使用
// 如需恢复插件功能，请完善插件系统实现
// ========================================

// XML 标签定义
export interface XMLTag {
  description: string;
  allowedAttributes?: string[];
  render: (content: string, attributes: Record<string, string>) => string;
}

// 插件定义接口
export interface Plugin {
  id: string;          // 插件唯一标识
  name: string;        // 插件名称
  description: string; // 插件描述
  version: string;     // 插件版本
  author: string;      // 插件作者
  enabled: boolean;    // 插件是否启用
  
  // XML 标签定义
  xmlTags: {
    [tagName: string]: XMLTag;
  };
  
  // 插件配置
  config?: Record<string, unknown>;
  configSchema?: {
    type: string;
    properties: Record<string, {
      type: string;
      description: string;
      default?: unknown;
    }>;
  };
  
  // 系统提示词
  systemPrompt?: string;
}

// 插件配置值类型
export type PluginConfigValue = string | number | boolean | null | undefined;

// 插件配置接口
export interface PluginConfig {
  enabled: boolean;
  [key: string]: PluginConfigValue;
}
