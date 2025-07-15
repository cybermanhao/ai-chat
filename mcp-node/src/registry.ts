import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// 导入工具 - 使用新的 JSON Schema 格式
import {
  weatherToolSchema,
  weatherToolHandler,
  calculatorToolSchema,
  calculatorToolHandler,
  mathToolSchema,
  mathToolHandler,
  testToolSchema,
  testToolHandler,
  bingSearchSchema,
  bingSearchHandler,
  dateTimeToolSchema,
  dateTimeToolHandler,
  textToolSchema,
  textToolHandler,
  getAllBuiltinTools
} from "./tools/index.js";

function normalizeTools(tools: any[]): any[] {
  // 支持 defineTool 风格和 tools 目录风格
  return tools.map(t => {
    if (t.handler && t.inputSchema && t.name) {
      // defineTool 风格
      return t;
    } else if (t.schema && t.handler) {
      // tools 目录风格（如 {schema, handler}）
      return {
        name: t.schema.name,
        description: t.schema.description,
        inputSchema: t.schema.inputSchema,
        handler: t.handler
      };
    }
    return t;
  });
}

/**
 * MCP 功能注册器 - 使用正确的 MCP SDK API
 * 负责将所有工具注册到 MCP 服务器实例
 */
export class MCPFunctionRegistry {
  
  /**
   * 注册所有功能到 MCP 服务器
   */
  public static async registerAll(serverInstance: Server, customTools?: any[]): Promise<void> {
    let allTools: any[] = [];
    if (customTools && customTools.length) {
      allTools = normalizeTools(customTools);
    } else {
      allTools = getAllBuiltinTools();
    }
    this.registerToolsListHandler(serverInstance, allTools);
    this.registerToolCallHandler(serverInstance, allTools);
    console.log("[MCPFunctionRegistry] 所有功能注册完成 (使用正确的 MCP SDK API)");
  }

  /**
   * 注册工具列表处理器
   */
  private static registerToolsListHandler(serverInstance: Server, customTools?: any[]): void {
    serverInstance.setRequestHandler(ListToolsRequestSchema, async () => {
      if (customTools && customTools.length) {
        return {
          tools: customTools.map(t => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema
          }))
        };
      }
      return {
        tools: [
          {
            name: weatherToolSchema.name,
            description: weatherToolSchema.description,
            inputSchema: weatherToolSchema.inputSchema,
          },
          {
            name: calculatorToolSchema.name,
            description: calculatorToolSchema.description,
            inputSchema: calculatorToolSchema.inputSchema,
          },
          {
            name: mathToolSchema.name,
            description: mathToolSchema.description,
            inputSchema: mathToolSchema.inputSchema,
          },
          {
            name: testToolSchema.name,
            description: testToolSchema.description,
            inputSchema: testToolSchema.inputSchema,
          },
          {
            name: bingSearchSchema.name,
            description: bingSearchSchema.description,
            inputSchema: bingSearchSchema.inputSchema,
          },
          {
            name: dateTimeToolSchema.name,
            description: dateTimeToolSchema.description,
            inputSchema: dateTimeToolSchema.inputSchema,
          },
          {
            name: textToolSchema.name,
            description: textToolSchema.description,
            inputSchema: textToolSchema.inputSchema,
          },
        ],
      };
    });
  }

  /**
   * 注册工具调用处理器
   */
  private static registerToolCallHandler(serverInstance: Server, customTools?: any[]): void {
    serverInstance.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
      const { name, arguments: args } = request.params;
      console.log(`[MCPFunctionRegistry] 调用工具: ${name}`, args);
      if (!args) {
        throw new Error("工具参数未提供");
      }
      if (customTools && customTools.length) {
        const tool = customTools.find(t => t.name === name);
        if (tool && typeof tool.handler === 'function') {
          return await tool.handler(args);
        }
        throw new Error(`Unknown tool: ${name}`);
      }
      try {
        switch (name) {
          case weatherToolSchema.name:
            return await weatherToolHandler(args as any);
          case calculatorToolSchema.name:
            return await calculatorToolHandler(args as any);
          case mathToolSchema.name:
            return await mathToolHandler(args as any);
          case testToolSchema.name:
            return await testToolHandler(args as any);
          case bingSearchSchema.name:
            return await bingSearchHandler(args as any);
          case dateTimeToolSchema.name:
            return await dateTimeToolHandler(args as any);
          case textToolSchema.name:
            return await textToolHandler(args as any);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error(`[MCPFunctionRegistry] 工具调用错误:`, error);
        return {
          content: [
            {
              type: "text" as const,
              text: `工具调用失败: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }
}
