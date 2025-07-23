import json
import logging
from fastapi import FastAPI, WebSocket
import uvicorn
from typing import List, Dict, Any
from ws_tools import ws_tool, ws_endpoint
from vector_service import rag_query

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
    # 使用真正的向量模糊检索
    result = await rag_query(question, store=store, top_k=top_k)
    # rag_query 返回的是 {'results': [...]}
    return result.get('results', [])

@app.websocket("/ws")
async def ws_main(ws: WebSocket):
    await ws_endpoint(ws, logger)

if __name__ == "__main__":
    logger.info("Starting RAGService WebSocket server on 127.0.0.1:9200")
    uvicorn.run(app, host="0.0.0.0", port=9200)
