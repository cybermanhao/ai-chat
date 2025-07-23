import asyncio
import websockets
import json

async def test_query_url():
    uri = "ws://127.0.0.1:9101/ws"
    async with websockets.connect(uri) as ws:
        # 测试 query_url
        req = {"func": "query_url", "natural_language_input": "如何进入CRM页面"}
        await ws.send(json.dumps(req))
        resp = await ws.recv()
        print("[query_url] response:", resp)

        # 测试 term_match
        req2 = {"func": "term_match", "text": "CRM", "top_k": 2}
        await ws.send(json.dumps(req2))
        resp2 = await ws.recv()
        print("[term_match] response:", resp2)

if __name__ == "__main__":
    asyncio.run(test_query_url())
