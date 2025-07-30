const express = require('express');
const Product = require('../models/Product');
const Store = require('../models/Store');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products (with filtering)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      category,
      type,
      store,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter = { isActive: true };

    if (category) filter.category = category;
    if (type) filter.type = type;
    if (store) filter.store = store;
    if (search) {
      filter.$text = { $search: search };
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const products = await Product.find(filter)
      .populate('store', 'name slug theme')
      .populate('creator', 'username profile.firstName profile.lastName')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('store', 'name slug theme contact')
      .populate('creator', 'username profile');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Increment view count
    product.views += 1;
    await product.save();

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      type,
      price,
      images,
      inventory,
      variants,
      tshirtDetails,
      digitalDetails,
      seo,
      tags,
      storeId,
    } = req.body;

    // Validate required fields
    if (!name || !description || !category || !type || !price || !storeId) {
      return res.status(400).json({
        message: 'Please provide all required fields',
      });
    }

    // Verify store ownership
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    if (store.owner.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: 'Not authorized to add products to this store' });
    }

    // Create product
    const product = new Product({
      name,
      description,
      category,
      type,
      price,
      images: images || [],
      inventory: inventory || {},
      variants: variants || [],
      tshirtDetails: tshirtDetails || {},
      digitalDetails: digitalDetails || {},
      seo: seo || {},
      tags: tags || [],
      store: storeId,
      creator: req.user.id,
    });

    await product.save();

    // Add product to store
    store.products.push(product._id);
    await store.save();

    await product.populate('store', 'name slug');
    await product.populate('creator', 'username');

    res.status(201).json({
      message: 'Product created successfully',
      product,
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check ownership
    if (product.creator.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: 'Not authorized to update this product' });
    }

    const updateFields = [
      'name',
      'description',
      'price',
      'images',
      'inventory',
      'variants',
      'tshirtDetails',
      'digitalDetails',
      'seo',
      'tags',
      'isActive',
      'isFeatured',
    ];

    updateFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    await product.save();
    await product.populate('store', 'name slug');

    res.json({
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check ownership
    if (product.creator.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: 'Not authorized to delete this product' });
    }

    // Remove from store
    await Store.findByIdAndUpdate(product.store, {
      $pull: { products: product._id },
    });

    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/store/:storeId
// @desc    Get products by store
// @access  Public
router.get('/store/:storeId', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const products = await Product.find({
      store: req.params.storeId,
      isActive: true,
    })
      .populate('creator', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments({
      store: req.params.storeId,
      isActive: true,
    });

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error('Get store products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/user/my-products
// @desc    Get current user's products
// @access  Private
router.get('/user/my-products', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, store } = req.query;

    const filter = { creator: req.user.id };
    if (store) filter.store = store;

    const products = await Product.find(filter)
      .populate('store', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error('Get user products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/products/categories
// @desc    Get available product categories
// @access  Public
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = [
      { value: 'tshirt', label: 'T-Shirts', icon: '👕' },
      { value: 'ebook', label: 'E-Books', icon: '📚' },
      { value: 'course', label: 'Courses', icon: '🎓' },
      { value: 'template', label: 'Templates', icon: '📄' },
      { value: 'digital', label: 'Digital Products', icon: '💾' },
      { value: 'physical', label: 'Physical Products', icon: '📦' },
      { value: 'service', label: 'Services', icon: '🛠️' },
    ];

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
