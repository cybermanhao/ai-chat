# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Primary Development
- `pnpm run dev:web` - Start the web development server with hot reload (port 3000)
- `pnpm run start:mcp-node` - Start the MCP Node.js server (port 3001)
- `pnpm run dev:ssc-server` - Start the SSC server in development mode (port 8080)
- `pnpm run dev:all` - Start both web and electron development servers concurrently

### Build Commands
- `pnpm run build:web` - Build the web frontend for production
- `pnpm run build:engine` - Build the engine module using TypeScript
- `pnpm run build:mcp-node` - Build the MCP Node.js service
- `pnpm run build:ssc-server` - Build the SSC server for production
- `pnpm run build:sdk` - Build the TaskLoop SDK for SSC mode
- `pnpm run build:electron` - Build electron application for distribution

### SSC Server Commands
- `pnpm run start:ssc-server` - Start the SSC server in production mode
- `pnpm run dev:ssc-server` - Start the SSC server in development mode with auto-reload

### Testing
- `cd web && pnpm test` - Run web frontend tests using Vitest
- `cd web && pnpm test:coverage` - Run tests with coverage report
- `cd web && pnpm test:ui` - Run tests with UI interface
- `pnpm run test:mock-ssc` - Start mock SSC server for SDK testing

### Linting and Type Checking
- `cd web && pnpm lint` - Run ESLint on web frontend code
- `cd web && pnpm typecheck` - Run TypeScript type checking

## Architecture Overview

This is a multi-platform AI chat application with MCP (Model Context Protocol) integration, built with a modular architecture:

### Core Modules
- **`engine/`** - Core business logic and shared utilities
  - Message processing, streaming, LLM integration
  - MCP client and service abstractions
  - Cross-platform MessageBridge for protocol adaptation
  - TaskLoop for message generation lifecycle management
- **`web/`** - React frontend application
  - Zustand for state management
  - Ant Design UI components
  - Built with Vite, supports hot reload
- **`ssc-server/`** - SSC (server-side-clientputing) backend server
  - Express-based HTTP/SSE API server
  - LLM proxy service with multiple provider support
  - MCP tool calling proxy
  - Environment-based configuration (.env)
- **`electron/`** - Electron wrapper for desktop application
- **`mcp-node/`** - MCP server implementation in Node.js
- **`mcp-python/`** - MCP server implementation in Python

### Key Architectural Patterns

#### MessageBridge Pattern
The `engine/service/messagebridge.ts` implements a unified protocol adaptation layer that bridges TaskLoop with different platforms (Web/Electron/SSC). It handles event distribution for:
- `toolcall`, `toolresult`, `status`, `done`, `error`, `abort` events
- Protocol message routing (`message/llm/chat`, `message/llm/abort`)
- MCP service connection/disconnection
- SSC mode HTTP/SSE communication with backend server

#### TaskLoop Pattern
The `engine/stream/task-loop.ts` manages the complete lifecycle of chat message generation:
- Multi-turn conversations with automatic tool chain processing
- Event-driven architecture with subscribe/emit pattern
- Automatic message history maintenance
- Support for streaming LLM responses and tool calls
- Cross-platform compatibility through MessageBridge

### State Management
- **Web**: Uses Zustand with persistence middleware
- **Engine**: Maintains local state within TaskLoop instances
- **Cross-platform**: MessageBridge handles state synchronization

### Tool Integration
- MCP (Model Context Protocol) for tool calling
- Automatic tool chain processing in TaskLoop
- Support for both Node.js and Python MCP servers

## Development Notes

### Project Structure
- Monorepo using pnpm workspaces
- TypeScript throughout with composite project references
- ESLint configuration covers web/, engine/, and mcp-node/ modules

### Key Files to Understand
- `engine/stream/task-loop.ts` - Core message processing logic
- `engine/service/messagebridge.ts` - Cross-platform protocol adapter
- `engine/service/messageBridgeInstance.ts` - MessageBridge factory with SSC support
- `engine/utils/envDetect.ts` - Runtime environment detection (Web/Electron/SSC)
- `web/src/store/` - Frontend state management
- `engine/service/mcpClient.ts` - MCP integration layer
- `ssc-server/src/app.ts` - SSC server main application
- `ssc-server/src/services/llmProxy.ts` - LLM provider proxy service
- `ssc-server/src/services/mcpProxy.ts` - MCP tool calling proxy service

### Environment Setup
- Node.js 18+, Python 3.10+, pnpm 8+
- Development typically uses `pnpm run dev:web` for frontend development
- MCP servers run on separate ports (3001 for Node.js, 8000 for Python)
- SSC server runs on port 8080 by default

### Testing Strategy
- Vitest for web frontend testing
- Test files located in `web/src/tests/` and `engine/tests/`
- Coverage reporting available through Vitest

When working with this codebase, pay special attention to the TaskLoop and MessageBridge patterns as they are central to the application's architecture and handle the complex multi-turn conversation and tool calling logic.

## SSC (server-side-clientputing) Mode

The SSC architecture enables deployment of AI capabilities as a backend service:

### SSC Server Configuration
Configure the SSC server by copying `ssc-server/.env.example` to `ssc-server/.env`:

```bash
# Required: At least one LLM provider
DEEPSEEK_API_KEY=sk-your-deepseek-api-key
OPENAI_API_KEY=sk-your-openai-api-key

# Optional configurations
DEFAULT_LLM_PROVIDER=deepseek
PORT=8080
MCP_SERVER_URL=http://localhost:3001
MCP_SERVER_ENABLED=true
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### TaskLoop SDK Development
The TaskLoop SDK is built with SSC mode support:

1. **Build SDK**: `pnpm run build:sdk` creates a distributable package
2. **Environment Detection**: Build-time injection determines runtime mode (Web/Electron/SSC)
3. **Protocol Adaptation**: MessageBridge automatically switches between local and HTTP/SSE communication

### Testing SSC Integration
Use the mock SSC server for development and testing:

```bash
# Start mock SSC server
pnpm run test:mock-ssc

# Open test page
# file:///path/to/project/test/sdk-test.html
```

The mock server provides:
- LLM chat API with SSE streaming
- MCP tool calling simulation
- Health check endpoints