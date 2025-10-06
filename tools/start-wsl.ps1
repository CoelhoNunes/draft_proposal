# =============================================================================
# MicroTech Platform - WSL Startup Script for Windows
# =============================================================================
# This PowerShell script helps Windows users start the MicroTech Platform in WSL

Write-Host "🚀 MicroTech Platform - WSL Startup Script" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check if WSL is available
try {
    $wslVersion = wsl --version 2>$null
    Write-Host "✅ WSL is available" -ForegroundColor Green
} catch {
    Write-Host "❌ WSL is not installed or not available" -ForegroundColor Red
    Write-Host "Please install WSL first: https://docs.microsoft.com/en-us/windows/wsl/install" -ForegroundColor Yellow
    exit 1
}

# Get the current directory path
$currentPath = Get-Location
$wslPath = $currentPath.Path -replace 'C:', '/mnt/c' -replace '\\', '/'

Write-Host "📁 Project path: $currentPath" -ForegroundColor Blue
Write-Host "🔗 WSL path: $wslPath" -ForegroundColor Blue
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found. Please run this script from the project root directory." -ForegroundColor Red
    exit 1
}

Write-Host "📋 Available commands:" -ForegroundColor Yellow
Write-Host "1. Setup and start development servers" -ForegroundColor White
Write-Host "2. Just start development servers" -ForegroundColor White
Write-Host "3. Run tests" -ForegroundColor White
Write-Host "4. Open WSL terminal" -ForegroundColor White
Write-Host "5. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Select an option (1-5)"

switch ($choice) {
    "1" {
        Write-Host "🚀 Setting up and starting development servers..." -ForegroundColor Green
        wsl -d Ubuntu-22.04 bash -c "cd '$wslPath' && chmod +x scripts/*.sh && ./scripts/setup.sh && ./scripts/start-dev.sh"
    }
    "2" {
        Write-Host "🚀 Starting development servers..." -ForegroundColor Green
        wsl -d Ubuntu-22.04 bash -c "cd '$wslPath' && ./scripts/start-dev.sh"
    }
    "3" {
        Write-Host "🧪 Running tests..." -ForegroundColor Green
        wsl -d Ubuntu-22.04 bash -c "cd '$wslPath' && chmod +x scripts/*.sh && ./scripts/test.sh"
    }
    "4" {
        Write-Host "🔧 Opening WSL terminal..." -ForegroundColor Green
        wsl -d Ubuntu-22.04 bash -c "cd '$wslPath' && bash"
    }
    "5" {
        Write-Host "👋 Goodbye!" -ForegroundColor Yellow
        exit 0
    }
    default {
        Write-Host "❌ Invalid option. Please select 1-5." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✅ Command completed!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Quick access URLs:" -ForegroundColor Cyan
Write-Host "   Web App: http://localhost:5173" -ForegroundColor White
Write-Host "   API:     http://localhost:3000" -ForegroundColor White
Write-Host "   API Docs: http://localhost:3000/docs" -ForegroundColor White
Write-Host ""
Write-Host "📚 For more help, see WSL_STARTUP_GUIDE.md" -ForegroundColor Yellow
