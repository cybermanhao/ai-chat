/**
 * Weather 工具 - 使用与 example 一致的 JSON Schema 格式
 */

/**
 * Weather 工具的输入参数类型
 */
export interface WeatherToolInput {
  city_code: number;
}

/**
 * Weather 工具的 Schema 定义 - 使用标准 JSON Schema 格式
 */
export const weatherToolSchema = {
  name: "weather", // 添加 name 字段
  description: "根据城市天气预报的城市编码 (int)，获取指定城市的天气信息",
  inputSchema: {
    type: "object",
    properties: {
      city_code: {
        type: "number", // 改为 number，符合 TypeScript 类型
        description: "城市编码",
      },
    },
    required: ["city_code"],
  },
};

/**
 * 城市天气信息类型
 */
interface CityWeather {
  city_name_en: string;
  city_name_cn: string;
  city_code: string;
  temp: string;
  wd: string;  // 风向
  ws: string;  // 风力
  sd: string;  // 湿度
  aqi: string; // 空气质量指数
  weather: string; // 天气状况
}

/**
 * 根据城市编码获取天气信息 - 基于 Python 示例的 API
 */
async function getCityWeatherByCityCode(cityCode: number): Promise<CityWeather | null> {
  if (!cityCode) {
    console.log(`找不到${cityCode}对应的城市`);
    return null;
  }

  try {
    // 构造请求URL
    const url = `http://d1.weather.com.cn/sk_2d/${cityCode}.html`;

    // 设置请求头
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.0.0",
      "Host": "d1.weather.com.cn",
      "Referer": "http://www.weather.com.cn/"
    };

    // 发送HTTP请求
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    let content = await response.text();
    
    // 处理编码问题（类似 Python 中的 encode('latin1').decode('unicode_escape')）
    // 在 JavaScript 中，我们直接查找 JSON 部分
    const jsonStart = content.indexOf("{");
    if (jsonStart === -1) {
      throw new Error("无法找到JSON数据");
    }
    
    const jsonStr = content.substring(jsonStart);
    const weatherData = JSON.parse(jsonStr);

    // 构造返回对象
    return {
      city_name_en: weatherData.nameen || "",
      city_name_cn: weatherData.cityname || "",
      city_code: weatherData.city || "",
      temp: weatherData.temp || "",
      wd: weatherData.wd || "",
      ws: weatherData.ws || "",
      sd: weatherData.sd || "",
      aqi: weatherData.aqi || "",
      weather: weatherData.weather || ""
    };

  } catch (error) {
    console.error(`获取天气信息失败: ${error}`);
    return null;
  }
}

/**
 * Weather 工具的实现函数
 */
export async function weatherToolHandler({ city_code }: WeatherToolInput) {
  console.log(`[MCPServer] weather tool called, city_code:`, city_code);
  
  try {
    // 调用真实的天气 API
    const cityWeather = await getCityWeatherByCityCode(city_code);
    
    if (!cityWeather) {
      return {
        content: [
          { 
            type: "text" as const, 
            text: `无法获取城市编码 ${city_code} 的天气信息` 
          }
        ]
      };
    }

    // 格式化天气信息，类似 Python 中的返回格式
    const weatherInfo = {
      城市中文名: cityWeather.city_name_cn,
      城市英文名: cityWeather.city_name_en,
      城市编码: cityWeather.city_code,
      当前气温: `${cityWeather.temp}°C`,
      风向: cityWeather.wd,
      风力: cityWeather.ws,
      湿度: cityWeather.sd,
      空气质量指数: cityWeather.aqi,
      天气状况: cityWeather.weather
    };

    const result = {
      content: [
        { 
          type: "text" as const, 
          text: JSON.stringify(weatherInfo, null, 2)
        }
      ]
    };

    console.log(`[MCPServer] weather tool result:`, result);
    return result;

  } catch (error) {
    console.error(`[MCPServer] weather tool error:`, error);
    return {
      content: [
        { 
          type: "text" as const, 
          text: `获取天气信息时发生错误: ${error instanceof Error ? error.message : String(error)}` 
        }
      ]
    };
  }
}
