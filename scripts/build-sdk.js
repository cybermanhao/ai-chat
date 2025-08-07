#!/usr/bin/env node

/**
 * TaskLoop SDK构建脚本
 * 用于构建SSC模式的客户端SDK
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 开始构建TaskLoop SDK (SSC模式)...');

// 构建配置
const BUILD_CONFIG = {
  sdkName: '@zz-ai-chat/taskloop-sdk',
  sdkVersion: '1.0.0',
  outputDir: path.join(__dirname, '../dist/sdk'),
  engineDistDir: path.join(__dirname, '../engine/dist'),
  cleanBeforeBuild: true
};

// 工具函数
function log(message, type = 'info') {
  const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : '✅';
  console.log(`${prefix} ${message}`);
}

function cleanDirectory(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    log(`清理目录: ${dir}`);
  }
}

function copyRecursive(src, dest) {
  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(item => {
      copyRecursive(path.join(src, item), path.join(dest, item));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  // 1. 创建SDK入口文件
  log('📝 创建SDK入口文件...');
  const sdkEntryContent = `// TaskLoop SDK for SSC Mode
// 专门为SSC环境构建的客户端SDK
// 构建时间: ${new Date().toISOString()}

// 核心导出
export { TaskLoop } from './stream/task-loop';
export type { TaskLoopEvent } from './stream/task-loop';
export type { EnrichedMessage, IMessageCardStatus } from './types/chat';
export type { ToolCall, EnhancedChunk } from './stream/streamHandler';

// MCP相关
export { MCPClient } from './service/mcpClient';
export type { Tool } from './service/mcpClient';

// 工具函数
export { generateUserMessageId } from './utils/messageIdGenerator';

// SDK配置和工厂函数
import { TaskLoop } from './stream/task-loop';

/**
 * SSC模式TaskLoop配置
 * 注意：不需要apiKey，由SSC后端管理
 */
export interface SSCTaskLoopConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  tools?: any[];
  parallelToolCalls?: boolean;
  /** SSC后端API地址，默认http://localhost:8080 */
  sscApiBaseUrl?: string;
}

export interface SSCTaskLoopOptions {
  chatId: string;
  history?: any[];
  config: SSCTaskLoopConfig;
  mcpClient?: any;
}

/**
 * 创建SSC模式TaskLoop
 * 推荐的SDK使用方式
 */
export function createTaskLoop(options: SSCTaskLoopOptions): TaskLoop {
  // 设置SSC API地址（兼容浏览器和Node环境）
  if (options.config.sscApiBaseUrl) {
    // 设置到globalThis（浏览器环境）
    if (typeof globalThis !== 'undefined') {
      (globalThis as any).SSC_API_BASE_URL = options.config.sscApiBaseUrl;
    }
    // 设置到process.env（Node环境）
    if (typeof process !== 'undefined' && process.env) {
      process.env.SSC_API_BASE_URL = options.config.sscApiBaseUrl;
    }
  }
  
  return new TaskLoop({
    chatId: options.chatId,
    history: options.history,
    config: {
      ...options.config,
      // 移除客户端不需要的配置
      apiKey: undefined,
      baseURL: undefined,
    },
    mcpClient: options.mcpClient,
  });
}

export const SDK_VERSION = '${BUILD_CONFIG.sdkVersion}';
export const SDK_MODE = 'ssc';
export const SDK_BUILD_TIME = '${new Date().toISOString()}';
`;

  const sdkEntryPath = path.join(__dirname, '../engine/sdk-entry.ts');
  fs.writeFileSync(sdkEntryPath, sdkEntryContent);
  log('SDK入口文件已创建');

  // 2. 执行TypeScript构建（ES模块格式）
  log('🔨 执行TypeScript构建（ES模块）...');
  try {
    execSync('npx tsc --project engine/tsconfig.json --module ESNext --target ES2020', { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    log('TypeScript构建完成（ES模块格式）');
  } catch (error) {
    throw new Error(`TypeScript构建失败: ${error.message}`);
  }

  // 3. 创建SDK包结构
  log('📦 创建SDK包结构...');
  
  // 清理输出目录
  if (BUILD_CONFIG.cleanBeforeBuild) {
    cleanDirectory(BUILD_CONFIG.outputDir);
  }
  
  // 创建输出目录
  fs.mkdirSync(BUILD_CONFIG.outputDir, { recursive: true });

  // 复制构建产物到SDK目录
  if (fs.existsSync(BUILD_CONFIG.engineDistDir)) {
    copyRecursive(BUILD_CONFIG.engineDistDir, BUILD_CONFIG.outputDir);
    log('构建产物已复制到SDK目录');
  } else {
    throw new Error(`构建产物目录不存在: ${BUILD_CONFIG.engineDistDir}`);
  }

  // 创建SDK的package.json
  const sdkPackageJson = {
    "name": BUILD_CONFIG.sdkName,
    "version": BUILD_CONFIG.sdkVersion,
    "description": "TaskLoop SDK for SSC mode",
    "type": "module",
    "main": "index.js",
    "types": "index.d.ts",
    "exports": {
      ".": {
        "import": "./index.js",
        "types": "./index.d.ts"
      }
    },
    "files": ["**/*"],
    "keywords": ["taskloop", "ssc", "llm", "mcp", "ai", "chat"],
    "license": "MIT",
    "engines": {
      "node": ">=18.0.0"
    },
    "repository": {
      "type": "git",
      "url": "https://github.com/your-org/zz-ai-chat.git"
    },
    "bugs": {
      "url": "https://github.com/your-org/zz-ai-chat/issues"
    },
    "homepage": "https://github.com/your-org/zz-ai-chat#readme"
  };

  fs.writeFileSync(
    path.join(BUILD_CONFIG.outputDir, 'package.json'), 
    JSON.stringify(sdkPackageJson, null, 2)
  );

  // 创建SDK专用的index.js（ES模块格式）
  const sdkIndexContent = `// TaskLoop SDK - 主入口文件（ES模块）
// 重新导出sdk-entry的所有内容
export * from './sdk-entry.js';
`;
  
  fs.writeFileSync(
    path.join(BUILD_CONFIG.outputDir, 'index.js'),
    sdkIndexContent
  );

  // 创建SDK专用的index.d.ts
  const sdkIndexTypes = `// TaskLoop SDK - 主入口类型定义
// 重新导出sdk-entry的所有类型
export * from './sdk-entry';
`;
  
  fs.writeFileSync(
    path.join(BUILD_CONFIG.outputDir, 'index.d.ts'),
    sdkIndexTypes
  );

  // 创建README文件
  const readmeContent = `# TaskLoop SDK

TaskLoop SDK for SSC (server-side-clientputing) mode.

## 安装

\`\`\`bash
npm install ${BUILD_CONFIG.sdkName}
\`\`\`

## 使用方式

\`\`\`typescript
import { createTaskLoop } from '${BUILD_CONFIG.sdkName}';

const taskLoop = createTaskLoop({
  chatId: 'my-chat',
  config: {
    model: 'deepseek-chat',
    sscApiBaseUrl: 'http://localhost:8080'
  }
});

taskLoop.subscribe(event => {
  console.log('收到事件:', event);
});

taskLoop.start('你好！');
\`\`\`

## 版本信息

- SDK版本: ${BUILD_CONFIG.sdkVersion}
- 构建模式: SSC
- 构建时间: ${new Date().toISOString()}

## 高级用法：直接使用 messageBridge

SDK 默认导出 messageBridge 实例，适合需要自定义 MCP 服务连接、断开、事件监听等高级场景。

\`\`\`typescript
import { messageBridge } from '@zz-ai-chat/taskloop-sdk';

// 连接 MCP 服务
messageBridge.connectMCP(serverId, url);
messageBridge.on('done', payload => {
  // 连接成功回调
});
messageBridge.on('error', payload => {
  // 连接失败回调
});

// 断开 MCP 服务
messageBridge.disconnectMCP(serverId);
\`\`\`
`;

  fs.writeFileSync(
    path.join(BUILD_CONFIG.outputDir, 'README.md'),
    readmeContent
  );

  log('🎉 TaskLoop SDK构建完成！');
  log(`📁 输出目录: ${BUILD_CONFIG.outputDir}`);
  log('📦 使用方式:');
  log(`   import { createTaskLoop } from "${BUILD_CONFIG.sdkName}";`);

} catch (error) {
  log(`构建失败: ${error.message}`, 'error');
  process.exit(1);
}