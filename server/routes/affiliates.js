const express = require('express');
const User = require('../models/User');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/affiliates/dashboard
// @desc    Get affiliate dashboard data
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'affiliate.referrals.user',
        select: 'username email createdAt subscription'
      });

    // Enable affiliate program if not already enabled
    if (!user.affiliate.isAffiliate) {
      user.affiliate.isAffiliate = true;
      if (!user.affiliate.referralCode) {
        user.generateReferralCode();
      }
      await user.save();
    }

    // Calculate commission from orders
    const commissionData = await Order.aggregate([
      {
        $match: {
          'affiliate.referrer': user._id,
          'payment.status': 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalCommission: { $sum: '$affiliate.commission.amount' },
          totalOrders: { $sum: 1 },
          paidCommission: {
            $sum: {
              $cond: [
                { $eq: ['$affiliate.commission.paid', true] },
                '$affiliate.commission.amount',
                0
              ]
            }
          },
          unpaidCommission: {
            $sum: {
              $cond: [
                { $eq: ['$affiliate.commission.paid', false] },
                '$affiliate.commission.amount',
                0
              ]
            }
          }
        }
      }
    ]);

    const commission = commissionData[0] || {
      totalCommission: 0,
      totalOrders: 0,
      paidCommission: 0,
      unpaidCommission: 0
    };

    // Get recent referrals (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentReferrals = user.affiliate.referrals.filter(
      referral => referral.dateReferred >= thirtyDaysAgo
    );

    // Calculate conversion metrics
    const totalReferrals = user.affiliate.referrals.length;
    const paidReferrals = user.affiliate.referrals.filter(
      referral => referral.user.subscription?.plan !== 'free'
    ).length;

    const conversionRate = totalReferrals > 0 ? 
      ((paidReferrals / totalReferrals) * 100).toFixed(2) : 0;

    res.json({
      affiliate: {
        isActive: user.affiliate.isAffiliate,
        referralCode: user.affiliate.referralCode,
        referralLink: `${process.env.FRONTEND_URL}/register?ref=${user.affiliate.referralCode}`,
        totalEarnings: user.affiliate.totalEarnings,
        pendingPayouts: user.affiliate.pendingPayouts,
        commission,
        metrics: {
          totalReferrals,
          recentReferrals: recentReferrals.length,
          paidReferrals,
          conversionRate: parseFloat(conversionRate)
        },
        referrals: user.affiliate.referrals.slice(0, 10) // Last 10 referrals
      }
    });
  } catch (error) {
    console.error('Get affiliate dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/affiliates/referrals
// @desc    Get detailed referrals list
// @access  Private
router.get('/referrals', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const user = await User.findById(req.user.id);

    if (!user.affiliate.isAffiliate) {
      return res.status(403).json({ message: 'Affiliate program not enabled' });
    }

    // Build filter
    let referralFilter = {};
    if (status === 'converted') {
      referralFilter = { 'subscription.plan': { $ne: 'free' } };
    } else if (status === 'free') {
      referralFilter = { 'subscription.plan': 'free' };
    }

    // Get detailed referral data
    const referrals = await User.find({
      'affiliate.referredBy': req.user.id,
      ...referralFilter
    })
      .select('username email createdAt subscription affiliate.commissionEarned lastLogin')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments({
      'affiliate.referredBy': req.user.id,
      ...referralFilter
    });

    // Calculate commission for each referral
    const referralsWithCommission = await Promise.all(
      referrals.map(async (referral) => {
        const orders = await Order.find({
          'affiliate.referrer': req.user.id,
          'customer.user': referral._id,
          'payment.status': 'completed'
        });

        const totalCommission = orders.reduce(
          (sum, order) => sum + (order.affiliate?.commission?.amount || 0),
          0
        );

        const paidCommission = orders
          .filter(order => order.affiliate?.commission?.paid)
          .reduce((sum, order) => sum + (order.affiliate?.commission?.amount || 0), 0);

        return {
          id: referral._id,
          username: referral.username,
          email: referral.email,
          joinDate: referral.createdAt,
          subscription: referral.subscription,
          lastLogin: referral.lastLogin,
          commission: {
            total: totalCommission,
            paid: paidCommission,
            pending: totalCommission - paidCommission
          },
          ordersCount: orders.length
        };
      })
    );

    res.json({
      referrals: referralsWithCommission,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get referrals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/affiliates/commissions
// @desc    Get commission history
// @access  Private
router.get('/commissions', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const filter = {
      'affiliate.referrer': req.user.id,
      'payment.status': 'completed'
    };

    if (status === 'paid') {
      filter['affiliate.commission.paid'] = true;
    } else if (status === 'pending') {
      filter['affiliate.commission.paid'] = false;
    }

    const commissions = await Order.find(filter)
      .populate('customer.user', 'username email')
      .populate('store', 'name')
      .select('orderNumber createdAt pricing.total affiliate.commission customer store')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(filter);

    // Calculate summary
    const summary = await Order.aggregate([
      { $match: { 'affiliate.referrer': req.user.id, 'payment.status': 'completed' } },
      {
        $group: {
          _id: null,
          totalCommissions: { $sum: '$affiliate.commission.amount' },
          paidCommissions: {
            $sum: {
              $cond: [
                { $eq: ['$affiliate.commission.paid', true] },
                '$affiliate.commission.amount',
                0
              ]
            }
          },
          pendingCommissions: {
            $sum: {
              $cond: [
                { $eq: ['$affiliate.commission.paid', false] },
                '$affiliate.commission.amount',
                0
              ]
            }
          },
          totalOrders: { $sum: 1 }
        }
      }
    ]);

    res.json({
      commissions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
      summary: summary[0] || {
        totalCommissions: 0,
        paidCommissions: 0,
        pendingCommissions: 0,
        totalOrders: 0
      }
    });
  } catch (error) {
    console.error('Get commissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/affiliates/generate-link
// @desc    Generate custom affiliate link
// @access  Private
router.post('/generate-link', auth, async (req, res) => {
  try {
    const { campaign, source, medium } = req.body;

    const user = await User.findById(req.user.id);

    if (!user.affiliate.isAffiliate) {
      return res.status(403).json({ message: 'Affiliate program not enabled' });
    }

    let link = `${process.env.FRONTEND_URL}/register?ref=${user.affiliate.referralCode}`;

    // Add UTM parameters if provided
    const utmParams = [];
    if (campaign) utmParams.push(`utm_campaign=${encodeURIComponent(campaign)}`);
    if (source) utmParams.push(`utm_source=${encodeURIComponent(source)}`);
    if (medium) utmParams.push(`utm_medium=${encodeURIComponent(medium)}`);

    if (utmParams.length > 0) {
      link += '&' + utmParams.join('&');
    }

    res.json({
      link,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`
    });
  } catch (error) {
    console.error('Generate link error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/affiliates/request-payout
// @desc    Request commission payout
// @access  Private
router.post('/request-payout', auth, async (req, res) => {
  try {
    const { amount, paymentMethod, paymentDetails } = req.body;

    const user = await User.findById(req.user.id);

    if (!user.affiliate.isAffiliate) {
      return res.status(403).json({ message: 'Affiliate program not enabled' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid payout amount' });
    }

    if (amount > user.affiliate.pendingPayouts) {
      return res.status(400).json({ 
        message: 'Requested amount exceeds available balance' 
      });
    }

    // Minimum payout threshold
    const minimumPayout = 100; // R100 minimum
    if (amount < minimumPayout) {
      return res.status(400).json({ 
        message: `Minimum payout amount is R${minimumPayout}` 
      });
    }

    // TODO: Create payout request record and process payment
    // For now, just simulate the request

    user.affiliate.pendingPayouts -= amount;
    await user.save();

    // TODO: Send notification to admin for manual processing
    // TODO: Create payout record in database

    res.json({
      message: 'Payout request submitted successfully',
      amount,
      paymentMethod,
      status: 'pending',
      estimatedProcessingTime: '3-5 business days'
    });
  } catch (error) {
    console.error('Request payout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/affiliates/analytics
// @desc    Get affiliate performance analytics
// @access  Private
router.get('/analytics', auth, async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;

    const user = await User.findById(req.user.id);

    if (!user.affiliate.isAffiliate) {
      return res.status(403).json({ message: 'Affiliate program not enabled' });
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
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

    // Get referral analytics
    const referralAnalytics = await User.aggregate([
      {
        $match: {
          'affiliate.referredBy': user._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          referrals: { $sum: 1 },
          conversions: {
            $sum: {
              $cond: [
                { $ne: ['$subscription.plan', 'free'] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get commission analytics
    const commissionAnalytics = await Order.aggregate([
      {
        $match: {
          'affiliate.referrer': user._id,
          'payment.status': 'completed',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          orders: { $sum: 1 },
          commission: { $sum: '$affiliate.commission.amount' },
          revenue: { $sum: '$pricing.total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      timeframe,
      referralAnalytics,
      commissionAnalytics,
      summary: {
        totalReferrals: user.affiliate.referrals.length,
        totalEarnings: user.affiliate.totalEarnings,
        pendingPayouts: user.affiliate.pendingPayouts
      }
    });
  } catch (error) {
    console.error('Get affiliate analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
