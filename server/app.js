const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

// Load environment variables first
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://localhost:27017/m7rnetwork_test')
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check route
app.get('/', (req, res) => {
  res.json({
    message: 'M7Rnetworking API is running',
    status: 'healthy',
    environment: process.env.NODE_ENV || 'development',
  });
});

// Load routes safely
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
} catch (error) {
  console.error('❌ Error loading auth routes:', error.message);
}

try {
  const productRoutes = require('./routes/products');
  app.use('/api/products', productRoutes);
} catch (error) {
  console.error('❌ Error loading product routes:', error.message);
}

try {
  const userRoutes = require('./routes/users');
  app.use('/api/users', userRoutes);
} catch (error) {
  console.error('❌ Error loading user routes:', error.message);
}

// Export the app without starting the server
module.exports = app;
