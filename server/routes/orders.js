const express = require('express');
const Order = require('../models/Order');
const Store = require('../models/Store');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/orders
// @desc    Get user's orders
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const filter = { 'customer.user': req.user.id };
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate('store', 'name slug logo')
      .populate('items.product', 'name images category')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('store', 'name slug logo contact')
      .populate('items.product', 'name images category description');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns this order or owns the store
    const isOrderOwner = order.customer.user?.toString() === req.user.id;
    const isStoreOwner = order.store.owner?.toString() === req.user.id;

    if (!isOrderOwner && !isStoreOwner) {
      return res
        .status(403)
        .json({ message: 'Not authorized to view this order' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/store/:storeId
// @desc    Get store orders (for store owner)
// @access  Private
router.get('/store/:storeId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    // Verify store ownership
    const store = await Store.findById(req.params.storeId);
    if (!store || store.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const filter = { store: req.params.storeId };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
        { 'customer.firstName': { $regex: search, $options: 'i' } },
        { 'customer.lastName': { $regex: search, $options: 'i' } },
      ];
    }

    const orders = await Order.find(filter)
      .populate('customer.user', 'username email')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(filter);

    // Calculate summary stats
    const summary = await Order.aggregate([
      { $match: { store: store._id } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.total' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          processingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] },
          },
          shippedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] },
          },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
          },
        },
      },
    ]);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      summary: summary[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        processingOrders: 0,
        shippedOrders: 0,
        completedOrders: 0,
      },
    });
  } catch (error) {
    console.error('Get store orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status, trackingNumber, notes } = req.body;

    const order = await Order.findById(req.params.id).populate('store');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify store ownership
    if (order.store.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const validStatuses = [
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const oldStatus = order.status;
    order.status = status;

    if (trackingNumber) {
      order.shipping.trackingNumber = trackingNumber;
    }

    if (notes) {
      order.notes = notes;
    }

    // Set estimated delivery date when shipped
    if (status === 'shipped' && !order.shipping.estimatedDelivery) {
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 5); // 5 days from shipping
      order.shipping.estimatedDelivery = estimatedDelivery;
    }

    await order.save();

    // TODO: Send notification email to customer
    console.log(
      `Order ${order.orderNumber} status changed from ${oldStatus} to ${status}`
    );

    res.json({
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/orders/:id/refund
// @desc    Process refund
// @access  Private
router.post('/:id/refund', auth, async (req, res) => {
  try {
    const { amount, reason } = req.body;

    const order = await Order.findById(req.params.id).populate('store');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify store ownership
    if (order.store.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (order.payment.status !== 'completed') {
      return res.status(400).json({ message: 'Cannot refund unpaid order' });
    }

    const refundAmount = amount || order.pricing.total;

    if (refundAmount > order.pricing.total) {
      return res
        .status(400)
        .json({ message: 'Refund amount cannot exceed order total' });
    }

    // Update order
    order.status = 'refunded';
    order.payment.refundAmount = refundAmount;
    order.payment.refundedAt = new Date();
    order.notes = `Refund: ${reason || 'No reason provided'}`;

    await order.save();

    // TODO: Process actual refund through payment provider
    // For PayFast, you would need to implement their refund API
    // For Stripe, you would use stripe.refunds.create()

    res.json({
      message: 'Refund processed successfully',
      order,
      refundAmount,
    });
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/orders/analytics/overview
// @desc    Get orders analytics overview
// @access  Private
router.get('/analytics/overview', auth, async (req, res) => {
  try {
    const { storeId, timeframe = '30d' } = req.query;

    if (!storeId) {
      return res.status(400).json({ message: 'Store ID is required' });
    }

    // Verify store ownership
    const store = await Store.findById(storeId);
    if (!store || store.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    switch (timeframe) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    const analytics = await Order.aggregate([
      {
        $match: {
          store: store._id,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$pricing.total' },
          averageOrderValue: { $avg: '$pricing.total' },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
          },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
        },
      },
    ]);

    // Daily breakdown
    const dailyStats = await Order.aggregate([
      {
        $match: {
          store: store._id,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          orders: { $sum: 1 },
          revenue: { $sum: '$pricing.total' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      overview: analytics[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        completedOrders: 0,
        pendingOrders: 0,
        cancelledOrders: 0,
      },
      dailyStats,
      timeframe,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
