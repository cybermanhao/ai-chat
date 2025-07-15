# PowerShell 脚本：一键启动 Python WebSocket 服务和 Node.js MCP 注册服务
# 假设目录结构：
#   mcp-python/pybridge-demo/simple-ws-tools.py
#   mcp-node/example-ws-python-tools.ts
#   Python venv 路径为 mcp-python/pybridge-demo/.venv
#   Node 端已安装依赖

$ErrorActionPreference = 'Stop'

# 1. 进入 Python 虚拟环境
Write-Host "激活 Python 虚拟环境..."
$venvPath = "..\.venv"
$activateScript = "./.venv/Scripts/Activate.ps1"
if (Test-Path $activateScript) {
    Push-Location "../pybridge-demo"
    . $activateScript
    Pop-Location
} else {
    Write-Host "未找到 Python 虚拟环境激活脚本: $activateScript" -ForegroundColor Red
    exit 1
}

# 2. 启动 Python WebSocket 服务
Write-Host "启动 Python WebSocket 服务..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ../pybridge-demo; . .venv/Scripts/Activate.ps1; python simple-ws-tools.py" -WindowStyle Minimized
Start-Sleep -Seconds 2

# 3. 启动 Node.js MCP 注册服务
Write-Host "启动 Node.js MCP 注册服务..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ../../mcp-node; npx ts-node example-ws-python-tools.ts" -WindowStyle Minimized

Write-Host "全部服务已启动。"
