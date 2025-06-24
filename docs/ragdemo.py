import json
from typing import List
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableLambda
from langchain_openai import ChatOpenAI
from langchain_openai.embeddings import OpenAIEmbeddings

# 配置
API_KEY = "sk-"
EMBED_API_URL = "https://api.siliconflow.cn/v1"
EMBED_MODEL_NAME = "Qwen/Qwen3-Embedding-8B"
LLM_API_URL = "https://api.siliconflow.cn/v1"
LLM_MODEL_NAME = "Pro/deepseek-ai/DeepSeek-V3"
DEFAULT_PERSIST_DIR = "./chroma_api_db"
TEST_DATA_JSON = """\
[
  {
    "url": "/crm/customer/detail",
    "payload": {
      "customerId": "123456",
      "tab": "profile"
    },
    "desc": "跳转到客户详情页并默认展示资料tab"
  },
  {
    "url": "/crm/customer/list",
    "payload": {
      "page": 1,
      "size": 10
    },
    "desc": "获取客户列表，支持分页"
  }
]
"""

preprocess_prompt_template = PromptTemplate.from_template(
    """\
    - 咱们做的是会展行业的CRM系统
    现在你是一个专业的关键字分析工具，请根据当前已有的关键字列表
    再结合的用户的问题生成最有符合要求的关键字（最多一个）
    - 如何一个都没有请输出 无
    # 注意：你只需要输出关键字 ，不需要任何解释
    
    关键字列表：
    {{context}}
    
    用户问题：
    {{question}}
    
    """,
    template_format="mustache",
)

prompt_template = PromptTemplate.from_template(
    """\
    你是一个智能助手，根据以下检索到的上下文回答用户的问题。
    - 如何没有检索到上下文，那么你需要返回：
    ```json
    {
      "status": "fail",
      "reason": "未找到对应的页面"
    }
    ```
    - 如何找到了对应的上下文，请你直接返回 
    ```json
    {
      "status": "success",
      "data": {
        "action": "call",
        "fn": "AIRouter",
        "args": "{metadata}"
      }
    }
    ```
    - 不需要任何解释，你只能返回`json`格式，**且不能带有代码块**
    
    上下文：
    
    {{context}}
    
    用户问题：
    {{question}}
    
    回答：
    """,
    template_format="mustache",
)
embedding_model = OpenAIEmbeddings(
    openai_api_base=EMBED_API_URL,
    openai_api_key=API_KEY,
    model=EMBED_MODEL_NAME,
)
llm = ChatOpenAI(
    model_name=LLM_MODEL_NAME,
    openai_api_key=API_KEY,
    openai_api_base=LLM_API_URL,
)


def load_json_2vdb() -> List[Document]:
    vdb = Chroma(
        embedding_function=embedding_model,
        persist_directory=DEFAULT_PERSIST_DIR,
    )
    documents = []
    for item in json.load(open("data.json", "r", encoding="utf-8")):
        doc = Document(
            page_content=item["desc"],
            metadata=item,
        )
        documents.append(doc)
    vdb.add_documents(documents)


def get_vdb():
    return Chroma(
        embedding_function=embedding_model,
        persist_directory=DEFAULT_PERSIST_DIR,
    )


def format_docs(docs):
    result = []
    for doc in docs:
        metadata = doc.metadata
        result.append(
            f"页面描述：{doc.page_content}，metadata：\n ```json\n{metadata}```"
        )
    return "\n\n".join(result)


def get_pre_process_ctx():
    content = "\n".join(
        map(
            lambda item: item["desc"],
            json.load(open("data.json", "r", encoding="utf-8")),
        )
    )
    return f"```\n{content}\n```"


def llm_chat():
    pre_process_chain = (
        {
            "context": RunnableLambda(lambda _: get_pre_process_ctx()),
            "question": RunnablePassthrough(),
        }
        | preprocess_prompt_template
        | llm
        | StrOutputParser()
    )

    retriever = get_vdb().as_retriever(
        search_type="similarity_score_threshold",
        search_kwargs={"k": 4, "score_threshold": 0.5},
    )
    rag_chain = (
        {"context": retriever | format_docs, "question": RunnablePassthrough()}
        | prompt_template
        | llm
        | StrOutputParser()
    )

    # 7. 测试 RAG 链
    while True:
        query = input(">>：")
        pre_resp = pre_process_chain.invoke(query)
        if "无" in pre_resp:
            print("未找到对应的页面")
            continue
        # 好像有点多此一举。拿到的与处理结果就能直接找到正确的结果
        print("预处理结果：", pre_resp)
        response = rag_chain.invoke(pre_resp)
        print(response)


def main():
    retriever = get_vdb().as_retriever(
        search_type="similarity_score_threshold",
        search_kwargs={"k": 4, "score_threshold": 0.8},
    )
    for item in retriever.invoke("你好"):
        print(item[0], item[1])


if __name__ == "__main__":
    # load_json_2vdb()
    # main()
    llm_chat()
