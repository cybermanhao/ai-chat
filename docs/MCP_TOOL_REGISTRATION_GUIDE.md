# MCP 工具注册程序快速指南

## 自动化工具创建

我们提供了自动化脚本来简化新工具的创建和注册过程。

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

### 示例：创建文件操作工具

```bash
npm run create-tool file-operations \
  --description "文件读写操作工具" \
  --param "operation:string:false:操作类型(read/write/delete)" \
  --param "filePath:string:false:文件路径" \
  --param "content:string:true:写入内容"
```

这将自动：
1. 创建 `src/tools/file-operations-tool.ts`
2. 更新 `src/tools/index.ts` 导出
3. 更新 `src/registry.ts` 注册代码

### 手动注册流程

如果你需要手动创建工具，按以下步骤：

#### 1. 创建工具文件

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
    param1: z.string().describe("参数1"),
    param2: z.number().optional().describe("参数2")
  }
};

export async function myToolHandler({ param1, param2 }: MyToolInput) {
  try {
    console.log(`[MCPServer] my-tool called:`, { param1, param2 });
    
    // 工具逻辑
    const result = { message: "成功", param1, param2 };
    
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

#### 2. 更新工具索引

```typescript
// src/tools/index.ts
export {
  myToolSchema,
  myToolHandler,
  type MyToolInput
} from "./my-tool.js";
```

#### 3. 更新注册器

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

### 工具类型模板

#### API 调用工具
```bash
npm run create-tool api-client \
  --description "通用API客户端" \
  --param "url:string:false:API地址" \
  --param "method:string:true:HTTP方法" \
  --param "headers:object:true:请求头" \
  --param "body:object:true:请求体"
```

#### 数据处理工具
```bash
npm run create-tool data-processor \
  --description "数据处理工具" \
  --param "data:any:false:输入数据" \
  --param "operation:string:false:处理操作" \
  --param "options:object:true:处理选项"
```

#### 文本分析工具
```bash
npm run create-tool text-analyzer \
  --description "文本分析工具" \
  --param "text:string:false:待分析文本" \
  --param "analysis_type:string:false:分析类型" \
  --param "language:string:true:文本语言"
```

### 编译和测试

```bash
# 编译代码
npm run build:mcp-node

# 启动服务器
npm run start:mcp-node

# 测试工具（在另一个终端）
curl -X POST http://127.0.0.1:8000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "my-tool",
      "arguments": {
        "param1": "测试值",
        "param2": 42
      }
    }
  }'
```

### 最佳实践

1. **命名规范**：使用小写字母和连字符，如 `user-manager`
2. **错误处理**：始终包含 try-catch 块
3. **日志记录**：记录工具调用和错误信息
4. **参数验证**：使用 Zod schema 进行严格验证
5. **文档描述**：为工具和参数提供清晰的描述

### 常见问题

**Q: 工具创建后无法调用？**
A: 确保已编译代码并重启服务器

**Q: 参数类型错误？**
A: 检查 Zod schema 定义是否正确

**Q: 工具未注册？**
A: 确认 `registry.ts` 中包含了工具注册代码

**Q: 如何调试工具？**
A: 查看服务器控制台日志，使用 console.log 输出调试信息
