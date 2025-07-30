const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

describe('Products Routes', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Connect to test database
    const MONGO_URI =
      process.env.MONGO_URI || 'mongodb://localhost:27017/m7rnetwork_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }
  });

  afterAll(async () => {
    // Clean up test database
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
  });

  beforeEach(async () => {
    // Clean up before each test
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }

    // Create a test user and get auth token
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    const authResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    authToken = authResponse.body.token;
    userId = authResponse.body.user.id;
  });

  describe('POST /api/products', () => {
    it('should create a new product with valid data', async () => {
      const productData = {
        name: 'Test Product',
        description: 'A test product description',
        price: 99.99,
        category: 'Electronics',
        stock: 10,
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('name', productData.name);
      expect(response.body).toHaveProperty('price', productData.price);
      expect(response.body).toHaveProperty('sellerId', userId);
    });

    it('should not create product without authentication', async () => {
      const productData = {
        name: 'Test Product',
        description: 'A test product description',
        price: 99.99,
        category: 'Electronics',
        stock: 10,
      };

      const response = await request(app)
        .post('/api/products')
        .send(productData)
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should not create product with missing required fields', async () => {
      const productData = {
        description: 'A test product description',
        price: 99.99,
        // Missing name, category, stock
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(productData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/products', () => {
    beforeEach(async () => {
      // Create test products
      const products = [
        {
          name: 'Product 1',
          description: 'Description 1',
          price: 10.99,
          category: 'Electronics',
          stock: 5,
        },
        {
          name: 'Product 2',
          description: 'Description 2',
          price: 20.99,
          category: 'Books',
          stock: 3,
        },
      ];

      for (const product of products) {
        await request(app)
          .post('/api/products')
          .set('Authorization', `Bearer ${authToken}`)
          .send(product);
      }
    });

    it('should get all products', async () => {
      const response = await request(app).get('/api/products').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('price');
    });

    it('should filter products by category', async () => {
      const response = await request(app)
        .get('/api/products?category=Electronics')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('category', 'Electronics');
    });
  });
});
