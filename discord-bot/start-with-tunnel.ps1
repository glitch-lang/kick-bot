# Start Discord Bot with Public Tunneling
# This script starts the bot AND creates a public URL for watch parties

Write-Host "🚀 Starting Discord Bot with Public Access..." -ForegroundColor Cyan
Write-Host ""

# Check if bot is already running
$existing = Get-Process node -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "⚠️  Node processes are already running. Stopping them..." -ForegroundColor Yellow
    Stop-Process -Name node -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# Start the bot in background
Write-Host "📦 Starting Discord bot..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; npm start" -WindowStyle Minimized

# Wait for bot to start
Write-Host "⏳ Waiting for bot to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start LocalTunnel
Write-Host ""
Write-Host "🌐 Creating public tunnel..." -ForegroundColor Green
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Check if localtunnel is installed
$ltInstalled = Get-Command lt -ErrorAction SilentlyContinue
if (-not $ltInstalled) {
    Write-Host "❌ LocalTunnel not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installing now..." -ForegroundColor Yellow
    npm install -g localtunnel
}

# Start tunnel (this will block and show the URL)
Write-Host "🎉 Your watch party is now PUBLIC!" -ForegroundColor Green
Write-Host ""
Write-Host "The URL below is accessible from ANYWHERE:" -ForegroundColor Cyan
Write-Host ""
lt --port 3001
