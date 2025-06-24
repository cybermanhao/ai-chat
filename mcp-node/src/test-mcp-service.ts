import { MCPService } from "../../engine/service/mcpService.js";

async function testMCPServer() {
  const mcpService = new MCPService("http://localhost:8000/mcp", "STREAMABLE_HTTP");
  await mcpService.connect();

  // 测试各种功能
  console.log(`[${new Date().toISOString()}] 开始测试 MCPService 功能...`);

  // 1. 测试 listTools
  const { data: tools, error } = await mcpService.listTools();
  if (error) {
    console.error(`[${new Date().toISOString()}] Failed to list tools:`, error);
  } else {
    console.log(`[${new Date().toISOString()}] Available tools:`, tools);
  }

  // 2. 测试 weather 工具
  const { data: weatherData } = await mcpService.callTool("weather", { city_code: 101010100 });
  console.log(`[${new Date().toISOString()}] Weather tool result:`, weatherData);

  // 3. 测试 test 工具
  const { data: testData } = await mcpService.callTool("test", {
    params: { start: "2024-01-01", end: "2024-12-31" },
    test1: "Hello",
    test2: ["World", "MCP"],
    test3: "Test"
  });
  console.log(`[${new Date().toISOString()}] Test tool result:`, testData);

  console.log(`[${new Date().toISOString()}] MCPService 功能测试完成`);
}

testMCPServer().catch(err => {
  console.error(`[${new Date().toISOString()}] MCPService 测试失败:`, err);
  process.exit(1);
});
