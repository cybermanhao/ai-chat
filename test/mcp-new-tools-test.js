import fetch from 'node-fetch';

/**
 * 测试新增工具的功能
 */
async function testNewTools() {
  console.log('🧪 测试 MCP 服务器新增工具');
  console.log('===============================');
  
  const serverUrl = 'http://127.0.0.1:8000/mcp';
  let sessionId = null;
  
  try {
    // 测试数学工具
    console.log('\n📊 测试数学工具...');
    const mathResponse = await callTool(serverUrl, sessionId, 'math', {
      operation: 'add',
      numbers: [10, 20, 30]
    });
    console.log('✅ 数学工具响应:', mathResponse.result?.content?.[0]?.text);
    sessionId = mathResponse.sessionId;
    
    // 测试时间工具
    console.log('\n🕐 测试时间工具...');
    const timeResponse = await callTool(serverUrl, sessionId, 'datetime', {
      format: 'readable'
    });
    console.log('✅ 时间工具响应:', timeResponse.result?.content?.[0]?.text);
    
    // 测试文本处理工具
    console.log('\n📝 测试文本处理工具...');
    const textResponse = await callTool(serverUrl, sessionId, 'text_processor', {
      text: 'Hello World 你好世界',
      operation: 'count'
    });
    console.log('✅ 文本工具响应:', textResponse.result?.content?.[0]?.text);
    
    // 测试 Bing 搜索工具（可能会失败，因为需要 API 密钥）
    console.log('\n🔍 测试 Bing 搜索工具...');
    const bingResponse = await callTool(serverUrl, sessionId, 'bing_search', {
      query: 'TypeScript MCP 协议',
      count: 3
    });
    console.log('✅ Bing 工具响应:', bingResponse.result?.content?.[0]?.text?.substring(0, 200) + '...');
    
    console.log('\n✨ 所有工具测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

/**
 * 调用 MCP 工具
 */
async function callTool(serverUrl, sessionId, toolName, args) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream'
  };
  
  if (sessionId) {
    headers['mcp-session-id'] = sessionId;
  }
  
  const payload = {
    jsonrpc: "2.0",
    id: Date.now(),
    method: "tools/call",
    params: {
      name: toolName,
      arguments: args
    }
  };
  
  console.log(`   调用工具: ${toolName}`, JSON.stringify(args));
  
  const response = await fetch(serverUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  
  console.log(`   响应状态: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    const text = await response.text();
    console.log(`   响应内容: ${text}`);
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  // 获取响应中的会话ID
  const responseSessionId = response.headers.get('mcp-session-id');
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(`MCP Error: ${data.error.message}`);
  }
  
  return {
    result: data.result,
    sessionId: responseSessionId || sessionId
  };
}

// 运行测试
testNewTools()
  .then(() => {
    console.log('\n💡 提示：如果 Bing 搜索工具显示需要 API 密钥，这是正常的。');
    console.log('   要使用 Bing 搜索，请设置环境变量 BING_SEARCH_API_KEY。');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  });

export { testNewTools };
