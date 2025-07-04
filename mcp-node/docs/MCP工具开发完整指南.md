# MCP 工具开发完整指南

## 🎯 概述

本指南详细说明如何在 MCP Node 服务器中创建、注册和管理工具。我们采用模块化架构，使工具的开发、维护和扩展变得简单高效。

## 🏗️ 架构设计

```
mcp-node/src/
├── tools/                 # 工具定义目录
│   ├── index.ts          # 工具导出索引
│   ├── test-tool.ts      # 测试工具
│   ├── weather-tool.ts   # 天气查询工具
│   ├── math-tool.ts      # 数学计算工具
│   ├── bing-search-tool.ts # Bing搜索工具
│   ├── datetime-tool.ts  # 日期时间工具
│   ├── text-tool.ts      # 文本处理工具
│   └── calculator-tool.ts # 计算器工具
├── resources/            # 资源定义目录
├── prompts/             # 提示词定义目录
├── registry.ts          # 统一功能注册器
├── mcp-service.ts       # MCP 服务主管理器
└── server.ts           # 服务器入口
```

## 🚀 快速开始：自动化工具创建

### 使用工具创建脚本

```bash
# 基本用法
npm run create-tool <工具名> --description "工具描述"

# 带参数的工具
npm run create-tool user-query \
  --description "查询用户信息" \
  --param "userId:string:false:用户ID" \
  --param "includeProfile:boolean:true:是否包含用户资料"
```

### 参数格式

```
--param "参数名:类型:是否可选:描述"
```

支持的类型：
- `string` - 字符串
- `number` - 数字  
- `boolean` - 布尔值
- `string[]` - 字符串数组
- `number[]` - 数字数组
- `object` - 对象
- `any` - 任意类型

### 实际示例

```bash
# 创建文件操作工具
npm run create-tool file-operations \
  --description "文件读写操作工具" \
  --param "operation:string:false:操作类型(read/write/delete)" \
  --param "filePath:string:false:文件路径" \
  --param "content:string:true:写入内容"

# 创建 API 客户端工具
npm run create-tool api-client \
  --description "通用API客户端" \
  --param "url:string:false:API地址" \
  --param "method:string:true:HTTP方法" \
  --param "headers:object:true:请求头" \
  --param "body:object:true:请求体"
```

自动化脚本会：
1. 创建 `src/tools/{工具名}-tool.ts`
2. 更新 `src/tools/index.ts` 导出
3. 更新 `src/registry.ts` 注册代码

## 📝 手动创建工具流程

### 步骤 1: 创建工具文件

```typescript
// src/tools/my-tool.ts
import { z } from "zod";

/**
 * 工具输入参数接口
 */
export interface MyToolInput {
  param1: string;
  param2?: number;
}

/**
 * 工具 Schema 定义
 */
export const myToolSchema = {
  title: "my-tool",
  description: "我的自定义工具",
  inputSchema: {
    param1: z.string().describe("参数1描述"),
    param2: z.number().optional().describe("参数2描述")
  }
};

/**
 * 工具处理函数
 */
export async function myToolHandler({ param1, param2 }: MyToolInput) {
  try {
    console.log(`[MCPServer] my-tool called:`, { param1, param2 });
    
    // 实现工具逻辑
    const result = { 
      message: "成功", 
      param1, 
      param2,
      timestamp: new Date().toISOString()
    };
    
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result, null, 2) }
      ]
    };
  } catch (error) {
    console.error(`[MCPServer] my-tool error:`, error);
    return {
      content: [
        { type: "text" as const, text: `错误: ${error instanceof Error ? error.message : String(error)}` }
      ]
    };
  }
}
```

### 步骤 2: 更新工具索引

```typescript
// src/tools/index.ts
export {
  myToolSchema,
  myToolHandler,
  type MyToolInput
} from "./my-tool.js";
```

### 步骤 3: 更新注册器

```typescript
// src/registry.ts
import {
  // ...其他导入
  myToolSchema,
  myToolHandler
} from "./tools/index.js";

// 在 registerTools 方法中添加：
serverInstance.registerTool(
  "my-tool",
  myToolSchema,
  myToolHandler
);
```

## 🛠️ 工具类型模板

### 1. 计算工具模板

```typescript
export async function calculatorToolHandler({ operation, a, b }: CalculatorToolInput) {
  try {
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
        throw new Error(`不支持的运算: ${operation}`);
    }
    
    return {
      content: [
        { type: "text" as const, text: `${a} ${operation} ${b} = ${result}` }
      ]
    };
  } catch (error) {
    // 错误处理...
  }
}
```

### 2. HTTP API 工具模板

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

### 3. 文本处理工具模板

```typescript
export async function textProcessorToolHandler({ text, operation }: TextProcessorToolInput) {
  try {
    let result: string;
    
    switch (operation) {
      case "uppercase":
        result = text.toUpperCase();
        break;
      case "lowercase":
        result = text.toLowerCase();
        break;
      case "reverse":
        result = text.split('').reverse().join('');
        break;
      case "length":
        result = `文本长度: ${text.length}`;
        break;
      default:
        throw new Error(`不支持的操作: ${operation}`);
    }
    
    return {
      content: [
        { type: "text" as const, text: result }
      ]
    };
  } catch (error) {
    // 错误处理...
  }
}
```

## 🔧 注册程序架构

### MCPFunctionRegistry 类

```typescript
export class MCPFunctionRegistry {
  // 注册所有功能
  public static async registerAll(serverInstance: McpServer): Promise<void>
  
  // 注册工具
  private static async registerTools(serverInstance: McpServer): Promise<void>
  
  // 注册资源
  private static async registerResources(serverInstance: McpServer): Promise<void>
  
  // 注册提示词
  private static async registerPrompts(serverInstance: McpServer): Promise<void>
}
```

### 注册流程

1. **MCPService 初始化** → 创建共享的 MCP 服务器实例
2. **调用 MCPFunctionRegistry.registerAll()** → 注册所有功能
3. **分别注册** → 工具、资源、提示词
4. **幂等性保证** → 避免重复注册

## 📊 最佳实践

### 1. 工具设计原则

- **单一职责** - 每个工具专注于一个功能
- **类型安全** - 使用 TypeScript 和 Zod 确保类型安全
- **错误处理** - 完善的异常处理和错误消息
- **文档完整** - 清晰的参数描述和使用说明

### 2. 命名规范

- **工具名称** - 使用小写字母和连字符（如 `user-manager`）
- **文件命名** - `{工具名}-tool.ts` 格式
- **函数命名** - `{工具名}ToolHandler` 和 `{工具名}ToolSchema`

### 3. 参数验证

```typescript
inputSchema: {
  required_param: z.string().describe("必需参数"),
  optional_param: z.number().optional().describe("可选参数"),
  enum_param: z.enum(["option1", "option2"]).describe("枚举参数"),
  array_param: z.array(z.string()).describe("数组参数")
}
```

### 4. 错误处理

```typescript
try {
  // 工具逻辑
} catch (error) {
  console.error(`[MCPServer] ${toolName} error:`, error);
  return {
    content: [
      { 
        type: "text" as const, 
        text: `错误: ${error instanceof Error ? error.message : String(error)}` 
      }
    ]
  };
}
```

## 🧪 测试和验证

### 编译和启动

```bash
# 编译代码
npm run build:mcp-node

# 启动服务器
npm run start:mcp-node

# 开发模式（自动重启）
npm run dev:mcp-node
```

### 测试工具

```bash
# 测试计算器工具
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

### 单元测试

```typescript
// src/tools/__tests__/my-tool.test.ts
import { myToolHandler } from '../my-tool.js';

describe('My Tool', () => {
  it('should handle valid input', async () => {
    const result = await myToolHandler({
      param1: 'test',
      param2: 42
    });
    
    expect(result.content[0].text).toContain('成功');
  });

  it('should handle errors gracefully', async () => {
    // 测试错误处理
  });
});
```

## 🔍 故障排除

### 常见问题

1. **工具未注册** - 检查 registry.ts 中是否包含注册代码
2. **编译错误** - 确保语法正确，特别是导入和导出
3. **类型错误** - 检查 Zod schema 与接口定义的一致性
4. **运行时错误** - 查看服务器日志进行调试

### 调试技巧

- 使用 `console.log` 输出调试信息
- 检查服务器启动日志
- 验证工具注册状态
- 测试单个工具功能

## 📈 性能优化

### 1. 异步操作

```typescript
// 使用 Promise.all 并行处理
const [result1, result2] = await Promise.all([
  operation1(),
  operation2()
]);

// 设置合理的超时时间
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);
```

### 2. 缓存机制

```typescript
const cache = new Map<string, any>();

export async function cachedToolHandler(input: ToolInput) {
  const key = JSON.stringify(input);
  
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const result = await processInput(input);
  cache.set(key, result);
  return result;
}
```

### 3. 资源清理

```typescript
// 使用 try-finally 确保资源清理
try {
  const resource = await acquireResource();
  // 使用资源
} finally {
  await releaseResource();
}
```

## 📚 扩展示例

### 完整的文件操作工具

```typescript
import { z } from "zod";
import { promises as fs } from 'fs';
import path from 'path';

export interface FileOperationInput {
  operation: "read" | "write" | "delete" | "list";
  filePath: string;
  content?: string;
}

export const fileOperationSchema = {
  title: "file-operation",
  description: "文件操作工具",
  inputSchema: {
    operation: z.enum(["read", "write", "delete", "list"]).describe("操作类型"),
    filePath: z.string().describe("文件路径"),
    content: z.string().optional().describe("写入内容")
  }
};

export async function fileOperationHandler({ operation, filePath, content }: FileOperationInput) {
  try {
    const safePath = path.resolve(filePath);
    
    switch (operation) {
      case "read":
        const data = await fs.readFile(safePath, 'utf-8');
        return {
          content: [
            { type: "text" as const, text: data }
          ]
        };
      
      case "write":
        if (!content) throw new Error("写入操作需要提供内容");
        await fs.writeFile(safePath, content);
        return {
          content: [
            { type: "text" as const, text: `文件已写入: ${safePath}` }
          ]
        };
      
      case "delete":
        await fs.unlink(safePath);
        return {
          content: [
            { type: "text" as const, text: `文件已删除: ${safePath}` }
          ]
        };
      
      case "list":
        const files = await fs.readdir(safePath);
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(files, null, 2) }
          ]
        };
      
      default:
        throw new Error(`不支持的操作: ${operation}`);
    }
  } catch (error) {
    console.error(`[MCPServer] file-operation error:`, error);
    return {
      content: [
        { type: "text" as const, text: `文件操作错误: ${error instanceof Error ? error.message : String(error)}` }
      ]
    };
  }
}
```

## 🎯 总结

通过遵循这个指南，你可以：

1. **快速创建新工具** - 使用自动化脚本和标准模板
2. **确保代码质量** - 通过类型安全和错误处理
3. **简化维护** - 通过模块化架构和清晰的文档
4. **提高性能** - 通过最佳实践和优化技巧

记住：好的工具应该是**可靠的、高效的、易于理解的**。始终考虑用户体验和代码的可维护性。
