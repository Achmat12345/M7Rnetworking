#!/usr/bin/env powershell

Write-Host "Installing all project dependencies..." -ForegroundColor Green

# Install root dependencies
Write-Host "Installing root dependencies..." -ForegroundColor Yellow
npm install

# Install server dependencies
Write-Host "Installing server dependencies..." -ForegroundColor Yellow
cd server
npm install
cd ..

Write-Host "All dependencies installed successfully!" -ForegroundColor Green
