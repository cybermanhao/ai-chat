import json
from fastapi import FastAPI, WebSocket
import uvicorn
from pydantic import BaseModel, Field
from typing import Optional, Union, List, NamedTuple
import requests
import logging

app = FastAPI()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
)
logger = logging.getLogger(__name__)

# greeting 工具
async def greeting(name: str) -> str:
    return f"Hello, {name}!"

# translate 工具
async def translate(message: str) -> str:
    return f'请将下面的话语翻译成中文：\n\n{message}'

# test 工具
class PathParams(BaseModel):
    start: str
    end: str

async def test(params: dict, test1: str, test2: Union[str, List[str]] = "", test3: Optional[str] = None):
    return [test1, test2, test3, params]

# weather 工具
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
        return None
    try:
        url = f"http://d1.weather.com.cn/sk_2d/{city_code}.html"
        headers = {
            "User-Agent": "Mozilla/5.0",
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
        return None

async def weather(city_code: int) -> str:
    city_weather = get_city_weather_by_city_name(str(city_code))
    return str(city_weather)

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    logger.info("WebSocket connection accepted")
    while True:
        try:
            data = await ws.receive_text()
            logger.info(f"Received data: {data}")
            req = json.loads(data)
            func = req.get('func')
            if func == 'greeting':
                result = await greeting(req['name'])
                logger.info(f"greeting result: {result}")
                await ws.send_text(json.dumps({'result': result}))
            elif func == 'translate':
                result = await translate(req['message'])
                logger.info(f"translate result: {result}")
                await ws.send_text(json.dumps({'result': result}))
            elif func == 'test':
                result = await test(req['params'], req['test1'], req.get('test2', ''), req.get('test3'))
                logger.info(f"test result: {result}")
                await ws.send_text(json.dumps({'result': result}))
            elif func == 'weather':
                result = await weather(req['city_code'])
                logger.info(f"weather result: {result}")
                await ws.send_text(json.dumps({'result': result}))
            else:
                logger.warning(f"Unknown function: {func}")
                await ws.send_text(json.dumps({'error': 'Unknown function'}))
        except Exception as e:
            logger.error(f"Error handling request: {e}", exc_info=True)
            await ws.send_text(json.dumps({'error': str(e)}))

if __name__ == "__main__":
    logger.info("Starting WebSocket server on 127.0.0.1:9000")
    uvicorn.run(app, host="127.0.0.1", port=9000)
