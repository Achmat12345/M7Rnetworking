#!/usr/bin/env node

/**
 * Quick production test script
 */

const express = require('express');
const path = require('path');

// Simple production test server
const app = express();

app.use(express.static(path.join(__dirname, 'client')));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'M7Rnetwork is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('🚀 M7Rnetwork Test Server Running!');
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log('📊 Health Check: http://localhost:' + PORT + '/api/health');
  console.log('🎯 Ready for production deployment!');
});
