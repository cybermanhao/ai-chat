from langchain_modelscope import ModelScopeEmbeddings

embeddings = ModelScopeEmbeddings(
    model_id="BAAI/bge-m3",
)