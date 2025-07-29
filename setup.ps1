#!/usr/bin/env powershell

Write-Host "Starting M7Rnetworking project setup..." -ForegroundColor Green

# Get current directory
$projectRoot = Get-Location

Write-Host "Project root: $projectRoot" -ForegroundColor Yellow

# 1. Initialize package.json in server directory if it doesn't exist
if (Test-Path "server") {
    Set-Location "server"
    
    if (-not (Test-Path "package.json")) {
        Write-Host "Creating package.json..." -ForegroundColor Yellow
        npm init -y
        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: Failed to create package.json" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "package.json already exists in server directory" -ForegroundColor Green
    }
    
    # 2. Install backend dependencies
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    npm install express dotenv cors mongoose jsonwebtoken bcryptjs
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
    
    # Install development dependencies
    Write-Host "Installing development dependencies..." -ForegroundColor Yellow
    npm install --save-dev nodemon
    
    Set-Location ..
} else {
    Write-Host "ERROR: server directory missing!" -ForegroundColor Red
    exit 1
}

# 3. Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    
    $envContent = @"
# MongoDB Atlas Connection String
MONGO_URI=mongodb+srv://macherochelle:Achmat.1234@cluster0.j2pfqvp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# Server Configuration
PORT=5000
NODE_ENV=development

# PayFast Credentials (South Africa)
PAYFAST_MERCHANT_ID=your_payfast_merchant_id
PAYFAST_MERCHANT_KEY=your_payfast_merchant_key
PAYFAST_PASSPHRASE=your_payfast_passphrase
PAYFAST_SANDBOX=true

# Stripe Credentials (International)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# JWT Secret (Generate a strong random string)
JWT_SECRET=your_super_secure_jwt_secret_key_here_at_least_32_characters

# OpenAI API Key (Optional for AI features)
OPENAI_API_KEY=your_openai_api_key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Email Configuration (Optional)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
"@

    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host ".env file created with placeholders. Please update with your real credentials." -ForegroundColor Green
} else {
    Write-Host ".env file already exists. Skipping creation." -ForegroundColor Yellow
}

# 4. Create package.json in root for client dependencies (future React/Next.js setup)
if (-not (Test-Path "package.json")) {
    Write-Host "Creating root package.json for client dependencies..." -ForegroundColor Yellow
    
    $rootPackageJson = @"
{
  "name": "m7rnetworking-project",
  "version": "1.0.0",
  "description": "M7Rnetworking - Creator Economy Platform",
  "main": "server/index.js",
  "scripts": {
    "start": "node server/index.js",
    "dev": "nodemon server/index.js",
    "server": "cd server && npm run dev",
    "client": "cd client && npm start",
    "build": "npm run build:client",
    "build:client": "cd client && npm run build",
    "setup": "npm install && cd server && npm install"
  },
  "keywords": [
    "creator-economy",
    "ecommerce",
    "ai-assistant",
    "payfast",
    "stripe"
  ],
  "author": "M7Rnetworking",
  "license": "MIT",
  "workspaces": [
    "server",
    "client"
  ]
}
"@

    $rootPackageJson | Out-File -FilePath "package.json" -Encoding UTF8
    Write-Host "Root package.json created" -ForegroundColor Green
}

# 5. Create development scripts
$scriptsDir = "scripts"
if (-not (Test-Path $scriptsDir)) {
    New-Item -ItemType Directory -Path $scriptsDir
}

# Create start-dev.ps1 script
$startDevScript = @"
#!/usr/bin/env powershell

Write-Host "Starting M7Rnetworking development environment..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found! Please run setup.ps1 first." -ForegroundColor Red
    exit 1
}

# Start backend server
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process PowerShell -ArgumentList "-NoExit", "-Command", "cd '$((Get-Location).Path)\server'; npm run dev"

# Wait a moment for server to start
Start-Sleep -Seconds 2

# Open frontend in browser
Write-Host "Opening frontend in browser..." -ForegroundColor Yellow
Start-Process "client\index.html"

Write-Host "Development environment started!" -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: client/index.html opened in browser" -ForegroundColor Cyan
"@

$startDevScript | Out-File -FilePath "scripts\start-dev.ps1" -Encoding UTF8

# Create install-all.ps1 script
$installAllScript = @"
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
"@

$installAllScript | Out-File -FilePath "scripts\install-all.ps1" -Encoding UTF8

# 6. Update server/package.json with development scripts
$serverPackageJsonPath = "server\package.json"
if (Test-Path $serverPackageJsonPath) {
    Write-Host "Updating server package.json scripts..." -ForegroundColor Yellow
    
    # Read existing package.json
    $packageJsonContent = Get-Content $serverPackageJsonPath -Raw | ConvertFrom-Json
    
    # Add/update scripts
    if (-not $packageJsonContent.scripts) {
        $packageJsonContent | Add-Member -Type NoteProperty -Name 'scripts' -Value @{}
    }
    
    $packageJsonContent.scripts | Add-Member -Type NoteProperty -Name 'start' -Value 'node index.js' -Force
    $packageJsonContent.scripts | Add-Member -Type NoteProperty -Name 'dev' -Value 'nodemon index.js' -Force
    $packageJsonContent.scripts | Add-Member -Type NoteProperty -Name 'test' -Value 'echo "Error: no test specified" && exit 1' -Force
    
    # Save updated package.json
    $packageJsonContent | ConvertTo-Json -Depth 10 | Out-File -FilePath $serverPackageJsonPath -Encoding UTF8
    Write-Host "Server package.json updated with development scripts" -ForegroundColor Green
}

# 7. Create .gitignore if it doesn't exist
if (-not (Test-Path ".gitignore")) {
    Write-Host "Creating .gitignore..." -ForegroundColor Yellow
    
    $gitignoreContent = @"
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Build outputs
dist/
build/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
tmp/
temp/
"@

    $gitignoreContent | Out-File -FilePath ".gitignore" -Encoding UTF8
    Write-Host ".gitignore created" -ForegroundColor Green
}

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "         SETUP COMPLETE!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update .env file with your real credentials" -ForegroundColor White
Write-Host "2. To start development environment:" -ForegroundColor White
Write-Host "   .\scripts\start-dev.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or manually:" -ForegroundColor White
Write-Host "   Backend: cd server && npm run dev" -ForegroundColor Cyan
Write-Host "   Frontend: Open client\index.html in browser" -ForegroundColor Cyan
Write-Host ""
Write-Host "Available scripts:" -ForegroundColor Yellow
Write-Host "   .\scripts\start-dev.ps1    - Start development environment" -ForegroundColor Cyan
Write-Host "   .\scripts\install-all.ps1  - Install all dependencies" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend will be available at: http://localhost:5000" -ForegroundColor Green
Write-Host "Frontend will open in your default browser" -ForegroundColor Green
