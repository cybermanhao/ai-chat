import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { MCPFunctionRegistry } from "./registry.js";

/**
 * MCP 服务器实例信息
 */
export interface MCPServerInfo {
  name: string;
  version: string;
  description: string;
  [key: string]: unknown; // 允许额外的属性
}

/**
 * MCP 服务器管理器
 * 负责创建和配置 MCP 服务器实例
 */
export class MCPServerManager {
  private serverInfo: MCPServerInfo;

  constructor(serverInfo: MCPServerInfo) {
    this.serverInfo = serverInfo;
  }

  /**
   * 创建并设置一个新的 MCP 服务器实例
   */
  public async createServerInstance(): Promise<Server> {
    const serverInstance = new Server(this.serverInfo, {
      capabilities: {
        tools: {}
      }
    });
    await this.setupServerInstance(serverInstance);
    return serverInstance;
  }

  /**
   * 设置服务器实例，注册所有工具、资源和提示
   */
  private async setupServerInstance(serverInstance: Server): Promise<void> {
    // 使用功能注册器注册所有功能
    await MCPFunctionRegistry.registerAll(serverInstance);
  }

  /**
   * 获取服务器信息
   */
  public getServerInfo(): MCPServerInfo {
    return { ...this.serverInfo };
  }

  /**
   * 更新服务器信息
   */
  public updateServerInfo(serverInfo: Partial<MCPServerInfo>): void {
    this.serverInfo = { ...this.serverInfo, ...serverInfo };
  }
}
