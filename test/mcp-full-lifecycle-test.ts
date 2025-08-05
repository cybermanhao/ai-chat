// test/mcp-full-lifecycle-test.ts
/**
 * 完整的MCP连接生命周期测试
 * 测试连接、工具调用、断开连接的完整流程
 */

import { MCPClient } from '../engine/service/mcpService';

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  duration?: number;
}

async function runTest(name: string, testFn: () => Promise<void>): Promise<TestResult> {
  const startTime = Date.now();
  try {
    await testFn();
    return {
      name,
      success: true,
      duration: Date.now() - startTime
    };
  } catch (error) {
    return {
      name,
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    };
  }
}

async function testBasicConnection() {
  const service = new MCPService('http://localhost:8123/mcp');
  await service.connect();
  await service.disconnect();
}

async function testToolListing() {
  const service = new MCPService('http://localhost:8123/mcp');
  await service.connect();
  const result = await service.listTools();
  if (result.error) {
    throw new Error(`工具列表获取失败: ${result.error}`);
  }
  console.log(`获取到 ${result.data.length} 个工具`);
  await service.disconnect();
}

async function testToolCall() {
  const service = new MCPService('http://localhost:8123/mcp');
  await service.connect();
  
  const toolsResult = await service.listTools();
  if (toolsResult.error || toolsResult.data.length === 0) {
    throw new Error('没有可用的工具进行测试');
  }
  
  // 尝试调用第一个工具（如果是天气服务器，通常是 get-alerts 或 get-forecast）
  const firstTool = toolsResult.data[0];
  console.log(`尝试调用工具: ${firstTool.name}`);
  
  // 根据工具名称准备参数
  let args: Record<string, any> = {};
  if (firstTool.name === 'get-alerts') {
    args = { state: 'CA' };
  } else if (firstTool.name === 'get-forecast') {
    args = { latitude: 37.7749, longitude: -122.4194 }; // San Francisco
  }
  
  const callResult = await service.callTool(firstTool.name, args);
  if (callResult.error) {
    throw new Error(`工具调用失败: ${callResult.error}`);
  }
  
  console.log('工具调用成功');
  await service.disconnect();
}

async function testMultipleConnections() {
  const services = [
    new MCPService('http://localhost:8123/mcp'),
    new MCPService('http://localhost:8123/mcp'),
  ];
  
  // 并行连接
  await Promise.all(services.map(service => service.connect()));
  console.log('多个连接建立成功');
  
  // 并行断开
  await Promise.all(services.map(service => service.disconnect()));
  console.log('多个连接断开成功');
}

async function testReconnection() {
  const service = new MCPService('http://localhost:8123/mcp');
  
  // 第一次连接
  await service.connect();
  await service.disconnect();
  
  // 等待一下
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // 第二次连接
  await service.connect();
  const result = await service.listTools();
  if (result.error) {
    throw new Error('重连后工具列表获取失败');
  }
  await service.disconnect();
  
  console.log('重连测试成功');
}

async function testDisconnectWithoutConnect() {
  const service = new MCPService('http://localhost:8123/mcp');
  
  // 直接断开连接（没有先连接）
  await service.disconnect();
  
  console.log('未连接状态下断开测试成功');
}

export async function runMCPLifecycleTests() {
  console.log('=== MCP 完整生命周期测试 ===\n');
  
  const tests = [
    { name: '基本连接测试', fn: testBasicConnection },
    { name: '工具列表测试', fn: testToolListing },
    { name: '工具调用测试', fn: testToolCall },
    { name: '多连接测试', fn: testMultipleConnections },
    { name: '重连测试', fn: testReconnection },
    { name: '未连接断开测试', fn: testDisconnectWithoutConnect },
  ];
  
  const results: TestResult[] = [];
  
  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    const result = await runTest(test.name, test.fn);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${test.name} 成功 (${result.duration}ms)`);
    } else {
      console.log(`❌ ${test.name} 失败: ${result.error} (${result.duration}ms)`);
    }
    
    // 每个测试之间等待一下
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 输出测试总结
  console.log('\n=== 测试总结 ===');
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log(`总测试数: ${totalCount}`);
  console.log(`成功: ${successCount}`);
  console.log(`失败: ${totalCount - successCount}`);
  console.log(`成功率: ${(successCount / totalCount * 100).toFixed(1)}%`);
  
  if (successCount === totalCount) {
    console.log('\n🎉 所有测试通过！');
  } else {
    console.log('\n⚠️  部分测试失败，请检查失败的测试项');
  }
  
  return results;
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  runMCPLifecycleTests().catch(console.error);
}
