import express, { Request, Response } from "express";
import { MCPServerConfig } from "./config.js";

/**
 * HTTP 服务器管理器
 * 负责处理 Express 服务器的创建、配置和启动
 */
export class HTTPServer {
  private app: express.Application;
  private config: MCPServerConfig;

  constructor(config: MCPServerConfig) {
    this.config = config;
    this.app = this.createApp();
  }

  /**
   * 创建和配置 Express 应用
   */
  private createApp(): express.Application {
    const app = express();
    
    // 基础中间件
    app.use(express.json());
    
    // CORS 配置
    app.use((req, res, next) => {
      res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
      res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, mcp-protocol-version, mcp-session-id, Accept, Origin");
      res.header("Access-Control-Expose-Headers", "mcp-protocol-version, mcp-session-id");
      res.header("Access-Control-Allow-Credentials", "true");
      
      if (req.method === "OPTIONS") {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    return app;
  }

  /**
   * 注册路由处理器
   */
  public registerRoutes(
    postHandler: (req: Request, res: Response) => Promise<void>,
    getHandler: (req: Request, res: Response) => Promise<void>
  ): void {
    this.app.post(this.config.mcpPath, postHandler);
    this.app.get(this.config.mcpPath, getHandler);
  }

  /**
   * 启动服务器
   */
  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.config.port, this.config.host, () => {
        console.log(`HTTP Server running on http://${this.config.host}:${this.config.port}${this.config.mcpPath}`);
        resolve();
      });
    });
  }

  /**
   * 获取 Express 应用实例（用于测试或扩展）
   */
  public getApp(): express.Application {
    return this.app;
  }
}
