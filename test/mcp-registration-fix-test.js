/**
 * 测试修复后的MCP服务器，验证功能不再重复注册
 */

import fetch from 'node-fetch';

const SERVER_URL = 'http://127.0.0.1:8000/mcp';

async function testSingleRegistration() {
  console.log('🧪 测试 MCP 服务器功能注册修复');
  console.log('===============================');
  
  const testClients = [];
  
  // 创建多个并发连接
  for (let i = 1; i <= 3; i++) {
    console.log(`\n📡 创建客户端 ${i}...`);
    
    const initRequest = {
      jsonrpc: "2.0",
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: {
          name: `test-client-${i}`,
          version: "1.0.0"
        }
      },
      id: i
    };

    try {
      const response = await fetch(SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initRequest)
      });

      const sessionId = response.headers.get('mcp-session-id');
      console.log(`✅ 客户端 ${i} 连接成功, sessionId: ${sessionId}`);
      
      testClients.push({ id: i, sessionId });
      
      // 等待一小段时间
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ 客户端 ${i} 连接失败:`, error.message);
    }
  }
  
  console.log(`\n📊 测试结果:`);
  console.log(`- 成功创建 ${testClients.length} 个客户端连接`);
  console.log(`- 观察服务器日志，应该只看到一次功能注册消息`);
  console.log(`- 如果每个连接都显示注册消息，说明问题未修复`);
  
  console.log('\n🎯 期望的日志模式:');
  console.log('✅ 正确: [MCPFunctionRegistry] 所有功能注册完成 (只出现一次)');
  console.log('❌ 错误: [MCPFunctionRegistry] 所有功能注册完成 (出现多次)');
  
  return testClients;
}

// 直接运行测试
testSingleRegistration()
  .then((clients) => {
    console.log('\n✨ 测试完成');
    console.log('💡 请检查服务器控制台输出，确认功能注册消息只出现一次');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  });

export { testSingleRegistration };
