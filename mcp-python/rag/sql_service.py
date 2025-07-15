import json
import logging
from fastapi import FastAPI, WebSocket
import uvicorn
from ws_tools import ws_tool, ws_endpoint

app = FastAPI()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
)
logger = logging.getLogger(__name__)

@ws_tool('sql_query')
async def sql_query(sql: str) -> dict:
    logger.info(f"SQL 查询: {sql}")
    # 示例：实际应接入数据库
    return {"result": f"执行结果 for SQL: {sql}"}

@app.websocket("/ws")
async def ws_main(ws: WebSocket):
    await ws_endpoint(ws, logger)

if __name__ == "__main__":
    logger.info("Starting SQLService WebSocket server on 127.0.0.1:9300")
    uvicorn.run(app, host="127.0.0.1", port=9300)
