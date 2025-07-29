# M7Rnetworking Project - Development Guide

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account
- PayFast merchant account (for South African payments)
- Stripe account (for international payments)
- OpenAI API key (optional, for AI features)

### Setup Instructions

1. **Run the setup script:**
   ```powershell
   .\setup.ps1
   ```

2. **Update environment variables:**
   - Open `.env` file and replace placeholder values with your real credentials
   - Important: Generate a secure JWT secret (at least 32 characters)

3. **Start development environment:**
   ```powershell
   .\scripts\start-dev.ps1
   ```

   Or manually:
   ```powershell
   # Terminal 1: Backend
   cd server
   npm run dev

   # Terminal 2: Open frontend
   start client\index.html
   ```

## 📋 Development Task List

### Phase 1: Core Infrastructure ✅

- [x] Project structure setup
- [x] Express server configuration
- [x] Environment variables setup
- [x] Development scripts

### Phase 2: Backend Development 🔄

#### 2.1 Database & Models
- [ ] MongoDB connection setup
- [ ] User model (authentication)
- [ ] Product model (t-shirts, ebooks, etc.)
- [ ] Store model (user stores)
- [ ] Order model (purchases)
- [ ] Affiliate model (referral system)

#### 2.2 Authentication System
- [ ] JWT authentication middleware
- [ ] User registration endpoint
- [ ] User login endpoint
- [ ] Password reset functionality
- [ ] Email verification (optional)

#### 2.3 API Endpoints
- [ ] User profile management
- [ ] Product CRUD operations
- [ ] Store creation and management
- [ ] Order processing
- [ ] Affiliate tracking

#### 2.4 Payment Integration
- [ ] PayFast integration (South Africa)
- [ ] Stripe integration (International)
- [ ] Subscription management
- [ ] Webhook handling

### Phase 3: AI Assistant Integration 🤖

#### 3.1 Backend AI Services
- [ ] OpenAI API integration
- [ ] Prompt template system (from ai-assistant/prompts.js)
- [ ] AI endpoints for:
  - [ ] Product description generation
  - [ ] Marketing copy creation
  - [ ] Store design suggestions
  - [ ] Content optimization

#### 3.2 AI Features
- [ ] Command bar interface
- [ ] Context-aware suggestions
- [ ] Batch content generation
- [ ] A/B testing recommendations

### Phase 4: Frontend Development 🎨

#### 4.1 Landing Page Enhancement
- [ ] Responsive design improvements
- [ ] Call-to-action optimization
- [ ] Feature showcases
- [ ] Testimonials section

#### 4.2 Creator Dashboard (React/Next.js Migration)
- [ ] Setup Next.js framework
- [ ] Dashboard layout and navigation
- [ ] User profile management
- [ ] Analytics dashboard

#### 4.3 Product Builder
- [ ] Drag-and-drop product designer
- [ ] T-shirt customization tool
- [ ] eBook creator interface
- [ ] Digital product templates

#### 4.4 RawShop Store Builder
- [ ] No-code store interface
- [ ] Template selection
- [ ] Custom domain integration
- [ ] Store preview functionality

#### 4.5 RealTalk Social Feed
- [ ] Creator social feed
- [ ] Post creation and management
- [ ] Engagement features (likes, comments)
- [ ] Content discovery

### Phase 5: Advanced Features 🚀

#### 5.1 No-Code Builder
- [ ] GrapesJS integration
- [ ] Page builder interface
- [ ] Component library
- [ ] Mobile responsiveness

#### 5.2 Marketplace
- [ ] Template marketplace
- [ ] Asset store (graphics, fonts, etc.)
- [ ] Creator revenue sharing
- [ ] Search and filtering

#### 5.3 Affiliate Program
- [ ] 2-tier referral system
- [ ] Commission tracking
- [ ] Payout management
- [ ] Affiliate dashboard

### Phase 6: Testing & Quality 🧪

#### 6.1 Backend Testing
- [ ] Unit tests for API endpoints
- [ ] Integration tests for payment flows
- [ ] Database operation tests
- [ ] Authentication tests

#### 6.2 Frontend Testing
- [ ] Component testing (React Testing Library)
- [ ] E2E testing (Playwright/Cypress)
- [ ] User journey testing
- [ ] Performance testing

### Phase 7: Deployment & DevOps 🌐

#### 7.1 Infrastructure
- [ ] Backend deployment (Render/Railway/VPS)
- [ ] Frontend deployment (Vercel/Netlify)
- [ ] Database hosting (MongoDB Atlas)
- [ ] CDN setup for assets

#### 7.2 Production Configuration
- [ ] SSL certificates
- [ ] Domain configuration
- [ ] Environment management
- [ ] Monitoring and logging

#### 7.3 CI/CD Pipeline
- [ ] GitHub Actions setup
- [ ] Automated testing
- [ ] Deployment automation
- [ ] Code quality checks

## 🛠️ Technical Stack

### Backend
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT
- **Payments:** PayFast + Stripe
- **AI:** OpenAI API
- **File Upload:** Multer/Cloudinary

### Frontend
- **Current:** HTML/CSS/JavaScript
- **Migration to:** Next.js/React
- **Styling:** Tailwind CSS
- **State Management:** Redux Toolkit/Zustand
- **UI Components:** Headless UI/Radix

### DevOps
- **Version Control:** Git
- **Hosting:** Vercel (Frontend) + Render (Backend)
- **Database:** MongoDB Atlas
- **CDN:** Cloudinary/AWS S3
- **Monitoring:** Sentry

## 📁 Project Structure

```
m7rnetworking_project/
├── .env                    # Environment variables
├── .gitignore             # Git ignore rules
├── package.json           # Root package.json
├── setup.ps1              # Setup script
├── README.md              # Project documentation
├── 
├── server/                # Backend Express app
│   ├── index.js          # Main server file
│   ├── package.json      # Backend dependencies
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── services/         # Business logic
│   └── utils/            # Helper functions
│
├── client/               # Frontend application
│   ├── index.html        # Current landing page
│   ├── public/           # Static assets
│   ├── src/              # React source (when migrated)
│   └── components/       # React components
│
├── ai-assistant/         # AI integration
│   └── prompts.js        # AI prompt templates
│
├── config/               # Configuration files
│   ├── db.js            # Database configuration
│   └── payfast.js       # PayFast configuration
│
└── scripts/              # Development scripts
    ├── start-dev.ps1     # Start development environment
    └── install-all.ps1   # Install all dependencies
```

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `.\setup.ps1` | Initial project setup |
| `.\scripts\start-dev.ps1` | Start development environment |
| `.\scripts\install-all.ps1` | Install all dependencies |
| `npm run dev` | Start backend in development mode |
| `npm start` | Start backend in production mode |

## 🌟 Key Features to Implement

1. **Creator Dashboard**: All-in-one creator management
2. **AI Sidekick**: Intelligent content and business assistance
3. **RawShop**: No-code store builder
4. **RealTalk**: Social networking for creators
5. **Multi-payment**: PayFast (SA) + Stripe (International)
6. **Affiliate Program**: 2-tier referral system
7. **Marketplace**: Templates and digital assets

## 📞 Support & Documentation

- **Environment Setup**: Check `.env` file configuration
- **API Documentation**: Will be generated with Swagger
- **Database Schema**: Documented in models folder
- **Payment Testing**: Use sandbox credentials initially

---

**Next Step**: Run `.\setup.ps1` to begin development!
