const express = require('express');
const Store = require('../models/Store');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/stores
// @desc    Get all public stores
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const filter = { 'settings.isPublic': true, isActive: true };
    if (search) {
      filter.$text = { $search: search };
    }

    const stores = await Store.find(filter)
      .populate('owner', 'username profile')
      .select('-pages') // Exclude page content for performance
      .sort({ 'analytics.revenue': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Store.countDocuments(filter);

    res.json({
      stores,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/stores/:slug
// @desc    Get store by slug
// @access  Public
router.get('/:slug', async (req, res) => {
  try {
    const store = await Store.findOne({ slug: req.params.slug, isActive: true })
      .populate('owner', 'username profile')
      .populate({
        path: 'products',
        match: { isActive: true },
        select: 'name description price images category isFeatured sales',
        options: { limit: 20 }
      });

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Increment analytics
    store.analytics.visitors += 1;
    await store.save();

    res.json({ store });
  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/stores
// @desc    Create new store
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, theme, settings } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Store name is required' });
    }

    // Generate unique slug
    let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const existingStore = await Store.findOne({ slug });
    if (existingStore) {
      slug += '-' + Math.random().toString(36).substr(2, 4);
    }

    const store = new Store({
      name,
      slug,
      description: description || '',
      theme: theme || {},
      settings: settings || {},
      owner: req.user.id
    });

    await store.save();

    // Add store to user's stores array
    await User.findByIdAndUpdate(
      req.user.id,
      { $push: { stores: store._id } }
    );

    await store.populate('owner', 'username profile');

    res.status(201).json({
      message: 'Store created successfully',
      store
    });
  } catch (error) {
    console.error('Create store error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/stores/:id
// @desc    Update store
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Check ownership
    if (store.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this store' });
    }

    const updateFields = [
      'name', 'description', 'logo', 'banner', 'theme', 
      'settings', 'contact', 'social', 'seo'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] === 'object' && req.body[field] !== null) {
          store[field] = { ...store[field], ...req.body[field] };
        } else {
          store[field] = req.body[field];
        }
      }
    });

    // Update slug if name changed
    if (req.body.name && req.body.name !== store.name) {
      const newSlug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      const existingStore = await Store.findOne({ slug: newSlug, _id: { $ne: store._id } });
      if (!existingStore) {
        store.slug = newSlug;
      }
    }

    await store.save();
    await store.populate('owner', 'username profile');

    res.json({
      message: 'Store updated successfully',
      store
    });
  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/stores/:id
// @desc    Delete store
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Check ownership
    if (store.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this store' });
    }

    // Remove store from user's stores array
    await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { stores: store._id } }
    );

    // TODO: Handle related products and orders
    await Store.findByIdAndDelete(req.params.id);

    res.json({ message: 'Store deleted successfully' });
  } catch (error) {
    console.error('Delete store error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/stores/user/my-stores
// @desc    Get current user's stores
// @access  Private
router.get('/user/my-stores', auth, async (req, res) => {
  try {
    const stores = await Store.find({ owner: req.user.id })
      .populate('products', 'name price sales')
      .sort({ createdAt: -1 });

    res.json({ stores });
  } catch (error) {
    console.error('Get user stores error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/stores/:id/pages
// @desc    Create/Update store page
// @access  Private
router.post('/:id/pages', auth, async (req, res) => {
  try {
    const { name, slug, content, isHomePage } = req.body;

    const store = await Store.findById(req.params.id);

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Check ownership
    if (store.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this store' });
    }

    // If this is the home page, unset other home pages
    if (isHomePage) {
      store.pages.forEach(page => {
        page.isHomePage = false;
      });
    }

    const pageSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Check if page exists
    const existingPageIndex = store.pages.findIndex(p => p.slug === pageSlug);

    if (existingPageIndex > -1) {
      // Update existing page
      store.pages[existingPageIndex] = {
        ...store.pages[existingPageIndex],
        name,
        content,
        isHomePage: !!isHomePage,
        isPublished: true
      };
    } else {
      // Create new page
      store.pages.push({
        name,
        slug: pageSlug,
        content,
        isHomePage: !!isHomePage,
        isPublished: true
      });
    }

    await store.save();

    res.json({
      message: 'Page saved successfully',
      page: store.pages.find(p => p.slug === pageSlug)
    });
  } catch (error) {
    console.error('Save page error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/stores/:slug/pages/:pageSlug
// @desc    Get store page
// @access  Public
router.get('/:slug/pages/:pageSlug', async (req, res) => {
  try {
    const store = await Store.findOne({ slug: req.params.slug, isActive: true });

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const page = store.pages.find(p => p.slug === req.params.pageSlug && p.isPublished);

    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }

    res.json({ page, store: { name: store.name, theme: store.theme } });
  } catch (error) {
    console.error('Get page error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/stores/:id/analytics
// @desc    Get store analytics
// @access  Private
router.get('/:id/analytics', auth, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id)
      .populate({
        path: 'products',
        select: 'name views sales revenue createdAt'
      });

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Check ownership
    if (store.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view analytics' });
    }

    const analytics = {
      overview: store.analytics,
      products: store.products.map(p => ({
        id: p._id,
        name: p.name,
        views: p.views,
        sales: p.sales,
        revenue: p.revenue,
        conversionRate: p.views > 0 ? (p.sales / p.views * 100).toFixed(2) : 0
      })),
      summary: {
        totalProducts: store.products.length,
        totalViews: store.products.reduce((sum, p) => sum + p.views, 0),
        totalSales: store.products.reduce((sum, p) => sum + p.sales, 0),
        totalRevenue: store.products.reduce((sum, p) => sum + p.revenue, 0)
      }
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
