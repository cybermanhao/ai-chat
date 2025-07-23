# Facebook AI Similarity Search (FAISS) 中文指南

FAISS（Facebook AI Similarity Search）是一个高效的稠密向量相似性搜索与聚类库。它支持在任意规模的向量集合中进行搜索，即使这些集合无法完全载入内存。FAISS 还包含用于评估和参数调优的辅助代码。

- [FAISS 官方文档](https://faiss.ai/)
- [FAISS 论文](https://arxiv.org/abs/1702.08734)

本指南将介绍如何在 LangChain 框架下集成和使用 FAISS 向量数据库，包括基本用法和常见操作。

---

## 安装依赖

FAISS 集成在 `langchain-community` 包中，需同时安装 `faiss-cpu`（如需 GPU 支持可安装 `faiss-gpu`）：

```bash
pip install -qU langchain-community faiss-cpu
```

如需使用 OpenAI 嵌入模型：

```bash
pip install -qU langchain-openai
```

---

## 初始化

### 设置 OpenAI API Key（可选）
```python
import getpass
import os
if not os.environ.get("OPENAI_API_KEY"):
    os.environ["OPENAI_API_KEY"] = getpass.getpass("Enter API key for OpenAI: ")
```

### 导入并初始化 Embeddings
```python
from langchain_openai import OpenAIEmbeddings
embeddings = OpenAIEmbeddings(model="text-embedding-3-large")
```

### 初始化 FAISS 向量库
```python
import faiss
from langchain_community.docstore.in_memory import InMemoryDocstore
from langchain_community.vectorstores import FAISS

index = faiss.IndexFlatL2(len(embeddings.embed_query("hello world")))
vector_store = FAISS(
    embedding_function=embeddings,
    index=index,
    docstore=InMemoryDocstore(),
    index_to_docstore_id={},
)
```

---

## 管理向量库

### 添加文档
```python
from uuid import uuid4
from langchain_core.documents import Document

documents = [
    Document(page_content="示例文本1", metadata={"source": "tweet"}),
    Document(page_content="示例文本2", metadata={"source": "news"}),
    # ...更多文档
]
uuids = [str(uuid4()) for _ in range(len(documents))]
vector_store.add_documents(documents=documents, ids=uuids)
```

### 删除文档
```python
vector_store.delete(ids=[uuids[-1]])
```

---

## 查询向量库

### 相似度检索
```python
results = vector_store.similarity_search(
    "LangChain 提供了简化 LLM 操作的抽象", k=2, filter={"source": "tweet"}
)
for res in results:
    print(f"* {res.page_content} [{res.metadata}]")
```

### 支持的高级元数据过滤操作符
- $eq（等于）
- $neq（不等于）
- $gt（大于）
- $lt（小于）
- $gte（大于等于）
- $lte（小于等于）
- $in（在列表中）
- $nin（不在列表中）
- $and（全部条件）
- $or（任一条件）
- $not（取反）

### 带分数的相似度检索
```python
results = vector_store.similarity_search_with_score(
    "明天会热吗？", k=1, filter={"source": "news"}
)
for res, score in results:
    print(f"* [SIM={score:3f}] {res.page_content} [{res.metadata}]")
```

### 作为 Retriever 使用
```python
retriever = vector_store.as_retriever(search_type="mmr", search_kwargs={"k": 1})
retriever.invoke("银行被盗事件", filter={"source": "news"})
```

---

## 保存与加载

```python
vector_store.save_local("faiss_index")
new_vector_store = FAISS.load_local(
    "faiss_index", embeddings, allow_dangerous_deserialization=True
)
docs = new_vector_store.similarity_search("qux")
```

---

## 合并向量库

```python
db1 = FAISS.from_texts(["foo"], embeddings)
db2 = FAISS.from_texts(["bar"], embeddings)
db1.merge_from(db2)
```

---

## 参考文档
- [FAISS 官方文档](https://faiss.ai/)
- [LangChain FAISS API 文档](https://python.langchain.com/api_reference/community/vectorstores/langchain_community.vectorstores.faiss.FAISS.html)
