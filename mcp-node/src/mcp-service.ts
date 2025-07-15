import { Request, Response } from "express";
import { HTTPServer } from "./http-server.js";
import { SessionManager } from "./session-manager.js";
import { MCPServerManager, MCPServerInfo } from "./mcp-server-manager.js";
import { loadConfig, MCPServerConfig } from "./config.js";

/**
 * MCP 服务主管理器
 * 协调 HTTP 服务器、会话管理和 MCP 服务器实例
 */
export class MCPService {
  private config: MCPServerConfig;
  private httpServer: HTTPServer;
  private sessionManager: SessionManager;
  private mcpServerManager: MCPServerManager;
  private StreamableHTTPServerTransport: any;
  private sharedServerInstance: any; // 共享的 MCP 服务器实例
  private customTools?: any[];

  constructor(serverInfo?: MCPServerInfo, config?: MCPServerConfig, customTools?: any[]) {
    this.config = config || loadConfig();
    this.httpServer = new HTTPServer(this.config);
    this.sessionManager = new SessionManager(this.config);
    
    const defaultServerInfo: MCPServerInfo = {
      name: "node-mcp-server",
      version: "1.0.0",
      description: "Node 版 MCP Server 示例 (TypeScript)"
    };
    
    this.mcpServerManager = new MCPServerManager(serverInfo || defaultServerInfo);
    this.customTools = customTools;
  }

  /**
   * 初始化服务
   */
  public async initialize(): Promise<void> {
    console.log("[MCPService] 正在初始化服务...");
    
    // 加载 StreamableHTTPServerTransport
    await this.loadTransport();
    
    // 创建共享的 MCP 服务器实例（只创建一次）
    this.sharedServerInstance = await this.mcpServerManager.createServerInstance(this.customTools);
    console.log("[MCPService] 共享 MCP 服务器实例创建完成");
    
    // 注册路由处理器
    this.httpServer.registerRoutes(
      this.handlePostRequest.bind(this),
      this.handleGetRequest.bind(this)
    );

    console.log("[MCPService] 服务初始化完成");
    this.printConfiguration();
  }

  /**
   * 加载 Transport 类
   */
  private async loadTransport(): Promise<void> {
    try {
      ({ StreamableHTTPServerTransport: this.StreamableHTTPServerTransport } = 
        await import("@modelcontextprotocol/sdk/server/streamableHttp.js"));
    } catch (e) {
      const mod = await import("@modelcontextprotocol/sdk/server/streamableHttp.js");
      this.StreamableHTTPServerTransport = mod.StreamableHTTPServerTransport;
    }
  }

  /**
   * 处理 POST 请求
   */
  private async handlePostRequest(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string;
    console.log(`[${new Date().toISOString()}] POST ${this.config.mcpPath}, Session: ${sessionId || 'new'}`);
    
    try {
      let transport;
      let currentSessionId = sessionId;
      
      // 检查是否可以重用现有会话
      if (sessionId && this.sessionManager.hasSession(sessionId)) {
        const session = this.sessionManager.getSession(sessionId);
        transport = session!.transport;
        this.sessionManager.updateActivity(sessionId);
        console.log(`[MCPService] ✅ 重用现有transport, session: ${sessionId}`);
      } else {
        // 创建新的 transport 和会话
        transport = await this.createNewTransport();
        currentSessionId = this.sessionManager.createSession(transport);
        // 将新会话ID设置到响应头中，供客户端后续使用
        res.setHeader('mcp-session-id', currentSessionId);
        console.log(`[MCPService] 🆕 创建新transport, session: ${currentSessionId}`);
      }

      await transport.handleRequest(req, res, req.body);
      console.log(`[${new Date().toISOString()}] POST ${this.config.mcpPath} 响应已发送`);
    } catch (error) {
      console.error(`[MCPService] POST 请求处理失败:`, error);
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal error"
        },
        id: null
      });
    }
  }

  /**
   * 处理 GET 请求 (通常是 SSE)
   */
  private async handleGetRequest(req: Request, res: Response): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string;
    console.log(`[${new Date().toISOString()}] GET ${this.config.mcpPath}, Session: ${sessionId || 'none'}`);
    
    try {
      if (sessionId && this.sessionManager.hasSession(sessionId)) {
        const session = this.sessionManager.getSession(sessionId);
        this.sessionManager.updateActivity(sessionId);
        await session!.transport.handleRequest(req, res);
        console.log(`[${new Date().toISOString()}] GET ${this.config.mcpPath} 响应已发送`);
      } else {
        res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32600,
            message: "Invalid Request: No valid session"
          },
          id: null
        });
      }
    } catch (error) {
      console.error(`[MCPService] GET 请求处理失败:`, error);
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal error"
        },
        id: null
      });
    }
  }

  /**
   * 创建新的 transport 实例（但使用共享的服务器实例）
   */
  private async createNewTransport(): Promise<any> {
    // 创建新的 transport（传入空配置对象）
    const transport = new this.StreamableHTTPServerTransport({});
    
    // 连接到共享的 MCP 服务器实例（不创建新实例）
    await this.sharedServerInstance.connect(transport);
    
    return transport;
  }

  /**
   * 启动服务
   */
  public async start(): Promise<void> {
    console.log("[MCPService] 正在启动服务...");
    
    await this.initialize();
    await this.httpServer.start();
    
    console.log("[MCPService] 服务启动成功");
  }

  /**
   * 停止服务
   */
  public async stop(): Promise<void> {
    console.log("[MCPService] 正在停止服务...");
    
    this.sessionManager.stop();
    
    console.log("[MCPService] 服务已停止");
  }

  /**
   * 获取服务状态
   */
  public getStatus(): {
    activeSessionCount: number;
    config: MCPServerConfig;
    serverInfo: MCPServerInfo;
  } {
    return {
      activeSessionCount: this.sessionManager.getActiveSessionCount(),
      config: this.config,
      serverInfo: this.mcpServerManager.getServerInfo()
    };
  }

  /**
   * 打印配置信息
   */
  private printConfiguration(): void {
    console.log("[MCPService] 配置信息:");
    console.log(`  - 端点: http://${this.config.host}:${this.config.port}${this.config.mcpPath}`);
    console.log(`  - 会话超时时间: ${this.config.sessionTimeoutMs / 1000 / 60} 分钟`);
    console.log(`  - 清理检查间隔: ${this.config.cleanupIntervalMs / 1000 / 60} 分钟`);
    console.log(`  - 状态报告间隔: ${this.config.statusReportIntervalMs / 1000 / 60} 分钟`);
    
    const serverInfo = this.mcpServerManager.getServerInfo();
    console.log(`  - 服务器信息: ${serverInfo.name} v${serverInfo.version}`);
  }
}
