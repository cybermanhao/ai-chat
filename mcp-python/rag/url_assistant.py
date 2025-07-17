import os
import json
import logging
import requests
from fastapi import FastAPI, WebSocket
import uvicorn
from typing import List, Dict, Any
from ws_tools import ws_tool, ws_endpoint

app = FastAPI()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
)
logger = logging.getLogger(__name__)

# 如果 ragservice 可直接 import，则直接调用其方法；如需微服务可改为 ws/HTTP 远程调用
from rag_service import retrieve  # 假设 rag_service.py 在同目录或包下
# 注意：Python 文件名不能有中划线，应为 rag_service.py

@ws_tool('query_url')
async def query_url(natural_language_input: str) -> List[Dict]:
    try:
        result = await retrieve(natural_language_input, top_k=1, store="url")
        logger.info(f"query_url via ragservice result: {result}")
        return result
    except Exception as e:
        logger.error(f"query_url error: {e}")
        return [{"error": str(e)}]

@ws_tool('term_match')
async def term_match_tool(text: str, top_k: int = 3) -> List[Dict]:
    try:
        result = await rag_term_match_tool(text, top_k)
        logger.info(f"term_match via ragservice result: {result}")
        return result
    except Exception as e:
        logger.error(f"term_match_tool error: {e}")
        return [{"error": f"term_match_tool failed: {str(e)}"}]

@app.websocket("/ws")
async def ws_main(ws: WebSocket):
    await ws_endpoint(ws, logger)

if __name__ == "__main__":
    logger.info("Starting URL Assistant WebSocket server on 127.0.0.1:9101")
    uvicorn.run(app, host="0.0.0.0", port=9101)
