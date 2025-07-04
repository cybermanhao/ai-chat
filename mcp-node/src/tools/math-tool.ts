/**
 * Math 工具 - 使用标准 JSON Schema 格式
 */

/**
 * Math 工具的输入参数类型
 */
export interface MathToolInput {
  operation: "add" | "subtract" | "multiply" | "divide";
  numbers: number[];
}

/**
 * Math 工具的 Schema 定义 - 使用标准 JSON Schema 格式
 */
export const mathToolSchema = {
  name: "math",
  description: "执行基础数学运算，支持加减乘除",
  inputSchema: {
    type: "object",
    properties: {
      operation: {
        type: "string",
        enum: ["add", "subtract", "multiply", "divide"],
        description: "运算类型"
      },
      numbers: {
        type: "array",
        items: {
          type: "number"
        },
        minItems: 2,
        description: "至少需要两个数字的数组"
      }
    },
    required: ["operation", "numbers"]
  }
};

/**
 * Math 工具的实现函数
 */
export async function mathToolHandler({ operation, numbers }: MathToolInput) {
  console.log(`[MCPServer] math tool called, operation: ${operation}, numbers:`, numbers);
  
  let result: number;
  
  switch (operation) {
    case "add":
      result = numbers.reduce((sum, num) => sum + num, 0);
      break;
    case "subtract":
      result = numbers.reduce((diff, num, index) => index === 0 ? num : diff - num);
      break;
    case "multiply":
      result = numbers.reduce((product, num) => product * num, 1);
      break;
    case "divide":
      result = numbers.reduce((quotient, num, index) => {
        if (index === 0) return num;
        if (num === 0) throw new Error("除数不能为零");
        return quotient / num;
      });
      break;
    default:
      throw new Error(`不支持的运算类型: ${operation}`);
  }
  
  const operationText = {
    add: "加法",
    subtract: "减法", 
    multiply: "乘法",
    divide: "除法"
  }[operation];
  
  const response = {
    content: [
      { 
        type: "text" as const, 
        text: `${operationText}运算结果：${numbers.join(operation === "add" ? " + " : operation === "subtract" ? " - " : operation === "multiply" ? " × " : " ÷ ")} = ${result}`
      }
    ]
  };
  
  console.log(`[MCPServer] math tool result:`, response);
  return response;
}
