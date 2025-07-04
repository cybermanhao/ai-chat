# MCP 工具创建流程与注册程序总结

## 📋 概述

本文档总结了 MCP Node 服务器的工具创建流程和注册程序，包括自动化脚本和手动步骤。

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

## 🛠️ 已实现的工具

### 1. 基础工具
- **test**: 测试工具，用于验证服务器功能
- **weather**: 天气查询工具（模拟实现）

### 2. 数学计算工具
- **math**: 高级数学运算（两数之和等）
- **calculator**: 基础四则运算计算器

### 3. 搜索与信息工具
- **bing_search**: Bing搜索工具（模拟实现）
- **datetime**: 获取当前日期时间

### 4. 文本处理工具
- **text_processor**: 文本处理工具（大小写转换、长度计算等）

## 🚀 自动化工具创建流程

### 使用工具创建脚本

```bash
# 基本语法
npm run create-tool <工具名> --description "工具描述" --param "参数定义"

# 参数格式
--param "参数名:类型:是否可选:描述"

# 实际示例
npm run create-tool file-handler \
  --description "文件操作处理工具" \
  --param "operation:string:false:操作类型" \
  --param "filePath:string:false:文件路径" \
  --param "content:string:true:文件内容"
```

### 脚本功能

自动化脚本 `scripts/create-tool.js` 会：

1. **生成工具文件** - 在 `src/tools/` 目录创建标准模板
2. **更新索引文件** - 自动添加到 `src/tools/index.ts`
3. **更新注册器** - 自动注册到 `src/registry.ts`
4. **提供使用说明** - 生成测试命令和后续步骤

## 📝 手动创建工具流程

### 步骤 1: 创建工具文件

```typescript
// src/tools/my-tool.ts
import { z } from "zod";

export interface MyToolInput {
  param1: string;
  param2?: number;
}

export const myToolSchema = {
  title: "my-tool",
  description: "我的自定义工具",
  inputSchema: {
    param1: z.string().describe("参数1描述"),
    param2: z.number().optional().describe("参数2描述")
  }
};

export async function myToolHandler({ param1, param2 }: MyToolInput) {
  try {
    // 工具实现逻辑
    const result = { param1, param2, success: true };
    
    return {
      content: [
        { type: "text" as const, text: JSON.stringify(result) }
      ]
    };
  } catch (error) {
    return {
      content: [
        { type: "text" as const, text: `错误: ${error.message}` }
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
  myToolSchema,
  myToolHandler
} from "./tools/index.js";

// 在 registerTools 方法中添加
serverInstance.registerTool(
  "my-tool",
  myToolSchema,
  myToolHandler
);
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

## 📊 服务器状态监控

### 当前注册状态

```
[MCPFunctionRegistry] 工具注册完成: test, weather, math, bing_search, datetime, text_processor, calculator
[MCPFunctionRegistry] 资源注册完成: greeting
[MCPFunctionRegistry] 提示词注册完成: translate
[MCPFunctionRegistry] 所有功能注册完成
```

### 会话管理

- **共享服务器实例** - 避免重复注册功能
- **会话ID管理** - 正确的会话复用和清理
- **自动清理机制** - 定期清理过期会话

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

### 测试脚本

- `npm run test:mcp-registration` - 测试注册修复
- `npm run test:mcp-new-tools` - 测试新工具

## 📚 最佳实践

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

- **必需参数** - 明确标识必需的输入参数
- **可选参数** - 使用 `.optional()` 标记
- **类型限制** - 使用 enum 限制可选值
- **描述信息** - 为每个参数提供清晰的描述

### 4. 返回格式

```typescript
return {
  content: [
    { 
      type: "text" as const, 
      text: JSON.stringify(result, null, 2) // 格式化输出
    }
  ]
};
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

## 📈 扩展性考虑

### 1. 模块化设计

- 工具、资源、提示词分离
- 统一的注册机制
- 清晰的文件结构

### 2. 可维护性

- 自动化创建脚本
- 标准化模板
- 完整的文档

### 3. 性能优化

- 共享服务器实例
- 会话复用机制
- 资源清理策略

## 🎯 总结

通过实现模块化的工具创建流程和统一的注册程序，我们成功构建了一个：

- **易于扩展** - 快速添加新工具
- **类型安全** - 完整的 TypeScript 支持
- **高度可维护** - 清晰的架构和文档
- **性能优化** - 避免重复注册和资源浪费

开发者现在可以：
1. 使用自动化脚本快速创建工具
2. 遵循标准化的开发流程
3. 确保代码质量和一致性
4. 轻松维护和扩展功能

这个架构为未来的功能扩展和维护提供了坚实的基础。
