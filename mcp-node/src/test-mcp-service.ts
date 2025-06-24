import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

async function testMCPServer() {
  const client = new Client({ name: "mcp-client", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL("http://127.0.0.1:8010/mcp-weather"));
  await client.connect(transport);

  // 只测试 listTools
  console.log(`[${new Date().toISOString()}] 开始测试 MCP Client listTools...`);
  try {
    const tools = await client.listTools();
    console.log(`[${new Date().toISOString()}] Available tools:`, tools);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Failed to list tools:`, error);
  }
  await client.close(); // 官方 SDK 正确的关闭方法
}

(async () => {
  try {
    await testMCPServer();
  } catch (err) {
    console.error(`[${new Date().toISOString()}] MCP Client 测试失败:`, err);
    process.exit(1);
  }
})();
