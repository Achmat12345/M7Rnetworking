const express = require('express');
const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Store = require('../models/Store');
const User = require('../models/User');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// PayFast configuration
const payfastConfig = {
  merchantId: process.env.PAYFAST_MERCHANT_ID,
  merchantKey: process.env.PAYFAST_MERCHANT_KEY,
  passphrase: process.env.PAYFAST_PASSPHRASE,
  sandbox: process.env.PAYFAST_SANDBOX === 'true',
  returnUrl: `${process.env.FRONTEND_URL}/payment/success`,
  cancelUrl: `${process.env.FRONTEND_URL}/payment/cancel`,
  notifyUrl: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/payments/payfast/notify`,
};

// Generate PayFast signature
const generatePayFastSignature = (data, passphrase = '') => {
  // Create parameter string
  let paramString = '';
  const sortedKeys = Object.keys(data).sort();

  sortedKeys.forEach((key) => {
    if (data[key] !== '') {
      paramString += `${key}=${encodeURIComponent(data[key].toString().trim())}&`;
    }
  });

  // Remove last ampersand
  paramString = paramString.slice(0, -1);

  if (passphrase) {
    paramString += `&passphrase=${encodeURIComponent(passphrase.trim())}`;
  }

  return crypto.createHash('md5').update(paramString).digest('hex');
};

// @route   POST /api/payments/create-order
// @desc    Create order and payment intent
// @access  Public (guest checkout allowed)
router.post('/create-order', optionalAuth, async (req, res) => {
  try {
    const {
      items,
      customer,
      shipping,
      billing,
      paymentMethod,
      storeId,
      referralCode,
    } = req.body;

    // Validate required fields
    if (!items || !items.length || !customer || !storeId) {
      return res.status(400).json({
        message: 'Missing required fields',
      });
    }

    // Verify store exists
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Validate and calculate order totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return res.status(400).json({
          message: `Product ${item.productId} not found or inactive`,
        });
      }

      const itemTotal = product.price.amount * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price.amount,
        quantity: item.quantity,
        variant: item.variant || {},
        subtotal: itemTotal,
      });
    }

    // Calculate shipping and tax
    const shippingCost = store.settings.shipping?.enabled
      ? store.settings.shipping.rates?.[0]?.price || 0
      : 0;

    const taxRate = store.settings.taxes?.enabled
      ? store.settings.taxes.rate || 0
      : 0;
    const taxAmount = store.settings.taxes?.includeInPrice
      ? 0
      : subtotal * (taxRate / 100);

    const total = subtotal + shippingCost + taxAmount;

    // Handle affiliate referral
    let affiliate = null;
    if (referralCode) {
      const referrer = await User.findOne({
        'affiliate.referralCode': referralCode,
      });
      if (referrer) {
        affiliate = {
          referrer: referrer._id,
          commission: {
            rate: 0.05, // 5% commission
            amount: total * 0.05,
          },
        };
      }
    }

    // Create order
    const order = new Order({
      customer: {
        user: req.user?.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
      },
      items: orderItems,
      pricing: {
        subtotal,
        shipping: shippingCost,
        tax: taxAmount,
        total,
        currency: store.settings.currency || 'ZAR',
      },
      shipping,
      billing: billing || shipping,
      payment: {
        method: paymentMethod,
      },
      store: storeId,
      affiliate,
    });

    await order.save();

    // Create payment based on method
    let paymentData = {};

    if (paymentMethod === 'payfast') {
      // Create PayFast payment
      const payfastData = {
        merchant_id: payfastConfig.merchantId,
        merchant_key: payfastConfig.merchantKey,
        return_url: payfastConfig.returnUrl,
        cancel_url: payfastConfig.cancelUrl,
        notify_url: payfastConfig.notifyUrl,
        name_first: customer.firstName,
        name_last: customer.lastName,
        email_address: customer.email,
        m_payment_id: order._id.toString(),
        amount: total.toFixed(2),
        item_name: `Order ${order.orderNumber}`,
        item_description: `Order from ${store.name}`,
        custom_str1: order._id.toString(),
        custom_str2: storeId,
      };

      const signature = generatePayFastSignature(
        payfastData,
        payfastConfig.passphrase
      );
      payfastData.signature = signature;

      paymentData = {
        url: payfastConfig.sandbox
          ? 'https://sandbox.payfast.co.za/eng/process'
          : 'https://www.payfast.co.za/eng/process',
        data: payfastData,
      };
    } else if (paymentMethod === 'stripe') {
      // Create Stripe payment intent
      // TODO: Implement Stripe integration
      paymentData = {
        clientSecret: 'stripe_payment_intent_client_secret',
        message: 'Stripe integration coming soon',
      };
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        id: order._id,
        orderNumber: order.orderNumber,
        total: order.pricing.total,
        currency: order.pricing.currency,
      },
      payment: paymentData,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments/payfast/notify
// @desc    PayFast IPN (Instant Payment Notification)
// @access  Public
router.post('/payfast/notify', async (req, res) => {
  try {
    const data = req.body;

    // Verify signature
    const { signature, ...dataWithoutSignature } = data;
    const calculatedSignature = generatePayFastSignature(
      dataWithoutSignature,
      payfastConfig.passphrase
    );

    if (signature !== calculatedSignature) {
      console.error('PayFast signature verification failed');
      return res.status(400).send('Invalid signature');
    }

    // Find order
    const order = await Order.findById(data.custom_str1);
    if (!order) {
      console.error('Order not found:', data.custom_str1);
      return res.status(404).send('Order not found');
    }

    // Update order based on payment status
    if (data.payment_status === 'COMPLETE') {
      order.payment.status = 'completed';
      order.payment.transactionId = data.pf_payment_id;
      order.payment.payfastPaymentId = data.pf_payment_id;
      order.payment.paidAt = new Date();
      order.status = 'processing';

      // Update product sales
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: {
            sales: item.quantity,
            revenue: item.subtotal,
          },
        });
      }

      // Update store analytics
      await Store.findByIdAndUpdate(order.store, {
        $inc: {
          'analytics.orders': 1,
          'analytics.revenue': order.pricing.total,
        },
      });

      // Handle affiliate commission
      if (order.affiliate?.referrer) {
        await User.findByIdAndUpdate(order.affiliate.referrer, {
          $inc: {
            'affiliate.totalEarnings': order.affiliate.commission.amount,
            'affiliate.pendingPayouts': order.affiliate.commission.amount,
          },
        });
      }
    } else {
      order.payment.status = 'failed';
      order.status = 'cancelled';
    }

    await order.save();

    res.status(200).send('OK');
  } catch (error) {
    console.error('PayFast notify error:', error);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/payments/order/:orderId
// @desc    Get order details
// @access  Public (with order ID)
router.get('/order/:orderId', async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('store', 'name')
      .populate('items.product', 'name images');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payments/orders
// @desc    Get user's orders
// @access  Private
router.get('/orders', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const orders = await Order.find({ 'customer.user': req.user.id })
      .populate('store', 'name slug')
      .populate('items.product', 'name images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments({ 'customer.user': req.user.id });

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

// @route   GET /api/payments/store/:storeId/orders
// @desc    Get store orders (for store owner)
// @access  Private
router.get('/store/:storeId/orders', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    // Verify store ownership
    const store = await Store.findById(req.params.storeId);
    if (!store || store.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const filter = { store: req.params.storeId };
    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate('items.product', 'name images')
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
    console.error('Get store orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/payments/order/:orderId/status
// @desc    Update order status (for store owner)
// @access  Private
router.put('/order/:orderId/status', auth, async (req, res) => {
  try {
    const { status, trackingNumber } = req.body;

    const order = await Order.findById(req.params.orderId).populate(
      'store',
      'owner'
    );

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
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    order.status = status;
    if (trackingNumber) {
      order.shipping.trackingNumber = trackingNumber;
    }

    await order.save();

    res.json({
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
