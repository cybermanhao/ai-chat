# Weather MCP Streamable HTTP Server (TypeScript)

This server implements an MCP (Model Context Protocol) Streamable HTTP endpoint using Express and the MCP SDK. It provides weather-related tools and can be accessed by MCP-compatible clients.

## Usage

### 1. Install dependencies

```
npm install
```

### 2. Build and run the server

```
npm run weather-server
```

Or run directly with environment variables:

```
PORT=8010 HOST=127.0.0.1 npx ts-node mcp-node/weather-server.ts
```

### 3. Accessing the server

- The MCP endpoint is available at: `http://<HOST>:<PORT>/mcp-weather`
- You can POST/GET to this endpoint using an MCP-compatible client (see the reference example in `docs/示例-examples/mcp-streamable-http`).

### 4. Customizing port and host

- Set the `PORT` and `HOST` environment variables to change the listening address.
- Defaults: `PORT=8010`, `HOST=127.0.0.1`

## Integration Pattern

- The MCP Streamable HTTP transport is created with only a `sessionIdGenerator` (if needed), **not** with `path`, `port`, or `host`.
- The Express app mounts the MCP handler at the desired path (e.g., `/mcp-weather`).
- Example:

```ts
const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => randomUUID() });
await server.connect(transport);
app.use("/mcp-weather", (req, res) => transport.handler(req, res));
```

## Reference
- See `docs/示例-examples/mcp-streamable-http/typescript-example/server/` for a full-featured example.
- MCP Protocol Spec: https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#streamable-http

## Troubleshooting
- Do **not** pass `path`, `port`, or `host` to the MCP transport constructor; use Express for routing and listening.
- If you see TypeScript errors about constructor arguments, check that you are following the above pattern.
