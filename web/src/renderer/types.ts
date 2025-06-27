// ========================================
// [插件系统已禁用] - 插件系统尚未完善，暂时停止开发
// 本文件保留渲染器类型定义，供后续恢复使用
// 如需恢复插件功能，请完善插件系统实现
// ========================================

// [插件系统已禁用] - 注释掉插件类型导入
// import type { Plugin } from '@engine/types/plugin';

// 已从 engine/render/types.ts 移动至 web/src/renderer/types.ts，UI 渲染相关类型应只在 web 端维护。
export interface ContentRenderer {
  name: string;
  priority: number;
  test: (content: string) => boolean;
  render: (content: string) => Promise<string> | string;
}

// [插件系统已禁用] - 保留接口定义，但注释掉插件相关字段
/*
export interface RenderContext {
  plugins: Plugin[];
  pluginConfigs: Record<string, Record<string, unknown>>;
}
*/

// [插件系统已禁用] - 使用空接口，防止类型错误
export interface RenderContext {
  plugins: any[];
  pluginConfigs: Record<string, Record<string, unknown>>;
}

// [插件系统已禁用] - 保留接口定义，但注释掉插件相关字段
/*
export interface RendererOptions {
  plugins?: Plugin[];
  pluginConfigs?: Record<string, Record<string, unknown>>;
}
*/

// [插件系统已禁用] - 使用空接口，防止类型错误
export interface RendererOptions {
  plugins?: any[];
  pluginConfigs?: Record<string, Record<string, unknown>>;
}
