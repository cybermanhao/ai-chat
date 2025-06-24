import http from 'http';

const server = http.createServer((req, res) => {
    const timestamp = new Date().toISOString();
    const { method, url, headers } = req;
    console.log(`[${timestamp}] 收到请求:`, {
        method,
        url,
        headers: {
            origin: headers.origin,
            'content-type': headers['content-type'],
            'access-control-request-method': headers['access-control-request-method'],
            'access-control-request-headers': headers['access-control-request-headers']
        }
    });
    
    // 添加 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', [
        'Content-Type',
        'Authorization',
        'mcp-protocol-version',
        'mcp-session-id',
        'Accept',
        'Origin'
    ].join(', '));
    
    // 处理 OPTIONS 请求
    if (method === 'OPTIONS') {
        console.log(`[${timestamp}] 处理 OPTIONS 预检请求`);
        res.writeHead(204);
        res.end();
        return;
    }

    // 读取请求体
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });

    req.on('end', () => {
        if (body) {
            console.log(`[${timestamp}] 请求体:`, body);
        }
        
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        const response = 'Hello, this is a test server!';
        console.log(`[${timestamp}] 发送响应:`, response);
        res.end(response);
    });
});

const PORT = 8001;  // 修改端口为 8001，避免与 MCP 服务器冲突

server.listen(PORT, () => {
    console.log(`[${new Date().toISOString()}] 测试服务器启动成功: http://localhost:${PORT}`);
});

// 添加错误处理
server.on('error', (err) => {
    console.error(`[${new Date().toISOString()}] 服务器错误:`, err);
});
