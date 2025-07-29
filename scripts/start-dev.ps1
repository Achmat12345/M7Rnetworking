#!/usr/bin/env powershell

Write-Host "Starting M7Rnetworking development environment..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found! Please run setup.ps1 first." -ForegroundColor Red
    exit 1
}

# Start backend server
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd 'C:\New folder\htdocs\m7rnetworking_project\server'; npm run dev"

# Wait a moment for server to start
Start-Sleep -Seconds 2

# Open frontend in browser
Write-Host "Opening frontend in browser..." -ForegroundColor Yellow
Start-Process "client\index.html"

Write-Host "Development environment started!" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: client/index.html opened in browser" -ForegroundColor Cyan
