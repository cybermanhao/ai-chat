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
 * - import { getRuntimeMode } from '../utils/runtimeContext'
 * 
 * 迁移时间：2025-01-09
 * ================================================================================
 */

// 错误提示：引导用户使用新的 runtimeContext 系统
console.warn(
  '⚠️ engine/stream/envDetect.ts 已废弃！请使用 runtimeContext.ts 系统'
);

// 为了兼容性，重新导出 runtimeContext 的功能
export { getRuntimeMode as detectRuntimeMode } from '../utils/runtimeContext';
export { isElectronMain as isElectron } from '../utils/runtimeContext';
export { isWeb } from '../utils/runtimeContext';
export { isSSC } from '../utils/runtimeContext';
export type { RuntimeMode } from '../utils/runtimeContext';

// 废弃的旧函数，保留以防破坏现有代码
export function getEnvInfo() {
  console.warn('⚠️ getEnvInfo() 已废弃，请使用 runtimeContext.getDebugInfo()');
  const { getDebugInfo } = require('../utils/runtimeContext');
  return getDebugInfo();
}