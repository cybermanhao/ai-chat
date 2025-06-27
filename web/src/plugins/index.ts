// ========================================
// [插件系统已禁用] - 插件系统尚未完善，暂时停止开发
// 本文件保留插件定义和类型，但注释掉插件导出和注册逻辑
// 如需恢复插件功能，请取消相关注释并完善插件系统实现
// ========================================

// [插件系统已禁用] - 注释掉插件导入和导出
// import type { Tool } from '@/types/tool';
// import { buttonPlugin } from './button';

// [插件系统已禁用] - 注释掉插件工具列表导出
// Define available tools
// export const tools: Tool[] = [
//   {
//     ...buttonPlugin,
//     description: '渲染可交互按钮组件',
//   },
// ];

// [插件系统已禁用] - 导出空数组，防止其他模块引用出错
export const tools: any[] = [];
