import json
import logging
import random
from fastapi import FastAPI, WebSocket
import uvicorn
from typing import List, Dict
from ws_tools import ws_tool, ws_endpoint
import os

# 设置 huggingface 镜像环境变量
os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"

# 日志系统配置
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
)
logger = logging.getLogger(__name__)

# 导入向量数据库相关依赖
from langchain_community.embeddings import HuggingFaceBgeEmbeddings
embeddings = HuggingFaceBgeEmbeddings(
    model_name="BAAI/bge-large-zh",  # 可根据需要修改模型名
    model_kwargs={'device': "cpu"},
    encode_kwargs={
        "normalize_embeddings": True,
        "trust_remote_code": True,
        "batch_size": 32,
        "device": "cpu"
    }
)
# from langchain_modelscope import ModelScopeEmbeddings
# embeddings = ModelScopeEmbeddings(
#     model_id="BAAI/bge-m3"
# )

import faiss
from langchain_community.docstore.in_memory import InMemoryDocstore
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from uuid import uuid4

VECTOR_STORE_DIR = os.path.join(os.path.dirname(__file__), 'vector-store')

# 初始化或加载向量存储
os.makedirs(VECTOR_STORE_DIR, exist_ok=True)
if os.listdir(VECTOR_STORE_DIR):
    try:
        vector_store = FAISS.load_local(
            folder_path=VECTOR_STORE_DIR,
            embeddings=embeddings,
            allow_dangerous_deserialization=True
        )
        logger.info(f"向量存储加载成功: {VECTOR_STORE_DIR}")
    except Exception as e:
        logger.error(f"向量存储加载失败: {e}")
        vector_store = None
else:
    vector_store = None

app = FastAPI()


# 增加文档
@ws_tool('rag_add')
async def rag_add(doc: dict, store: str = 'url') -> dict:
    logger.info(f"RAG 新增: store={store}, doc={doc}")
    global vector_store
    try:
        document = Document(page_content=doc.get("content", ""), metadata=doc.get("metadata", {}))
        if vector_store is None:
            vector_store = FAISS.from_texts(
                texts=[document.page_content],
                embedding=embeddings,
                metadatas=[document.metadata]
            )
        else:
            vector_store.add_documents(documents=[document], ids=[str(uuid4())])
        vector_store.save_local(VECTOR_STORE_DIR)
        return {"status": "added", "doc": doc, "store": store}
    except Exception as e:
        logger.error(f"新增失败: {e}")
        return {"error": str(e)}

# 查询文档
@ws_tool('rag_query')
async def rag_query(query: str, store: str = 'url', top_k: int = 5) -> dict:
    logger.info(f"RAG 查询: store={store}, query={query}")
    if vector_store is None:
        return {"error": "向量存储未初始化"}
    try:
        results = vector_store.similarity_search(query, k=top_k)
        return {"results": [{"content": doc.page_content, "metadata": doc.metadata} for doc in results]}
    except Exception as e:
        logger.error(f"查询失败: {e}")
        return {"error": str(e)}

# 更新文档（简单实现：先删后增）
@ws_tool('rag_update')
async def rag_update(doc_id: str, doc: dict, store: str = 'url') -> dict:
    logger.info(f"RAG 更新: store={store}, id={doc_id}, doc={doc}")
    global vector_store
    if vector_store is None:
        return {"error": "向量存储未初始化"}
    try:
        vector_store.delete(ids=[doc_id])
        document = Document(page_content=doc.get("content", ""), metadata=doc.get("metadata", {}))
        vector_store.add_documents(documents=[document], ids=[doc_id])
        vector_store.save_local(VECTOR_STORE_DIR)
        return {"status": "updated", "id": doc_id, "doc": doc, "store": store}
    except Exception as e:
        logger.error(f"更新失败: {e}")
        return {"error": str(e)}

# 删除文档
@ws_tool('rag_delete')
async def rag_delete(doc_id: str, store: str = 'url') -> dict:
    logger.info(f"RAG 删除: store={store}, id={doc_id}")
    global vector_store
    if vector_store is None:
        return {"error": "向量存储未初始化"}
    try:
        vector_store.delete(ids=[doc_id])
        vector_store.save_local(VECTOR_STORE_DIR)
        return {"status": "deleted", "id": doc_id, "store": store}
    except Exception as e:
        logger.error(f"删除失败: {e}")
        return {"error": str(e)}

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
