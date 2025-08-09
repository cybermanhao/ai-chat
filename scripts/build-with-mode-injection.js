#!/usr/bin/env node

/**
 * 支持构建时注入BUILD_MODE的构建脚本
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function log(message, type = 'info') {
  const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
  console.log(`${prefix} ${message}`);
}

/**
 * 在源文件中注入BUILD_MODE
 * @param {string} buildMode - 要注入的模式 ('web' | 'ssc' | 'electron')
 * @param {string} sourceDir - 源码目录
 * @param {string} tempDir - 临时目录
 */
function injectBuildMode(buildMode, sourceDir, tempDir) {
  const runtimeContextPath = path.join(sourceDir, 'utils/runtimeContext.ts');
  const tempRuntimeContextPath = path.join(tempDir, 'utils/runtimeContext.ts');
  
  if (!fs.existsSync(runtimeContextPath)) {
    throw new Error(`runtimeContext.ts not found at ${runtimeContextPath}`);
  }
  
  // 创建临时目录结构
  fs.mkdirSync(path.dirname(tempRuntimeContextPath), { recursive: true });
  
  // 读取原始文件
  let content = fs.readFileSync(runtimeContextPath, 'utf8');
  
  // 替换BUILD_MODE
  const originalLine = /const BUILD_MODE: RuntimeMode \| null = null;/;
  const replacementLine = `const BUILD_MODE: RuntimeMode | null = '${buildMode}';`;
  
  if (!originalLine.test(content)) {
    throw new Error('BUILD_MODE declaration not found in runtimeContext.ts');
  }
  
  content = content.replace(originalLine, replacementLine);
  
  // 写入临时文件
  fs.writeFileSync(tempRuntimeContextPath, content);
  log(`BUILD_MODE注入完成: ${buildMode} -> ${tempRuntimeContextPath}`);
}

/**
 * 复制除runtimeContext.ts外的所有文件
 * @param {string} src - 源目录
 * @param {string} dest - 目标目录
 * @param {string} skipFile - 要跳过的文件路径（相对于src）
 */
function copyWithSkip(src, dest, skipFile) {
  function copyRecursive(currentSrc, currentDest) {
    const stat = fs.statSync(currentSrc);
    
    if (stat.isDirectory()) {
      if (!fs.existsSync(currentDest)) {
        fs.mkdirSync(currentDest, { recursive: true });
      }
      
      fs.readdirSync(currentSrc).forEach(item => {
        copyRecursive(
          path.join(currentSrc, item),
          path.join(currentDest, item)
        );
      });
    } else {
      // 检查是否是要跳过的文件
      const relativePath = path.relative(src, currentSrc);
      if (relativePath === skipFile) {
        log(`跳过文件: ${relativePath}`);
        return;
      }
      
      fs.copyFileSync(currentSrc, currentDest);
    }
  }
  
  copyRecursive(src, dest);
}

/**
 * 构建指定模式
 * @param {string} buildMode - 构建模式
 * @param {string} outputDir - 输出目录
 */
export function buildWithModeInjection(buildMode, outputDir = null) {
  log(`🚀 开始构建 ${buildMode.toUpperCase()} 模式...`);
  
  const projectRoot = path.join(__dirname, '..');
  const engineDir = path.join(projectRoot, 'engine');
  const tempDir = path.join(projectRoot, `temp-build-${buildMode}`);
  const finalOutputDir = outputDir || path.join(projectRoot, `dist/${buildMode}`);
  
  try {
    // 1. 清理临时目录
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });
    
    // 2. 复制engine源码到临时目录（除了runtimeContext.ts）
    log('📂 复制源码到临时目录...');
    copyWithSkip(engineDir, tempDir, 'utils/runtimeContext.ts');
    
    // 3. 注入BUILD_MODE到runtimeContext.ts
    log(`🔧 注入BUILD_MODE: ${buildMode}`);
    injectBuildMode(buildMode, engineDir, tempDir);
    
    // 4. 复制tsconfig.json
    fs.copyFileSync(
      path.join(engineDir, 'tsconfig.json'),
      path.join(tempDir, 'tsconfig.json')
    );
    
    // 5. 执行TypeScript构建
    log('🔨 执行TypeScript构建...');
    execSync(`npx tsc --project ${tempDir}/tsconfig.json --outDir ${finalOutputDir}`, {
      stdio: 'inherit',
      cwd: projectRoot
    });
    
    // 6. 清理临时目录
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    log(`✅ ${buildMode.toUpperCase()} 模式构建完成！`);
    log(`📁 输出目录: ${finalOutputDir}`);
    
    return finalOutputDir;
    
  } catch (error) {
    // 清理临时目录
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    
    log(`构建失败: ${error.message}`, 'error');
    throw error;
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  const buildMode = process.argv[2] || 'web';
  const outputDir = process.argv[3];
  
  try {
    buildWithModeInjection(buildMode, outputDir);
  } catch (error) {
    process.exit(1);
  }
}