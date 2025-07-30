// Test setup file
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key';

// Increase timeout for database operations
jest.setTimeout(10000);
