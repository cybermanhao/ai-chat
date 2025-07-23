import os
import sys
import json
import logging
from typing import List, Dict
from tqdm import tqdm
import asyncio

# 动态添加父目录到sys.path，确保可以import vector_service
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from vector_service import rag_add

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

URL_JSON_PATH = os.path.join(os.path.dirname(__file__), '../data/url.json')

def load_url_data(json_path: str) -> List[Dict]:
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)

async def main():
    logger.info(f"加载 url.json: {URL_JSON_PATH}")
    url_data = load_url_data(URL_JSON_PATH)
    logger.info(f"共加载 {len(url_data)} 条 url 数据")

    for item in tqdm(url_data, desc="导入到本地向量服务"):
        doc = {
            "content": item['desc'],
            "metadata": {
                "uri": item["uri"],
                "ap": item.get("ap", ""),
                "desc": item["desc"]
            }
        }
        try:
            result = await rag_add(doc, store="url")
            logger.info(f"已添加: {item['desc']} - {result}")
        except Exception as e:
            logger.error(f"添加失败: {item['desc']} - {e}")

if __name__ == "__main__":
    asyncio.run(main())
