#!/bin/bash
# web-dev.sh - 启动 MCP 服务器和 Web 开发服务器
# 适用于 Linux/macOS 系统

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${CYAN}=== MCP & Web Dev Server Launcher ===${NC}"

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo -e "${RED}错误: 未找到 package.json${NC}"
    echo -e "${YELLOW}请确保在项目根目录运行此脚本${NC}"
    exit 1
fi

# 获取项目根目录
PROJECT_ROOT=$(pwd)
echo -e "${CYAN}项目路径: ${PROJECT_ROOT}${NC}"

# 检查是否安装了 npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}错误: 未找到 npm 命令${NC}"
    echo -e "${YELLOW}请先安装 Node.js 和 npm${NC}"
    exit 1
fi

# 检查 package.json 中的脚本
if ! grep -q "start:mcp-node" package.json; then
    echo -e "${RED}错误: 未找到 start:mcp-node 脚本${NC}"
    exit 1
fi

if ! grep -q "dev:web" package.json; then
    echo -e "${RED}错误: 未找到 dev:web 脚本${NC}"
    exit 1
fi

echo -e "${GREEN}正在启动服务...${NC}"

# 检查使用的终端类型
if command -v gnome-terminal &> /dev/null; then
    TERMINAL_CMD="gnome-terminal"
elif command -v xterm &> /dev/null; then
    TERMINAL_CMD="xterm"
elif command -v konsole &> /dev/null; then
    TERMINAL_CMD="konsole"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS 使用 Terminal.app
    TERMINAL_CMD="osascript"
else
    echo -e "${YELLOW}警告: 未找到支持的终端，尝试使用后台进程${NC}"
    TERMINAL_CMD="background"
fi

# 启动服务的函数
start_services() {
    case $TERMINAL_CMD in
        "gnome-terminal")
            echo -e "${MAGENTA}启动 MCP 服务器...${NC}"
            gnome-terminal --title="MCP Server" --tab-with-profile=Default -- bash -c "cd '$PROJECT_ROOT'; echo -e '${MAGENTA}MCP Server Starting...${NC}'; npm run start:mcp-node; exec bash"
            
            sleep 1
            
            echo -e "${CYAN}启动 Web 开发服务器...${NC}"
            gnome-terminal --title="Web Dev Server" --tab-with-profile=Default -- bash -c "cd '$PROJECT_ROOT'; echo -e '${CYAN}Web Dev Server Starting...${NC}'; npm run dev:web; exec bash"
            ;;
            
        "xterm")
            echo -e "${MAGENTA}启动 MCP 服务器...${NC}"
            xterm -title "MCP Server" -e "cd '$PROJECT_ROOT'; echo -e '${MAGENTA}MCP Server Starting...${NC}'; npm run start:mcp-node; bash" &
            
            sleep 1
            
            echo -e "${CYAN}启动 Web 开发服务器...${NC}"
            xterm -title "Web Dev Server" -e "cd '$PROJECT_ROOT'; echo -e '${CYAN}Web Dev Server Starting...${NC}'; npm run dev:web; bash" &
            ;;
            
        "konsole")
            echo -e "${MAGENTA}启动 MCP 服务器...${NC}"
            konsole --new-tab --title "MCP Server" -e bash -c "cd '$PROJECT_ROOT'; echo -e '${MAGENTA}MCP Server Starting...${NC}'; npm run start:mcp-node; exec bash" &
            
            sleep 1
            
            echo -e "${CYAN}启动 Web 开发服务器...${NC}"
            konsole --new-tab --title "Web Dev Server" -e bash -c "cd '$PROJECT_ROOT'; echo -e '${CYAN}Web Dev Server Starting...${NC}'; npm run dev:web; exec bash" &
            ;;
            
        "osascript")
            # macOS Terminal.app
            echo -e "${MAGENTA}启动 MCP 服务器...${NC}"
            osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_ROOT'; echo -e '${MAGENTA}MCP Server Starting...${NC}'; npm run start:mcp-node\""
            
            sleep 1
            
            echo -e "${CYAN}启动 Web 开发服务器...${NC}"
            osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_ROOT'; echo -e '${CYAN}Web Dev Server Starting...${NC}'; npm run dev:web\""
            ;;
            
        "background")
            # 后台进程方式（适用于没有图形界面的系统）
            echo -e "${MAGENTA}启动 MCP 服务器（后台）...${NC}"
            cd "$PROJECT_ROOT"
            npm run start:mcp-node > mcp-server.log 2>&1 &
            MCP_PID=$!
            echo "MCP Server PID: $MCP_PID"
            
            sleep 1
            
            echo -e "${CYAN}启动 Web 开发服务器（后台）...${NC}"
            npm run dev:web > web-server.log 2>&1 &
            WEB_PID=$!
            echo "Web Server PID: $WEB_PID"
            
            # 保存 PID 到文件
            echo "$MCP_PID" > .mcp-server.pid
            echo "$WEB_PID" > .web-server.pid
            
            echo -e "${GREEN}服务已在后台启动${NC}"
            echo -e "${YELLOW}查看日志: tail -f mcp-server.log 或 tail -f web-server.log${NC}"
            echo -e "${YELLOW}停止服务: kill $MCP_PID $WEB_PID${NC}"
            echo -e "${YELLOW}或运行: ./scripts/stop-dev.sh${NC}"
            ;;
    esac
}

# 启动服务
start_services

if [ "$TERMINAL_CMD" != "background" ]; then
    echo -e "${GREEN}✅ 服务已在新终端窗口中启动${NC}"
    echo ""
    echo -e "${YELLOW}📋 服务信息:${NC}"
    echo -e "  ${RED}🔴 MCP 服务器: 端口 3001${NC}"
    echo -e "  ${BLUE}🔵 Web 开发服务器: 端口 3000${NC}"
    echo -e "  ${YELLOW}⚠️  在每个终端窗口中按 Ctrl+C 停止服务${NC}"
fi

echo ""
echo -e "${GREEN}🎉 脚本执行完成！${NC}"
