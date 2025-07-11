# web-dev.ps1 - 启动 MCP 服务器和 Web 开发服务器
# 使用普通 PowerShell 窗口

Write-Host "=== MCP & Web Dev Server Launcher ===" -ForegroundColor Cyan

# 检查 package.json
if (!(Test-Path "package.json")) {
    Write-Host "Error: package.json not found" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory" -ForegroundColor Yellow
    exit 1
}

$projectRoot = (Get-Location).Path
Write-Host "Project Path: $projectRoot" -ForegroundColor Gray

Write-Host "Starting services..." -ForegroundColor Green

try {
    # 启动 MCP 服务器 (新窗口)
    Write-Host "Starting MCP Server..." -ForegroundColor Magenta
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot'; Write-Host 'MCP Server Starting...' -ForegroundColor Magenta; npm run start:mcp-node"
    
    # 等待 1 秒
    Start-Sleep -Seconds 1
    
    # 启动 Web 开发服务器 (新窗口)
    Write-Host "Starting Web Dev Server..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot'; Write-Host 'Web Dev Server Starting...' -ForegroundColor Cyan; npm run dev:web"
    
    Write-Host "✅ Services launched successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Failed to start services: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Service Information:" -ForegroundColor Yellow
Write-Host "  🔴 MCP Server: Port 3001" -ForegroundColor Red
Write-Host "  🔵 Web Dev Server: Port 3000" -ForegroundColor Cyan
Write-Host "  ⚠️  Press Ctrl+C in each window to stop services" -ForegroundColor Gray
Write-Host ""
Write-Host "🎉 Script completed!" -ForegroundColor Green
