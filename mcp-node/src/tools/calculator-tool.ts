/**
 * 简单计算器工具 - 使用标准 JSON Schema 格式
 */

/**
 * calculator 工具的输入参数类型
 */
export interface CalculatorToolInput {
  operation: "add" | "subtract" | "multiply" | "divide";
  a: number;
  b: number;
}

/**
 * calculator 工具的 Schema 定义 - 使用标准 JSON Schema 格式
 */
export const calculatorToolSchema = {
  name: "calculator",
  description: "简单计算器工具，支持基本的四则运算",
  inputSchema: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["add", "subtract", "multiply", "divide"],
        description: "运算类型(add/subtract/multiply/divide)"
      },
      a: {
        type: "number",
        description: "第一个数"
      },
      b: {
        type: "number", 
        description: "第二个数"
      }
    },
    required: ["operation", "a", "b"]
  }
};

/**
 * calculator 工具的实现函数
 */
export async function calculatorToolHandler({ operation, a, b }: CalculatorToolInput) {
  try {
    console.log(`[MCPServer] calculator tool called:`, { operation, a, b });
    
    let result: number;
    let operationSymbol: string;
    
    switch (operation) {
      case "add":
        result = a + b;
        operationSymbol = "+";
        break;
      case "subtract":
        result = a - b;
        operationSymbol = "-";
        break;
      case "multiply":
        result = a * b;
        operationSymbol = "×";
        break;
      case "divide":
        if (b === 0) {
          throw new Error("除数不能为零");
        }
        result = a / b;
        operationSymbol = "÷";
        break;
      default:
        throw new Error(`不支持的运算类型: ${operation}`);
    }
    
    const response = {
      calculation: `${a} ${operationSymbol} ${b} = ${result}`,
      result: result,
      operation: operation,
      operands: { a, b }
    };
    
    return {
      content: [
        { 
          type: "text" as const, 
          text: JSON.stringify(response, null, 2)
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
