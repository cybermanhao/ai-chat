$ErrorActionPreference = 'Stop'

# 获取脚本根目录
$root = Split-Path $PSScriptRoot -Parent
$pyDir = Join-Path $root 'mcp-python/pybridge-demo'
$nodeDir = Join-Path $root 'mcp-node'

# 1. 检查 Python 虚拟环境
Write-Host "激活 Python 虚拟环境..."
$activateScript = Join-Path $pyDir '.venv/Scripts/Activate.ps1'
if (!(Test-Path $activateScript)) {
    Write-Host "未找到 Python 虚拟环境激活脚本: $activateScript" -ForegroundColor Red
    exit 1
}

# 2. 启动 Python WebSocket 服务（窗口正常显示，便于查看日志）
Write-Host "启动 Python WebSocket 服务..."
Start-Process powershell -WorkingDirectory $pyDir -ArgumentList "-NoExit", "-Command", ". .venv/Scripts/Activate.ps1; python simple-ws-tools.py" -WindowStyle Normal
Start-Sleep -Seconds 2

# 3. 启动 Node.js MCP 注册服务
Write-Host "启动 Node.js MCP 注册服务..."
Start-Process powershell -WorkingDirectory $nodeDir -ArgumentList "-NoExit", "-Command", "tsc -p ../mcp-node; node dist/example-ws-python-tools.js" -WindowStyle Minimized

Write-Host "All services started."