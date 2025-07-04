#!/usr/bin/env node

/**
 * MCP Server 清理功能测试运行脚本
 * 
 * 用法:
 *   node run-cleanup-test.js
 *   
 * 或者通过 npm script:
 *   npm run test:cleanup
 */

const { spawn } = require('child_process');
const path = require('path');

// 设置测试用的环境变量
const testEnv = {
  ...process.env,
  MCP_SESSION_TIMEOUT_MS: '120000',    // 2分钟超时
  MCP_CLEANUP_INTERVAL_MS: '30000',    // 30秒清理间隔
  MCP_STATUS_REPORT_INTERVAL_MS: '20000', // 20秒状态报告
  MCP_PORT: '8000',
  MCP_HOST: '127.0.0.1',
  MCP_PATH: '/mcp'
};

console.log('='.repeat(60));
console.log('MCP Server 清理功能测试');
console.log('='.repeat(60));
console.log('测试环境变量:');
Object.entries(testEnv).filter(([key]) => key.startsWith('MCP_')).forEach(([key, value]) => {
  console.log(`  ${key}=${value}`);
});
console.log('');

// 启动 MCP Server
console.log('1. 启动 MCP Server...');
const serverProcess = spawn('node', ['build/engine/mcpserver.js'], {
  env: testEnv,
  stdio: 'pipe',
  cwd: process.cwd()
});

serverProcess.stdout.on('data', (data) => {
  console.log(`[SERVER] ${data.toString().trim()}`);
});

serverProcess.stderr.on('data', (data) => {
  console.error(`[SERVER ERROR] ${data.toString().trim()}`);
});

serverProcess.on('close', (code) => {
  console.log(`[SERVER] 进程退出，代码: ${code}`);
});

// 等待服务器启动
setTimeout(() => {
  console.log('');
  console.log('2. 启动测试客户端...');
  
  // 编译并运行测试
  const testProcess = spawn('npx', ['tsx', 'test/mcp-cleanup-test.ts'], {
    env: testEnv,
    stdio: 'inherit',
    cwd: process.cwd()
  });

  testProcess.on('close', (code) => {
    console.log(`[TEST] 测试完成，代码: ${code}`);
    
    // 关闭服务器
    console.log('3. 关闭服务器...');
    serverProcess.kill('SIGTERM');
    
    setTimeout(() => {
      if (!serverProcess.killed) {
        console.log('强制关闭服务器...');
        serverProcess.kill('SIGKILL');
      }
      process.exit(code);
    }, 2000);
  });

  testProcess.on('error', (error) => {
    console.error(`[TEST ERROR] ${error.message}`);
    serverProcess.kill('SIGTERM');
    process.exit(1);
  });
  
}, 3000); // 等待3秒让服务器启动

// 处理进程信号
process.on('SIGINT', () => {
  console.log('\n收到中断信号，正在关闭...');
  serverProcess.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n收到终止信号，正在关闭...');
  serverProcess.kill('SIGTERM');
  process.exit(0);
});
