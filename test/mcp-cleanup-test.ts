/**
 * MCP Server 清理功能测试脚本
 * 
 * 此脚本模拟多个客户端连接，然后停止活动来测试自动清理功能
 */

import fetch from 'node-fetch';

const SERVER_URL = 'http://127.0.0.1:8000/mcp';
const TEST_CONFIG = {
  // 测试用的较短超时时间（通过环境变量设置）
  sessionTimeoutMs: 2 * 60 * 1000, // 2分钟
  cleanupIntervalMs: 30 * 1000,    // 30秒
  
  // 测试参数
  numClients: 5,                   // 创建的客户端数量
  activityDurationMs: 60 * 1000,   // 活动持续时间（1分钟）
  requestIntervalMs: 10 * 1000,    // 请求间隔（10秒）
};

interface TestClient {
  id: string;
  sessionId: string | null;
  active: boolean;
  requestCount: number;
}

class MCPCleanupTester {
  private clients: TestClient[] = [];
  private testStartTime: number = Date.now();

  constructor() {
    console.log('[Test] MCP 清理功能测试开始');
    console.log('[Test] 配置:', TEST_CONFIG);
  }

  /**
   * 创建测试客户端
   */
  private createTestClients(): void {
    for (let i = 1; i <= TEST_CONFIG.numClients; i++) {
      this.clients.push({
        id: `client-${i}`,
        sessionId: null,
        active: true,
        requestCount: 0
      });
    }
    console.log(`[Test] 创建了 ${this.clients.length} 个测试客户端`);
  }

  /**
   * 向服务器发送初始化请求
   */
  private async sendInitRequest(client: TestClient): Promise<void> {
    try {
      const initRequest = {
        jsonrpc: "2.0",
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: {
            name: `test-client-${client.id}`,
            version: "1.0.0"
          }
        },
        id: 1
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // 如果已有sessionId，则在请求中包含
      if (client.sessionId) {
        headers['mcp-session-id'] = client.sessionId;
      }

      const response = await fetch(SERVER_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(initRequest)
      });

      // 获取服务器返回的session ID
      const responseSessionId = response.headers.get('mcp-session-id');
      if (responseSessionId && !client.sessionId) {
        client.sessionId = responseSessionId;
        console.log(`[Test] ${client.id} 获得 sessionId: ${client.sessionId}`);
      }

      client.requestCount++;
      
      if (!response.ok) {
        console.error(`[Test] ${client.id} 初始化失败:`, response.status, response.statusText);
      }
    } catch (error) {
      console.error(`[Test] ${client.id} 请求错误:`, error);
    }
  }

  /**
   * 发送心跳请求保持连接活跃
   */
  private async sendHeartbeat(client: TestClient): Promise<void> {
    if (!client.active || !client.sessionId) return;

    try {
      const pingRequest = {
        jsonrpc: "2.0",
        method: "ping",
        id: client.requestCount + 1
      };

      const response = await fetch(SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'mcp-session-id': client.sessionId
        },
        body: JSON.stringify(pingRequest)
      });

      client.requestCount++;
      
      if (response.ok) {
        console.log(`[Test] ${client.id} 心跳成功 (请求 #${client.requestCount})`);
      } else {
        console.warn(`[Test] ${client.id} 心跳失败:`, response.status);
      }
    } catch (error) {
      console.error(`[Test] ${client.id} 心跳错误:`, error);
    }
  }

  /**
   * 启动客户端活动循环
   */
  private startClientActivity(client: TestClient): void {
    // 先发送初始化请求
    this.sendInitRequest(client);

    // 定期发送心跳
    const intervalId = setInterval(async () => {
      if (client.active) {
        await this.sendHeartbeat(client);
      } else {
        clearInterval(intervalId);
        console.log(`[Test] ${client.id} 停止活动`);
      }
    }, TEST_CONFIG.requestIntervalMs);

    // 在指定时间后停止活动
    setTimeout(() => {
      client.active = false;
      console.log(`[Test] ${client.id} 活动期结束，等待清理...`);
    }, TEST_CONFIG.activityDurationMs);
  }

  /**
   * 检查服务器状态
   */
  private async checkServerStatus(): Promise<void> {
    try {
      // 通过健康检查端点获取状态（如果有的话）
      // 这里我们通过创建一个临时连接来间接检查
      const response = await fetch(SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "ping",
          id: 999
        })
      });

      console.log(`[Test] 服务器状态检查: ${response.ok ? 'OK' : 'ERROR'}`);
    } catch (error) {
      console.error('[Test] 服务器状态检查失败:', error);
    }
  }

  /**
   * 运行测试
   */
  public async run(): Promise<void> {
    try {
      // 1. 创建客户端
      this.createTestClients();

      // 2. 启动所有客户端活动
      console.log('[Test] 启动客户端活动...');
      this.clients.forEach(client => {
        this.startClientActivity(client);
      });

      // 3. 定期报告状态
      const statusInterval = setInterval(() => {
        const activeClients = this.clients.filter(c => c.active).length;
        const totalRequests = this.clients.reduce((sum, c) => sum + c.requestCount, 0);
        const elapsedMinutes = Math.floor((Date.now() - this.testStartTime) / 1000 / 60);
        
        console.log(`[Test] 状态报告 (${elapsedMinutes}分钟): 活跃客户端 ${activeClients}/${this.clients.length}, 总请求数 ${totalRequests}`);
        
        // 如果没有活跃客户端了，继续监控一段时间以观察清理
        if (activeClients === 0 && elapsedMinutes >= 5) {
          console.log('[Test] 所有客户端已停止，继续监控清理过程...');
        }
      }, 30000); // 每30秒报告一次

      // 4. 定期检查服务器状态
      const serverCheckInterval = setInterval(() => {
        this.checkServerStatus();
      }, 60000); // 每分钟检查一次

      // 5. 测试运行总时长
      const totalTestDuration = TEST_CONFIG.activityDurationMs + (5 * 60 * 1000); // 活动时间 + 5分钟观察清理
      
      setTimeout(() => {
        clearInterval(statusInterval);
        clearInterval(serverCheckInterval);
        console.log('[Test] 测试完成');
        console.log('[Test] 客户端请求统计:');
        this.clients.forEach(client => {
          console.log(`  ${client.id}: ${client.requestCount} 个请求, sessionId: ${client.sessionId}`);
        });
        
        process.exit(0);
      }, totalTestDuration);

      console.log(`[Test] 测试将在 ${totalTestDuration / 1000 / 60} 分钟后结束`);
      
    } catch (error) {
      console.error('[Test] 测试运行错误:', error);
      process.exit(1);
    }
  }
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new MCPCleanupTester();
  tester.run().catch(console.error);
}

export { MCPCleanupTester, TEST_CONFIG };
