#!/usr/bin/env node

/**
 * M7Rnetwork Production Deployment Checker
 * Verifies that the application is ready for production deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 M7Rnetwork Production Readiness Check\n');

const checks = [];

// Check 1: Server package.json exists
const serverPackagePath = path.join(__dirname, 'server', 'package.json');
checks.push({
  name: 'Server package.json',
  status: fs.existsSync(serverPackagePath) ? '✅' : '❌',
  required: true
});

// Check 2: Environment file exists
const envPath = path.join(__dirname, '.env');
checks.push({
  name: 'Environment file (.env)',
  status: fs.existsSync(envPath) ? '✅' : '❌',
  required: true
});

// Check 3: Server entry point exists
const serverIndexPath = path.join(__dirname, 'server', 'index.js');
checks.push({
  name: 'Server entry point (server/index.js)',
  status: fs.existsSync(serverIndexPath) ? '✅' : '❌',
  required: true
});

// Check 4: Client files exist
const clientPath = path.join(__dirname, 'client');
checks.push({
  name: 'Client directory',
  status: fs.existsSync(clientPath) ? '✅' : '❌',
  required: true
});

// Check 5: Dockerfile exists
const dockerfilePath = path.join(__dirname, 'Dockerfile');
checks.push({
  name: 'Docker configuration',
  status: fs.existsSync(dockerfilePath) ? '✅' : '❌',
  required: false
});

// Check 6: CI/CD configuration
const ciPath = path.join(__dirname, '.github', 'workflows', 'ci.yml');
checks.push({
  name: 'CI/CD pipeline',
  status: fs.existsSync(ciPath) ? '✅' : '❌',
  required: false
});

// Display results
console.log('📋 Production Readiness Checklist:\n');
checks.forEach(check => {
  const status = check.status === '✅' ? 'READY' : 'MISSING';
  const priority = check.required ? '[REQUIRED]' : '[OPTIONAL]';
  console.log(`${check.status} ${check.name} ${priority} - ${status}`);
});

// Summary
const requiredPassing = checks.filter(c => c.required && c.status === '✅').length;
const totalRequired = checks.filter(c => c.required).length;
const optionalPassing = checks.filter(c => !c.required && c.status === '✅').length;
const totalOptional = checks.filter(c => !c.required).length;

console.log(`\n📊 Summary:`);
console.log(`Required: ${requiredPassing}/${totalRequired} passing`);
console.log(`Optional: ${optionalPassing}/${totalOptional} passing`);

if (requiredPassing === totalRequired) {
  console.log('\n🎉 Your application is READY for production deployment!');
  console.log('\n🚀 Recommended next steps:');
  console.log('1. Deploy to Railway: npm install -g @railway/cli && railway deploy');
  console.log('2. Or deploy to Render: Push to GitHub and connect to Render.com');
  console.log('3. Set up MongoDB Atlas for production database');
  console.log('4. Configure environment variables in your hosting platform');
  console.log('\n📖 See DEPLOYMENT_GUIDE.md for detailed instructions');
} else {
  console.log('\n⚠️  Missing required components for production deployment');
  console.log('Please ensure all required items are in place before deploying');
}

console.log('\n🔗 Useful links:');
console.log('- Railway: https://railway.app');
console.log('- Render: https://render.com');
console.log('- MongoDB Atlas: https://www.mongodb.com/atlas');
console.log('- Vercel: https://vercel.com');
