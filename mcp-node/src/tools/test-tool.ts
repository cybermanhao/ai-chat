/**
 * Test 工具 - 使用标准 JSON Schema 格式
 */

/**
 * Test 工具的输入参数类型
 */
export interface TestToolInput {
  params: { start: string; end: string };
  test1: string;
  test2?: string | string[];
  test3?: string;
}

/**
 * Test 工具的 Schema 定义 - 使用标准 JSON Schema 格式
 */
export const testToolSchema = {
  name: "test",
  description: "用来测试",
  inputSchema: {
    type: "object",
    properties: {
      params: {
        type: "object",
        properties: {
          start: { type: "string" },
          end: { type: "string" }
        },
        required: ["start", "end"]
      },
      test1: {
        type: "string"
      },
      test2: {
        // 使用空对象，与成功请求保持一致
      },
      test3: {
        type: "string"
      }
    },
    required: ["params", "test1"]
  }
};

/**
 * Test 工具的实现函数
 */
export async function testToolHandler({ params, test1, test2, test3 }: {
  params: { start: string; end: string };
  test1: string;
  test2?: string | string[];
  test3?: string;
}) {
  console.log(`[MCPServer] test tool called, params:`, { params, test1, test2, test3 });
  
  const result = {
    content: [
      { type: "text" as const, text: JSON.stringify([test1, test2, test3, params]) }
    ]
  };
  
  console.log(`[MCPServer] test tool result:`, result);
  return result;
}
