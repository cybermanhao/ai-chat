# MCP 工具创建与注册指南

## 概述

本指南详细说明如何在 MCP Node 服务器中创建和注册新的工具。我们采用模块化架构，使工具的创建、管理和维护变得简单且可扩展。

## 架构概览

```
mcp-node/src/
├── tools/           # 工具定义目录
│   ├── index.ts     # 工具导出索引
│   ├── test-tool.ts # 示例：测试工具
│   ├── weather-tool.ts # 示例：天气工具
│   └── math-tool.ts    # 示例：数学工具
├── registry.ts      # 统一注册器
└── mcp-service.ts   # 服务主入口
```

## 创建新工具的步骤

### 1. 创建工具文件

在 `src/tools/` 目录下创建新的工具文件，命名格式：`{工具名}-tool.ts`

#### 基本模板

```typescript
import { z } from "zod";

/**
 * {工具名} 工具的输入参数类型
 */
export interface {工具名}ToolInput {
  // 定义输入参数类型
  param1: string;
  param2?: number;
}

/**
 * {工具名} 工具的 Schema 定义
 */
export const {工具名}ToolSchema = {
  title: "{工具名}",
  description: "工具功能描述",
  inputSchema: {
    param1: z.string().describe("参数1描述"),
    param2: z.number().optional().describe("参数2描述（可选）")
  }
};

/**
 * {工具名} 工具的实现函数
 */
export async function {工具名}ToolHandler(input: {工具名}ToolInput) {
  try {
    console.log(`[MCPServer] {工具名} tool called, input:`, input);
    
    // 实现工具逻辑
    const result = {
      // 处理逻辑
    };
    
    return {
      content: [
        { 
          type: "text" as const, 
          text: JSON.stringify(result) 
        }
      ]
    };
  } catch (error) {
    console.error(`[MCPServer] {工具名} tool error:`, error);
    return {
      content: [
        { 
          type: "text" as const, 
          text: `错误: ${error instanceof Error ? error.message : String(error)}` 
        }
      ]
    };
  }
}
```

### 2. 实际示例：创建计算器工具

让我们创建一个计算器工具作为示例：

```typescript
// src/tools/calculator-tool.ts
import { z } from "zod";

export interface CalculatorToolInput {
  operation: "add" | "subtract" | "multiply" | "divide";
  a: number;
  b: number;
}

export const calculatorToolSchema = {
  title: "calculator",
  description: "执行基本数学运算（加减乘除）",
  inputSchema: {
    operation: z.enum(["add", "subtract", "multiply", "divide"]).describe("运算类型"),
    a: z.number().describe("第一个数"),
    b: z.number().describe("第二个数")
  }
};

export async function calculatorToolHandler({ operation, a, b }: CalculatorToolInput) {
  try {
    console.log(`[MCPServer] calculator tool called:`, { operation, a, b });
    
    let result: number;
    switch (operation) {
      case "add":
        result = a + b;
        break;
      case "subtract":
        result = a - b;
        break;
      case "multiply":
        result = a * b;
        break;
      case "divide":
        if (b === 0) throw new Error("除数不能为零");
        result = a / b;
        break;
      default:
        throw new Error(`不支持的运算类型: ${operation}`);
    }
    
    return {
      content: [
        { 
          type: "text" as const, 
          text: `${a} ${operation} ${b} = ${result}` 
        }
      ]
    };
  } catch (error) {
    console.error(`[MCPServer] calculator tool error:`, error);
    return {
      content: [
        { 
          type: "text" as const, 
          text: `计算错误: ${error instanceof Error ? error.message : String(error)}` 
        }
      ]
    };
  }
}
```

### 3. 更新工具索引文件

在 `src/tools/index.ts` 中导出新工具：

```typescript
// 添加新工具的导出
export {
  calculatorToolSchema,
  calculatorToolHandler,
  type CalculatorToolInput
} from "./calculator-tool.js";
```

### 4. 更新注册器

在 `src/registry.ts` 中注册新工具：

```typescript
// 1. 添加导入
import {
  // ...existing imports...
  calculatorToolSchema,
  calculatorToolHandler
} from "./tools/index.js";

// 2. 在 registerTools 方法中添加注册
private static async registerTools(serverInstance: McpServer): Promise<void> {
  // ...existing tool registrations...
  
  // 注册 calculator 工具
  serverInstance.registerTool(
    "calculator",
    calculatorToolSchema,
    calculatorToolHandler
  );

  console.log("[MCPFunctionRegistry] 工具注册完成: test, weather, calculator");
}
```

### 5. 编译和测试

```bash
# 编译代码
npm run build:mcp-node

# 启动服务器
npm run start:mcp-node

# 在另一个终端测试
curl -X POST http://127.0.0.1:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "calculator",
      "arguments": {
        "operation": "add",
        "a": 5,
        "b": 3
      }
    }
  }'
```

## 工具设计最佳实践

### 1. 输入验证

- 使用 Zod schema 进行严格的类型验证
- 为所有参数添加描述信息
- 标明可选参数

### 2. 错误处理

- 使用 try-catch 包装所有异步操作
- 返回有意义的错误消息
- 记录详细的错误日志

### 3. 返回格式

- 始终返回 `{ content: [{ type: "text", text: "..." }] }` 格式
- 对于复杂数据，使用 JSON.stringify() 序列化
- 考虑返回格式化的文本以提高可读性

### 4. 异步操作

```typescript
// 好的做法：正确处理异步操作
export async function apiToolHandler(input: ApiToolInput) {
  try {
    const response = await fetch(input.url, {
      method: 'GET',
      timeout: 5000
    });
    
    if (!response.ok) {
      throw new Error(`API 请求失败: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(data, null, 2) }
      ]
    };
  } catch (error) {
    // 错误处理...
  }
}
```

### 5. 性能考虑

- 为长时间运行的操作添加超时
- 对于大量数据，考虑分页或限制
- 缓存频繁请求的结果

## 常见工具类型模板

### HTTP API 工具

```typescript
export async function httpApiToolHandler({ url, method, headers, body }: HttpApiToolInput) {
  try {
    const response = await fetch(url, {
      method: method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10000) // 10秒超时
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(data, null, 2) }
      ]
    };
  } catch (error) {
    // 错误处理...
  }
}
```

### 文件操作工具

```typescript
import { promises as fs } from 'fs';
import path from 'path';

export async function fileToolHandler({ operation, filePath, content }: FileToolInput) {
  try {
    const safePath = path.resolve(filePath);
    
    switch (operation) {
      case 'read':
        const data = await fs.readFile(safePath, 'utf-8');
        return {
          content: [
            { type: "text" as const, text: data }
          ]
        };
      
      case 'write':
        await fs.writeFile(safePath, content || '');
        return {
          content: [
            { type: "text" as const, text: `文件已写入: ${safePath}` }
          ]
        };
      
      default:
        throw new Error(`不支持的操作: ${operation}`);
    }
  } catch (error) {
    // 错误处理...
  }
}
```

### 数据库查询工具

```typescript
export async function dbQueryToolHandler({ query, params }: DbQueryToolInput) {
  try {
    // 假设使用某个数据库客户端
    const result = await db.query(query, params);
    
    return {
      content: [
        { 
          type: "text" as const, 
          text: JSON.stringify({
            rowCount: result.rowCount,
            rows: result.rows
          }, null, 2)
        }
      ]
    };
  } catch (error) {
    // 错误处理...
  }
}
```

## 调试和测试

### 1. 单元测试

为每个工具创建测试文件：

```typescript
// src/tools/__tests__/calculator-tool.test.ts
import { calculatorToolHandler } from '../calculator-tool.js';

describe('Calculator Tool', () => {
  it('should add two numbers correctly', async () => {
    const result = await calculatorToolHandler({
      operation: 'add',
      a: 5,
      b: 3
    });
    
    expect(result.content[0].text).toBe('5 add 3 = 8');
  });

  it('should handle division by zero', async () => {
    const result = await calculatorToolHandler({
      operation: 'divide',
      a: 5,
      b: 0
    });
    
    expect(result.content[0].text).toContain('除数不能为零');
  });
});
```

### 2. 集成测试

```javascript
// test/tools-integration-test.js
async function testCalculatorTool() {
  const response = await fetch('http://127.0.0.1:8000/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'calculator',
        arguments: { operation: 'add', a: 5, b: 3 }
      }
    })
  });
  
  const data = await response.json();
  console.log('Calculator result:', data);
}
```

## 工具管理和维护

### 1. 版本控制

- 为工具添加版本信息
- 保持向后兼容性
- 记录变更日志

### 2. 文档

- 为每个工具编写详细的使用说明
- 提供示例用法
- 说明输入输出格式

### 3. 监控

- 添加性能监控
- 记录工具使用统计
- 监控错误率

## 总结

通过遵循这个指南，你可以：

1. **快速创建新工具** - 使用标准模板和最佳实践
2. **确保代码质量** - 通过类型安全和错误处理
3. **简化维护** - 通过模块化架构和清晰的文档
4. **提高可靠性** - 通过测试和监控

记住：好的工具应该是**可靠的、高效的、易于理解的**。始终考虑用户体验和代码的可维护性。
