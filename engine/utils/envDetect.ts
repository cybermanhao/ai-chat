/**
 * ================================================================================
 * 注意：此文件已被废弃，迁移到 runtimeContext 系统
 * ================================================================================
 * 
 * 迁移说明：
 * - 旧系统：envDetect.ts (V1)
 * - 新系统：runtimeContext.ts (V2)
 * 
 * 请使用新的 runtimeContext 系统：
 * - import { getRuntimeMode, isWeb, isSSC } from './runtimeContext'
 * 
 * 迁移时间：2025-01-09
 * ================================================================================
 */

// 错误提示：引导用户使用新的 runtimeContext 系统
console.warn(
  '⚠️ engine/utils/envDetect.ts 已废弃！请使用 runtimeContext.ts 系统'
);

// 为了兼容性，重新导出 runtimeContext 的功能
export { getRuntimeMode as detectRuntimeMode } from './runtimeContext';
export { isElectronMain as isElectron } from './runtimeContext';
export { isNodeServer } from './runtimeContext';
export { isWeb } from './runtimeContext';
export { isSSC } from './runtimeContext';
export type { RuntimeMode } from './runtimeContext';

// 废弃的旧函数，保留以防破坏现有代码
export function getEnvInfo() {
  console.warn('⚠️ getEnvInfo() 已废弃，请使用 runtimeContext.getDebugInfo()');
  const { getDebugInfo } = require('./runtimeContext');
  return getDebugInfo();
}

export function isBrowser() {
  console.warn('⚠️ isBrowser() 已废弃，请使用 runtimeContext 系统');
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

export function isNode() {
  console.warn('⚠️ isNode() 已废弃，请使用 runtimeContext 系统');
  return typeof process !== 'undefined' && typeof process.versions !== 'undefined' && !!process.versions.node;
}

export function isElectronMain() {
  console.warn('⚠️ isElectronMain() 已废弃，请使用 runtimeContext.isElectronMain()');
  const { isElectronMain } = require('./runtimeContext');
  return isElectronMain();
}

export function isElectronRenderer() {
  console.warn('⚠️ isElectronRenderer() 已废弃，请使用 runtimeContext.isElectronRenderer()');
  const { isElectronRenderer } = require('./runtimeContext');
  return isElectronRenderer();
}