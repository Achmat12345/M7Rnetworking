
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables first
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const port = process.env.PORT || 5000;

// Database connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL,
    'file://'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to M7Rnetworking API!',
    version: '1.0.0',
    status: 'online',
    features: [
      'User Authentication',
      'Product Management',
      'Store Builder',
      'AI Assistant',
      'Payment Processing',
      'Affiliate Program'
    ],
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      products: '/api/products',
      stores: '/api/stores',
      orders: '/api/orders',
      ai: '/api/ai',
      affiliates: '/api/affiliates',
      payments: '/api/payments'
    },
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Load and use routes one by one to catch errors
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Error loading auth routes:', error.message);
}

try {
  const userRoutes = require('./routes/users');
  app.use('/api/users', userRoutes);
  console.log('✅ User routes loaded');
} catch (error) {
  console.error('❌ Error loading user routes:', error.message);
}

try {
  const productRoutes = require('./routes/products');
  app.use('/api/products', productRoutes);
  console.log('✅ Product routes loaded');
} catch (error) {
  console.error('❌ Error loading product routes:', error.message);
}

try {
  const storeRoutes = require('./routes/stores');
  app.use('/api/stores', storeRoutes);
  console.log('✅ Store routes loaded');
} catch (error) {
  console.error('❌ Error loading store routes:', error.message);
}

try {
  const orderRoutes = require('./routes/orders');
  app.use('/api/orders', orderRoutes);
  console.log('✅ Order routes loaded');
} catch (error) {
  console.error('❌ Error loading order routes:', error.message);
}

try {
  const aiRoutes = require('./routes/ai');
  app.use('/api/ai', aiRoutes);
  console.log('✅ AI routes loaded');
} catch (error) {
  console.error('❌ Error loading AI routes:', error.message);
}

try {
  const affiliateRoutes = require('./routes/affiliates');
  app.use('/api/affiliates', affiliateRoutes);
  console.log('✅ Affiliate routes loaded');
} catch (error) {
  console.error('❌ Error loading affiliate routes:', error.message);
}

try {
  const paymentRoutes = require('./routes/payments');
  app.use('/api/payments', paymentRoutes);
  console.log('✅ Payment routes loaded');
} catch (error) {
  console.error('❌ Error loading payment routes:', error.message);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      'GET /',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'GET /api/products',
      'GET /api/stores',
      'POST /api/ai/generate-product-description'
    ]
  });
});

app.listen(port, () => {
  console.log('🚀 M7Rnetworking server starting...');
  console.log(`📡 Server running on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API Documentation: http://localhost:${port}`);
  console.log(`🗄️ Database: ${process.env.MONGO_URI ? 'MongoDB Atlas' : 'Not configured'}`);
  console.log('📝 Routes loaded successfully');
});
