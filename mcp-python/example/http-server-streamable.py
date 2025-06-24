from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, Field
from typing import Optional, Union, List, NamedTuple
import requests
import json
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
import uvicorn

mcp = FastMCP(
    '测试mcp server',
    version="11.45.14",
    host="127.0.0.1",
    port=8000
)

@mcp.resource(
    uri="greeting://{name}",
    name='greeting',
    description='用于演示的一个资源协议'
)
def get_greeting(name: str) -> str:
    return f"Hello, {name}!"

@mcp.prompt(
    name='translate',
    description='进行翻译的prompt'
)
def translate(message: str) -> str:
    return f'请将下面的话语翻译成中文：\n\n{message}'

class PathParams(BaseModel):
    start: str
    end: str

@mcp.tool(name="test",description="用来测试")
def test(
    params: PathParams,
    test1: str,
    test2: Union[str, List[str]] = Field("", description="测试参数2"),
    test3: Optional[str] = Field(None, description="测试参数3")
):
    return [test1, test2, test3, params]

class CityWeather(NamedTuple):
    city_name_en: str
    city_name_cn: str
    city_code: str
    temp: str
    wd: str
    ws: str
    sd: str
    aqi: str
    weather: str

def get_city_weather_by_city_name(city_code: str) -> Optional[CityWeather]:
    if not city_code:
        print(f"找不到{city_code}对应的城市")
        return None
    try:
        url = f"http://d1.weather.com.cn/sk_2d/{city_code}.html"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36 Edg/115.0.0.0",
            "Host": "d1.weather.com.cn",
            "Referer": "http://www.weather.com.cn/"
        }
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        content = response.text.encode('latin1').decode('unicode_escape')
        json_start = content.find("{")
        json_str = content[json_start:]
        weather_data = json.loads(json_str)
        return CityWeather(
            city_name_en=weather_data.get("nameen", ""),
            city_name_cn=weather_data.get("cityname", "").encode('latin1').decode('utf-8'),
            city_code=weather_data.get("city", ""),
            temp=weather_data.get("temp", ""),
            wd=weather_data.get("wd", "").encode('latin1').decode('utf-8'),
            ws=weather_data.get("ws", "").encode('latin1').decode('utf-8'),
            sd=weather_data.get("sd", ""),
            aqi=weather_data.get("aqi", ""),
            weather=weather_data.get("weather", "").encode('latin1').decode('utf-8')
        )
    except Exception as e:
        print(f"获取天气信息失败: {str(e)}")
        return None

@mcp.tool(
    name='weather',
    description='根据城市天气预报的城市编码 (int)，获取指定城市的天气信息'
)
def get_weather_by_code(city_code: int) -> str:
    city_weather = get_city_weather_by_city_name(city_code)
    return str(city_weather)

if __name__ == '__main__':
    app = mcp.streamable_http_app()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],  # 或 ["*"]
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )
    uvicorn.run(app, host="127.0.0.1", port=8000)

