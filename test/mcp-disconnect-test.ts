// test/mcp-disconnect-test.ts
import { MCPService } from '../engine/service/mcpService';

async function testMCPDisconnect() {
  console.log('=== MCP 断开连接测试 ===\n');

  // 测试不同的连接类型
  const testCases = [
    {
      name: 'HTTP连接测试',
      url: 'http://localhost:8123/mcp',
      connectionType: 'STREAMABLE_HTTP' as const
    },
    {
      name: 'SSE连接测试', 
      url: 'http://localhost:8123/sse',
      connectionType: 'SSE' as const
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n--- ${testCase.name} ---`);
    
    const service = new MCPService(testCase.url, testCase.connectionType);
    
    try {
      // 尝试连接
      console.log('1. 尝试连接...');
      await service.connect();
      console.log('✅ 连接成功');
      
      // 获取工具列表
      console.log('2. 获取工具列表...');
      const tools = await service.listTools();
      console.log(`✅ 获取到 ${tools.data.length} 个工具`);
      
      // 等待一下
      console.log('3. 等待 2 秒...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 断开连接
      console.log('4. 断开连接...');
      await service.disconnect();
      console.log('✅ 断开连接成功');
      
    } catch (error) {
      console.error('❌ 测试失败:', error);
    }
  }

  console.log('\n=== 测试完成 ===');
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  testMCPDisconnect().catch(console.error);
}

export { testMCPDisconnect };
