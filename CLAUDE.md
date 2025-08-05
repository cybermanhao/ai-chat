# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Primary Development
- `pnpm run dev:web` - Start the web development server with hot reload (port 3000)
- `pnpm run start:mcp-node` - Start the MCP Node.js server (port 3001)
- `pnpm run dev:all` - Start both web and electron development servers concurrently

### Build Commands
- `pnpm run build:web` - Build the web frontend for production
- `pnpm run build:engine` - Build the engine module using TypeScript
- `pnpm run build:mcp-node` - Build the MCP Node.js service
- `pnpm run build:electron` - Build electron application for distribution

### Testing
- `cd web && pnpm test` - Run web frontend tests using Vitest
- `cd web && pnpm test:coverage` - Run tests with coverage report
- `cd web && pnpm test:ui` - Run tests with UI interface

### Linting and Type Checking
- `cd web && pnpm lint` - Run ESLint on web frontend code
- `cd web && pnpm typecheck` - Run TypeScript type checking

### Quick Start Scripts
Windows: `.\scripts\web-dev.ps1`
Linux/macOS: `./scripts/web-dev.sh`

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
- **`electron/`** - Electron wrapper for desktop application
- **`mcp-node/`** - MCP server implementation in Node.js
- **`mcp-python/`** - MCP server implementation in Python

### Key Architectural Patterns

#### MessageBridge Pattern
The `engine/service/messagebridge.ts` implements a unified protocol adaptation layer that bridges TaskLoop with different platforms (Web/Electron/SSC). It handles event distribution for:
- `toolcall`, `toolresult`, `status`, `done`, `error`, `abort` events
- Protocol message routing (`message/llm/chat`, `message/llm/abort`)
- MCP service connection/disconnection

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
- `web/src/store/` - Frontend state management
- `engine/service/mcpClient.ts` - MCP integration layer

### Environment Setup
- Node.js 18+, Python 3.10+, pnpm 8+
- Development typically uses the one-click startup scripts
- MCP servers run on separate ports (3001 for Node.js, 8000 for Python)

### Testing Strategy
- Vitest for web frontend testing
- Test files located in `web/src/tests/` and `engine/tests/`
- Coverage reporting available through Vitest

When working with this codebase, pay special attention to the TaskLoop and MessageBridge patterns as they are central to the application's architecture and handle the complex multi-turn conversation and tool calling logic.