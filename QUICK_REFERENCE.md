# 🚀 M7Rnetworking Quick Reference

## Essential Commands (PowerShell)

### Initial Setup
```powershell
# Run this first to set up everything
.\setup.ps1
```

### Development Environment
```powershell
# Start full development environment (backend + frontend)
.\scripts\start-dev.ps1

# Or manually:
cd server; npm run dev        # Start backend server
start client\index.html       # Open frontend in browser
```

### Package Management
```powershell
# Install all dependencies
.\scripts\install-all.ps1

# Install new backend package
cd server; npm install package-name

# Install new dev dependency
cd server; npm install --save-dev package-name
```

## VS Code Tasks (Ctrl+Shift+P → "Tasks: Run Task")

- **Setup M7Rnetworking Project** - Initial setup
- **Start Development Environment** - Start everything
- **Install All Dependencies** - Install packages
- **Start Backend Server** - Backend only
- **Open Frontend** - Open landing page
- **Build Production** - Production build

## Project URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Backend API | http://localhost:5000 | Express server |
| Frontend | file://client/index.html | Landing page |
| MongoDB | Atlas Cloud | Database |
| PayFast | Sandbox/Live | SA Payments |
| Stripe | Test/Live | International |

## File Structure Quick Guide

```
📁 Root
├── 🔧 setup.ps1              # Main setup script
├── 📋 DEVELOPMENT_GUIDE.md   # Detailed guide
├── ⚙️ .env                   # Environment variables
├── 📦 package.json           # Root dependencies
│
📁 server/                    # Backend (Express.js)
├── 🚀 index.js               # Main server file
├── 📦 package.json           # Backend dependencies
│
📁 client/                    # Frontend (HTML/React)
├── 🏠 index.html             # Landing page
│
📁 ai-assistant/              # AI Integration
├── 🤖 prompts.js             # AI templates
│
📁 config/                    # Configuration
├── 🗄️ db.js                  # Database config
├── 💳 payfast.js             # Payment config
│
📁 scripts/                   # Automation
├── 🔄 start-dev.ps1          # Dev environment
├── 📥 install-all.ps1        # Install deps
```

## Environment Variables (.env)

```env
# Database
MONGO_URI=mongodb+srv://...

# Server
PORT=5000
NODE_ENV=development

# Payments
PAYFAST_MERCHANT_ID=...
PAYFAST_MERCHANT_KEY=...
STRIPE_SECRET_KEY=...

# Security
JWT_SECRET=... (32+ characters)

# AI (Optional)
OPENAI_API_KEY=...
```

## Development Workflow

1. **First Time Setup:**
   ```powershell
   .\setup.ps1
   # Edit .env with real credentials
   ```

2. **Daily Development:**
   ```powershell
   .\scripts\start-dev.ps1
   # Backend starts at http://localhost:5000
   # Frontend opens in browser
   ```

3. **Adding Features:**
   ```powershell
   # Install packages as needed
   cd server; npm install new-package
   
   # Edit code in VS Code
   # Server auto-restarts with nodemon
   ```

4. **Testing:**
   ```powershell
   # Unit tests (when implemented)
   cd server; npm test
   
   # Manual testing
   # Backend: http://localhost:5000
   # Frontend: refresh browser
   ```

## Key Development Tasks

### Phase 1: Core Setup ✅
- [x] Project structure
- [x] Express server
- [x] Development scripts
- [x] Environment configuration

### Phase 2: Backend (Current Focus)
- [ ] MongoDB connection
- [ ] User authentication (JWT)
- [ ] API endpoints (CRUD)
- [ ] Payment integration
- [ ] AI assistant endpoints

### Phase 3: Frontend Migration
- [ ] Convert to Next.js/React
- [ ] Creator dashboard
- [ ] Product builder
- [ ] Store builder
- [ ] Social feed

### Phase 4: Advanced Features
- [ ] No-code builder
- [ ] Marketplace
- [ ] Affiliate system
- [ ] Mobile app

## Common Issues & Solutions

### PowerShell Execution Policy
```powershell
# If scripts won't run:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Port Already in Use
```powershell
# Kill process on port 5000:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Node Modules Issues
```powershell
# Clear and reinstall:
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Environment Variables Not Loading
- Check `.env` file exists in root directory
- Verify no extra spaces in variable names
- Restart server after changes

## Next Steps

1. **Run Setup:** `.\setup.ps1`
2. **Configure .env:** Add your API keys
3. **Start Development:** `.\scripts\start-dev.ps1`
4. **Read Guide:** Check `DEVELOPMENT_GUIDE.md`
5. **Begin Coding:** Start with backend authentication

---
**Happy Coding! 🎉**
