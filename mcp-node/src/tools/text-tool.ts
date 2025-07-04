/**
 * Text 工具 - 使用标准 JSON Schema 格式
 */

/**
 * Text 工具的输入参数类型
 */
export interface TextToolInput {
  text: string;
  operation: "count" | "uppercase" | "lowercase" | "reverse" | "words" | "lines" | "encode" | "decode";
  encoding?: "base64" | "uri";
}

/**
 * Text 工具的 Schema 定义 - 使用标准 JSON Schema 格式
 */
export const textToolSchema = {
  name: "text_processor",
  description: "文本处理工具，支持字符统计、大小写转换、编码解码等操作",
  inputSchema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "要处理的文本"
      },
      operation: {
        type: "string",
        enum: ["count", "uppercase", "lowercase", "reverse", "words", "lines", "encode", "decode"],
        description: "操作类型"
      },
      encoding: {
        type: "string",
        enum: ["base64", "uri"],
        description: "编码类型（仅用于encode/decode操作）"
      }
    },
    required: ["text", "operation"]
  }
};

/**
 * Text 工具的实现函数
 */
export async function textToolHandler({ text, operation, encoding }: TextToolInput) {
  console.log(`[MCPServer] text processor tool called, operation: ${operation}, text length: ${text.length}`);
  
  try {
    let result: string;
    
    switch (operation) {
      case "count":
        const charCount = text.length;
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        const lineCount = text.split('\n').length;
        result = `字符数：${charCount}\n单词数：${wordCount}\n行数：${lineCount}`;
        break;
        
      case "uppercase":
        result = text.toUpperCase();
        break;
        
      case "lowercase":
        result = text.toLowerCase();
        break;
        
      case "reverse":
        result = text.split('').reverse().join('');
        break;
        
      case "words":
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        result = `单词列表（共${words.length}个）：\n${words.map((word, index) => `${index + 1}. ${word}`).join('\n')}`;
        break;
        
      case "lines":
        const lines = text.split('\n');
        result = `行列表（共${lines.length}行）：\n${lines.map((line, index) => `${index + 1}. ${line}`).join('\n')}`;
        break;
        
      case "encode":
        if (!encoding) {
          throw new Error("编码操作需要指定编码类型");
        }
        if (encoding === "base64") {
          result = Buffer.from(text, 'utf8').toString('base64');
        } else if (encoding === "uri") {
          result = encodeURIComponent(text);
        } else {
          throw new Error(`不支持的编码类型: ${encoding}`);
        }
        break;
        
      case "decode":
        if (!encoding) {
          throw new Error("解码操作需要指定编码类型");
        }
        if (encoding === "base64") {
          result = Buffer.from(text, 'base64').toString('utf8');
        } else if (encoding === "uri") {
          result = decodeURIComponent(text);
        } else {
          throw new Error(`不支持的解码类型: ${encoding}`);
        }
        break;
        
      default:
        throw new Error(`不支持的操作类型: ${operation}`);
    }
    
    const operationNames = {
      count: "文本统计",
      uppercase: "转换为大写",
      lowercase: "转换为小写",
      reverse: "反转文本",
      words: "单词分析",
      lines: "行分析",
      encode: `${encoding?.toUpperCase()} 编码`,
      decode: `${encoding?.toUpperCase()} 解码`
    };
    
    const response = {
      content: [
        { 
          type: "text" as const, 
          text: `📝 ${operationNames[operation]}结果：\n\n${result}`
        }
      ]
    };
    
    console.log(`[MCPServer] text processor tool completed, operation: ${operation}`);
    return response;
    
  } catch (error) {
    console.error(`[MCPServer] text processor tool error:`, error);
    
    return {
      content: [
        { 
          type: "text" as const, 
          text: `❌ 文本处理失败：${error instanceof Error ? error.message : String(error)}`
        }
      ]
    };
  }
}
