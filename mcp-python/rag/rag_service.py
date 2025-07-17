import json
import logging
from fastapi import FastAPI, WebSocket
import uvicorn
from typing import List, Dict, Any
from ws_tools import ws_tool, ws_endpoint
from vector_service import retrieve_mock as vector_retrieve

app = FastAPI()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
)
logger = logging.getLogger(__name__)

class Document:
    def __init__(self, id: str, content: str):
        self.id = id
        self.content = content
    def to_dict(self):
        return {"id": self.id, "content": self.content}

@ws_tool('retrieve')
async def retrieve(question: str, top_k: int = 5, store: str = 'url') -> List[Dict]:
    logger.info(f"RAGService 检索: question={question}, top_k={top_k}")
    # 直接调用 vector_service 的 retrieve
    return await vector_retrieve(question, top_k, store)

@app.websocket("/ws")
async def ws_main(ws: WebSocket):
    await ws_endpoint(ws, logger)

if __name__ == "__main__":
    logger.info("Starting RAGService WebSocket server on 127.0.0.1:9200")
    uvicorn.run(app, host="0.0.0.0", port=9200)
