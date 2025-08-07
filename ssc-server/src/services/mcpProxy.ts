// SSC Server - MCP Proxy Service  
// 复用engine包中的MCPClient

import { MCPClient } from '../../../engine/service/mcpClient';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { mcpConfig } from '../config';

export interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: any;
}

export interface MCPCallResult {
  data: any;
  error?: string;
}

export class MCPProxy {
  private mcpClient: MCPClient | null = null;
  private enabled: boolean;

  constructor() {
    this.enabled = mcpConfig.enabled;
    
    if (this.enabled) {
      // 创建MCP客户端，使用STREAMABLE_HTTP协议连接FastMCP服务器
      this.mcpClient = new MCPClient(
        mcpConfig.serverUrl,
        'STREAMABLE_HTTP', // FastMCP使用streamable-http协议
        '', // 不需要serverCommand
        [], // 不需要serverArgs  
        'ssc-server-client',
        '1.0.0'
      );
      
      // 立即尝试连接以验证配置
      this.initializeConnection();
    }
    
    console.log(`[MCPProxy] 初始化 - URL: ${mcpConfig.serverUrl}, 启用: ${this.enabled}`);
  }

  // 初始化连接
  private async initializeConnection() {
    try {
      console.log(`[MCPProxy] 尝试初始连接...`);
      const result = await this.mcpClient!.listTools();
      if (result.error) {
        console.error(`[MCPProxy] 初始连接失败:`, result.error);
      } else {
        console.log(`[MCPProxy] 初始连接成功，发现 ${result.data.length} 个工具`);
      }
    } catch (error) {
      console.error(`[MCPProxy] 初始连接异常:`, error);
    }
  }

  // 调用工具
  async callTool(serverId: string, toolName: string, args: Record<string, any>, callId?: string): Promise<MCPCallResult> {
    if (!this.enabled || !this.mcpClient) {
      return {
        data: null,
        error: 'MCP服务已禁用',
      };
    }

    try {
      console.log(`[MCPProxy] 调用工具: ${toolName}`, { serverId, args, callId });

      const result = await this.mcpClient.callTool(toolName, args);
      console.log(`[MCPProxy] 工具调用结果:`, result);

      return {
        data: result.data,
        error: result.error,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[MCPProxy] 工具调用失败:`, errorMessage);
      
      return {
        data: null,
        error: errorMessage,
      };
    }
  }

  // 获取可用工具列表
  async listTools(): Promise<MCPTool[]> {
    if (!this.enabled || !this.mcpClient) {
      return [];
    }

    try {
      console.log(`[MCPProxy] 获取工具列表`);

      const result = await this.mcpClient.listTools();
      
      if (result.error) {
        console.error(`[MCPProxy] 获取工具列表失败:`, result.error);
        return [];
      }

      const tools: MCPTool[] = result.data.map((tool: Tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }));
      
      console.log(`[MCPProxy] 获取到 ${tools.length} 个工具`);
      
      return tools;

    } catch (error) {
      console.error(`[MCPProxy] 获取工具列表失败:`, error);
      return [];
    }
  }

  // 检查MCP服务器健康状态
  async checkHealth(): Promise<boolean> {
    if (!this.enabled || !this.mcpClient) {
      return false;
    }

    try {
      // 尝试列出工具来检查连接健康状态
      const result = await this.mcpClient.listTools();
      return !result.error;
    } catch (error) {
      console.error(`[MCPProxy] 健康检查失败:`, error);
      return false;
    }
  }

  // 获取MCP服务器信息
  async getServerInfo(): Promise<any> {
    if (!this.enabled || !this.mcpClient) {
      return { enabled: false };
    }

    try {
      const toolsResult = await this.mcpClient.listTools();
      const toolCount = toolsResult.error ? 0 : toolsResult.data.length;
      
      return {
        enabled: true,
        healthy: !toolsResult.error,
        toolCount,
        url: mcpConfig.serverUrl,
        error: toolsResult.error || null,
      };
    } catch (error) {
      return {
        enabled: true,
        healthy: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // 更新配置
  updateConfig(newUrl: string, newEnabled: boolean) {
    this.enabled = newEnabled;
    
    if (this.enabled && newUrl !== mcpConfig.serverUrl) {
      // 重新创建MCP客户端
      this.mcpClient = new MCPClient(
        newUrl,
        'STREAMABLE_HTTP',
        '',
        [],
        'ssc-server-client',
        '1.0.0'
      );
    } else if (!this.enabled) {
      this.mcpClient = null;
    }
    
    console.log(`[MCPProxy] 配置已更新 - URL: ${newUrl}, 启用: ${this.enabled}`);
  }
}

// 单例实例
export const mcpProxy = new MCPProxy();