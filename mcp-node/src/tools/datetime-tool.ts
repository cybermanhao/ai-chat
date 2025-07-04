/**
 * DateTime 工具 - 使用标准 JSON Schema 格式
 */

/**
 * DateTime 工具的输入参数类型
 */
export interface DateTimeToolInput {
  format?: "iso" | "local" | "timestamp" | "readable";
  timezone?: string;
}

/**
 * DateTime 工具的 Schema 定义 - 使用标准 JSON Schema 格式
 */
export const dateTimeToolSchema = {
  name: "datetime",
  description: "获取当前日期和时间，支持多种格式和时区",
  inputSchema: {
    type: "object",
    properties: {
      format: {
        type: "string",
        enum: ["iso", "local", "timestamp", "readable"],
        default: "readable",
        description: "输出格式"
      },
      timezone: {
        type: "string",
        description: "时区（可选）"
      }
    },
    required: []
  }
};

/**
 * DateTime 工具的实现函数
 */
export async function dateTimeToolHandler({ format = "readable", timezone }: DateTimeToolInput) {
  console.log(`[MCPServer] datetime tool called, format: ${format}, timezone: ${timezone || "system"}`);
  
  try {
    const now = new Date();
    let result: string;
    
    switch (format) {
      case "iso":
        result = now.toISOString();
        break;
      case "local":
        result = now.toLocaleString();
        break;
      case "timestamp":
        result = now.getTime().toString();
        break;
      case "readable":
      default:
        const options: Intl.DateTimeFormatOptions = {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          weekday: 'long',
          timeZoneName: 'short'
        };
        
        if (timezone) {
          options.timeZone = timezone;
        }
        
        result = now.toLocaleDateString('zh-CN', options);
        break;
    }
    
    // 添加时区信息
    const timezoneInfo = timezone ? ` (${timezone})` : ` (${Intl.DateTimeFormat().resolvedOptions().timeZone})`;
    
    const response = {
      content: [
        { 
          type: "text" as const, 
          text: `🕐 当前时间${timezoneInfo}：\n${result}`
        }
      ]
    };
    
    console.log(`[MCPServer] datetime tool result:`, response);
    return response;
    
  } catch (error) {
    console.error(`[MCPServer] datetime tool error:`, error);
    
    return {
      content: [
        { 
          type: "text" as const, 
          text: `❌ 获取时间失败：${error instanceof Error ? error.message : String(error)}`
        }
      ]
    };
  }
}
