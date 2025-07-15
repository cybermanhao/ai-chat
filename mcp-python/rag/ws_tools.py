import logging
from fastapi import WebSocket
import inspect
import json

WS_TOOL_REGISTRY = {}

def ws_tool(name):
    def decorator(func):
        WS_TOOL_REGISTRY[name] = func
        return func
    return decorator

async def ws_endpoint(ws: WebSocket, logger=None):
    await ws.accept()
    if logger:
        logger.info("WebSocket connection accepted")
    while True:
        try:
            data = await ws.receive_text()
            if logger:
                logger.info(f"Received data: {data}")
            req = json.loads(data)
            func = req.get('func')
            handler = WS_TOOL_REGISTRY.get(func)
            if handler:
                sig = inspect.signature(handler)
                params = {k: req[k] for k in sig.parameters if k in req}
                result = await handler(**params)
                if logger:
                    logger.info(f"{func} result: {result}")
                await ws.send_text(json.dumps({'result': result}))
            else:
                if logger:
                    logger.warning(f"Unknown function: {func}")
                await ws.send_text(json.dumps({'error': 'Unknown function'}))
        except Exception as e:
            if logger:
                logger.error(f"Error handling request: {e}", exc_info=True)
            await ws.send_text(json.dumps({'error': str(e)}))
