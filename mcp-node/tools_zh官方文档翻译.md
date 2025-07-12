# 工具（Tools）

> 让 LLM 能通过你的服务器执行操作

工具是 Model Context Protocol (MCP) 的强大原语，使服务器能够向客户端暴露可执行功能。通过工具，LLM 可以与外部系统交互、执行计算并在现实世界中采取行动。

<Note>
  工具设计为**模型可控**，即工具由服务器暴露给客户端，目的是让 AI 模型能够自动调用（通常需要人类批准）。
</Note>

## 概述

MCP 中的工具允许服务器暴露可被客户端调用的可执行函数，供 LLM 执行动作。工具的关键特性包括：

* **发现**：客户端可通过 `tools/list` 请求获取可用工具列表
* **调用**：工具通过 `tools/call` 请求被调用，服务器执行操作并返回结果
* **灵活性**：工具既可以是简单计算，也可以是复杂 API 集成

与 [资源](/docs/concepts/resources) 类似，工具通过唯一名称标识，并可包含描述信息以指导其用法。但与资源不同，工具代表动态操作，可能修改状态或与外部系统交互。

## 工具定义结构

每个工具需定义如下结构：

```typescript
{
  name: string;          // 工具唯一标识
  description?: string;  // 人类可读描述
  inputSchema: {         // 工具参数的 JSON Schema
    type: "object",
    properties: { ... }  // 工具参数定义
  },
  annotations?: {        // 可选，工具行为提示
    title?: string;      // 工具人类可读标题
    readOnlyHint?: boolean;    // 只读提示
    destructiveHint?: boolean; // 破坏性操作提示
    idempotentHint?: boolean;  // 幂等性提示
    openWorldHint?: boolean;   // 是否与外部实体交互
  }
}
```

## 工具实现示例

<Tabs>
  <Tab title="TypeScript">
    ```typescript
    const server = new Server({
      name: "example-server",
      version: "1.0.0"
    }, {
      capabilities: {
        tools: {}
      }
    });

    // 定义工具列表
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [{
          name: "calculate_sum",
          description: "Add two numbers together",
          inputSchema: {
            type: "object",
            properties: {
              a: { type: "number" },
              b: { type: "number" }
            },
            required: ["a", "b"]
          }
        }]
      };
    });

    // 工具调用处理
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name === "calculate_sum") {
        const { a, b } = request.params.arguments;
        return {
          content: [
            {
              type: "text",
              text: String(a + b)
            }
          ]
        };
      }
      throw new Error("Tool not found");
    });
    ```
  </Tab>

  <Tab title="Python">
    ```python
    app = Server("example-server")

    @app.list_tools()
    async def list_tools() -> list[types.Tool]:
        return [
            types.Tool(
                name="calculate_sum",
                description="Add two numbers together",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "a": {"type": "number"},
                        "b": {"type": "number"}
                    },
                    "required": ["a", "b"]
                }
            )
        ]

    @app.call_tool()
    async def call_tool(
        name: str,
        arguments: dict
    ) -> list[types.TextContent | types.ImageContent | types.EmbeddedResource]:
        if name == "calculate_sum":
            a = arguments["a"]
            b = arguments["b"]
            result = a + b
            return [types.TextContent(type="text", text=str(result))]
        raise ValueError(f"Tool not found: {name}")
    ```
  </Tab>
</Tabs>

## 工具模式示例

### 系统操作

```typescript
{
  name: "execute_command",
  description: "Run a shell command",
  inputSchema: {
    type: "object",
    properties: {
      command: { type: "string" },
      args: { type: "array", items: { type: "string" } }
    }
  }
}
```

### API 集成

```typescript
{
  name: "github_create_issue",
  description: "Create a GitHub issue",
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string" },
      body: { type: "string" },
      labels: { type: "array", items: { type: "string" } }
    }
  }
}
```

### 数据处理

```typescript
{
  name: "analyze_csv",
  description: "Analyze a CSV file",
  inputSchema: {
    type: "object",
    properties: {
      filepath: { type: "string" },
      operations: {
        type: "array",
        items: {
          enum: ["sum", "average", "count"]
        }
      }
    }
  }
}
```

## 最佳实践

1. 提供清晰的名称和描述
2. 用详细的 JSON Schema 定义参数
3. 在描述中包含用法示例
4. 实现健壮的错误处理和校验
5. 长操作建议支持进度上报
6. 工具操作应聚焦且原子化
7. 文档化返回值结构
8. 实现超时处理
9. 对资源密集型操作做限流
10. 日志记录工具调用

### 工具名冲突

- 多 MCP Server 可能暴露同名工具，建议用唯一前缀（如 serverName___toolName、随机前缀、URI 前缀等）区分。
- 初始化流中的 server name 不保证唯一，不建议用于冲突消解。

## 安全注意事项

### 输入校验
- 严格校验所有参数
- 路径、命令、URL 等需做安全检查
- 检查参数长度、范围，防止注入

### 访问控制
- 需要时实现认证、鉴权
- 审计工具调用
- 限流防滥用
- 监控异常

### 错误处理
- 不暴露内部错误给客户端
- 日志记录安全相关错误
- 超时与资源清理
- 校验返回值

## 工具发现与更新

- 客户端可随时获取工具列表
- 服务器可通过 `notifications/tools/list_changed` 通知客户端工具变更
- 工具可动态增删
- 工具定义可更新（需谨慎）

## 错误处理

- 工具错误应通过 result 对象返回（isError 字段和 content），而非 MCP 协议级错误，便于 LLM 识别和处理。

```typescript
try {
  // Tool operation
  const result = performOperation();
  return {
    content: [
      {
        type: "text",
        text: `Operation successful: ${result}`
      }
    ]
  };
} catch (error) {
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: `Error: ${error.message}`
      }
    ]
  };
}
```

## 工具注解

- 注解用于提示工具行为（只读、破坏性、幂等、外部依赖等），便于客户端 UI 呈现和管理。
- 注解仅为提示，不能作为安全决策依据。

### 注解示例

```typescript
{
  name: "web_search",
  description: "Search the web for information",
  inputSchema: { ... },
  annotations: {
    title: "Web Search",
    readOnlyHint: true,
    openWorldHint: true
  }
}
```

## 测试建议

- 功能测试、集成测试、安全测试、性能测试、错误处理测试等全覆盖。 