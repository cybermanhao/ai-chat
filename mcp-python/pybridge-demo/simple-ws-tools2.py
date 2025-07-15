import json
from fastapi import FastAPI, WebSocket
import uvicorn
import logging

app = FastAPI()

# 通用日志模块配置
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
)
logger = logging.getLogger(__name__)

# 工具1：字符串反转
def reverse(text):
    return text[::-1]

# 工具2：判断是否为回文
def is_palindrome(text):
    s = str(text)
    return s == s[::-1]

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await ws.accept()
    logger.info("WebSocket connection accepted")
    while True:
        try:
            data = await ws.receive_text()
            logger.info(f"Received data: {data}")
            req = json.loads(data)
            if req.get('func') == 'reverse':
                result = reverse(req['text'])
                logger.info(f"reverse result: {result}")
                await ws.send_text(json.dumps({'result': result}))
            elif req.get('func') == 'is_palindrome':
                result = is_palindrome(req['text'])
                logger.info(f"is_palindrome result: {result}")
                await ws.send_text(json.dumps({'result': result}))
            else:
                logger.warning(f"Unknown function: {req.get('func')}")
                await ws.send_text(json.dumps({'error': 'Unknown function'}))
        except Exception as e:
            logger.error(f"Error handling request: {e}", exc_info=True)
            await ws.send_text(json.dumps({'error': str(e)}))

if __name__ == "__main__":
    logger.info("Starting WebSocket server on 127.0.0.1:9001")
    uvicorn.run(app, host="127.0.0.1", port=9001)
