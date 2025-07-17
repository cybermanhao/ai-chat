import json
import logging
import random
from fastapi import FastAPI, WebSocket
import uvicorn
from typing import List, Dict
from ws_tools import ws_tool, ws_endpoint

app = FastAPI()

# 日志系统配置
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
)
logger = logging.getLogger(__name__)

@ws_tool('rag_query')
async def rag_query(query: str, store: str = 'url') -> dict:
    logger.info(f"RAG 查询: store={store}, query={query}")
    # 可根据 store 查询不同仓库，这里仅返回模拟结果
    return {"answer": f"RAG结果: {query}", "store": store}

@ws_tool('rag_add')
async def rag_add(doc: dict, store: str = 'url') -> dict:
    logger.info(f"RAG 新增: store={store}, doc={doc}")
    return {"status": "added", "doc": doc, "store": store}

@ws_tool('rag_update')
async def rag_update(doc_id: str, doc: dict, store: str = 'url') -> dict:
    logger.info(f"RAG 更新: store={store}, id={doc_id}, doc={doc}")
    return {"status": "updated", "id": doc_id, "doc": doc, "store": store}

@ws_tool('rag_delete')
async def rag_delete(doc_id: str, store: str = 'url') -> dict:
    logger.info(f"RAG 删除: store={store}, id={doc_id}")
    return {"status": "deleted", "id": doc_id, "store": store}

# VectorService: 只实现 retrieve 方法，暴露给 ragservice 调用
class Document:
    def __init__(self, id: str, content: str):
        self.id = id
        self.content = content
    def to_dict(self):
        return {"id": self.id, "content": self.content}

VECTOR_STORES = {
    'url': [],
    'term': [],
    'text': []
}

@ws_tool('retrieve_mock')
async def retrieve_mock(question: str, top_k: int = 5, store: str = 'url') -> List[Dict]:
    logger.info(f"VectorService 检索: store={store}, question={question}, top_k={top_k}")
    # 如果是 url 查询，返回 url.json 随机 top_k 条
    if store == "url":
        try:
            with open("data/url.json", "r", encoding="utf-8") as f:
                url_data = json.load(f)
            docs = random.sample(url_data, min(top_k, len(url_data)))
            return docs
        except Exception as e:
            logger.error(f"读取 url.json 失败: {e}")
            return [{"error": str(e)}]
    # 其它类型仍返回模拟内容
    docs = [Document(f"{store}-{i}", f"[{store}]相关内容 {i} for '{question}'") for i in range(1, top_k+1)]
    return [doc.to_dict() for doc in docs]

@app.websocket("/ws")
async def ws_main(ws: WebSocket):
    await ws_endpoint(ws, logger)

if __name__ == "__main__":
    logger.info("Starting VectorService WebSocket server on 127.0.0.1:9100")
    uvicorn.run(app, host="0.0.0.0", port=9100)
