import asyncio
import websockets
import json
import sys

WS_URL = "ws://127.0.0.1:9000/ws"

async def call_tool(tool, params):
    async with websockets.connect(WS_URL) as ws:
        await ws.send(json.dumps(params))
        resp = await ws.recv()
        print(f"Response: {resp}")

async def main():
    if len(sys.argv) < 3:
        print("Usage: python ws-tools-client.py <tool> <param1> [param2 ...]")
        print("Tools: greeting, translate, test, weather")
        return
    tool = sys.argv[1]
    args = sys.argv[2:]
    # 构造与服务端一致的参数格式
    if tool == "greeting":
        params = {"func": "greeting", "name": " ".join(args)}
    elif tool == "translate":
        if len(args) < 1:
            print("Usage: python ws-tools-client.py translate <message>")
            return
        params = {"func": "translate", "message": args[0]}
    elif tool == "test":
        params = {"func": "test", "params": {}, "test1": args[0] if len(args)>0 else "", "test2": args[1] if len(args)>1 else "", "test3": args[2] if len(args)>2 else None}
    elif tool == "weather":
        if len(args) < 1:
            print("Usage: python ws-tools-client.py weather <city_code>")
            return
        params = {"func": "weather", "city_code": args[0]}
    else:
        print(f"Unknown tool: {tool}")
        return
    await call_tool(tool, params)

if __name__ == "__main__":
    asyncio.run(main())
