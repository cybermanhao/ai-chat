# MCP Server 清理功能测试脚本 (PowerShell)
# 
# 用法: .\run-cleanup-test.ps1

Write-Host "=" * 60
Write-Host "MCP Server 清理功能测试"
Write-Host "=" * 60

# 设置测试环境变量
$env:MCP_SESSION_TIMEOUT_MS = "120000"        # 2分钟超时
$env:MCP_CLEANUP_INTERVAL_MS = "30000"        # 30秒清理间隔  
$env:MCP_STATUS_REPORT_INTERVAL_MS = "20000"  # 20秒状态报告
$env:MCP_PORT = "8000"
$env:MCP_HOST = "127.0.0.1"
$env:MCP_PATH = "/mcp"

Write-Host "测试环境变量:"
Write-Host "  MCP_SESSION_TIMEOUT_MS=$env:MCP_SESSION_TIMEOUT_MS"
Write-Host "  MCP_CLEANUP_INTERVAL_MS=$env:MCP_CLEANUP_INTERVAL_MS" 
Write-Host "  MCP_STATUS_REPORT_INTERVAL_MS=$env:MCP_STATUS_REPORT_INTERVAL_MS"
Write-Host "  MCP_PORT=$env:MCP_PORT"
Write-Host "  MCP_HOST=$env:MCP_HOST"
Write-Host "  MCP_PATH=$env:MCP_PATH"
Write-Host ""

try {
    # 构建项目
    Write-Host "0. 构建项目..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "构建失败"
    }
    
    # 启动 MCP Server
    Write-Host "1. 启动 MCP Server..."
    $serverJob = Start-Job -ScriptBlock {
        param($env_vars)
        
        # 设置环境变量
        foreach ($var in $env_vars.GetEnumerator()) {
            Set-Item -Path "env:$($var.Key)" -Value $var.Value
        }
        
        # 启动服务器
        node build/engine/mcpserver.js
    } -ArgumentList @{
        MCP_SESSION_TIMEOUT_MS = $env:MCP_SESSION_TIMEOUT_MS
        MCP_CLEANUP_INTERVAL_MS = $env:MCP_CLEANUP_INTERVAL_MS
        MCP_STATUS_REPORT_INTERVAL_MS = $env:MCP_STATUS_REPORT_INTERVAL_MS
        MCP_PORT = $env:MCP_PORT
        MCP_HOST = $env:MCP_HOST
        MCP_PATH = $env:MCP_PATH
    }
    
    # 等待服务器启动
    Write-Host "等待服务器启动..."
    Start-Sleep -Seconds 5
    
    # 检查服务器是否启动成功
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/mcp" -Method POST -ContentType "application/json" -Body '{"jsonrpc":"2.0","method":"ping","id":1}' -TimeoutSec 5
        Write-Host "服务器启动成功"
    }
    catch {
        Write-Host "服务器启动失败或无响应: $($_.Exception.Message)"
        throw "服务器启动检查失败"
    }
    
    Write-Host ""
    Write-Host "2. 运行测试客户端..."
    
    # 运行测试
    npx tsx test/mcp-cleanup-test.ts
    $testExitCode = $LASTEXITCODE
    
    Write-Host "测试完成，退出代码: $testExitCode"
    
}
catch {
    Write-Host "错误: $($_.Exception.Message)" -ForegroundColor Red
    $testExitCode = 1
}
finally {
    # 清理：停止服务器
    Write-Host ""
    Write-Host "3. 清理资源..."
    
    if ($serverJob) {
        Write-Host "停止服务器..."
        Stop-Job -Job $serverJob -ErrorAction SilentlyContinue
        Remove-Job -Job $serverJob -Force -ErrorAction SilentlyContinue
    }
    
    # 确保端口被释放
    try {
        $processes = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | ForEach-Object { Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue }
        if ($processes) {
            Write-Host "发现占用端口8000的进程，正在终止..."
            $processes | Stop-Process -Force -ErrorAction SilentlyContinue
        }
    }
    catch {
        # 忽略清理错误
    }
    
    Write-Host "清理完成"
}

# 设置退出代码
exit $testExitCode
