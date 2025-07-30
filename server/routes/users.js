const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('stores', 'name slug theme.template analytics')
      .select('-password');

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const {
      profile: { firstName, lastName, bio, website, social },
      settings,
    } = req.body;

    const user = await User.findById(req.user.id);

    // Update profile
    if (firstName !== undefined) user.profile.firstName = firstName;
    if (lastName !== undefined) user.profile.lastName = lastName;
    if (bio !== undefined) user.profile.bio = bio;
    if (website !== undefined) user.profile.website = website;
    if (social) {
      user.profile.social = { ...user.profile.social, ...social };
    }

    // Update settings
    if (settings) {
      user.settings = { ...user.settings, ...settings };
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'stores',
      select: 'name analytics products',
      populate: {
        path: 'products',
        select: 'name sales revenue',
      },
    });

    // Calculate dashboard metrics
    const metrics = {
      totalStores: user.stores.length,
      totalProducts: user.stores.reduce(
        (total, store) => total + store.products.length,
        0
      ),
      totalRevenue: user.stores.reduce(
        (total, store) => total + store.analytics.revenue,
        0
      ),
      totalOrders: user.stores.reduce(
        (total, store) => total + store.analytics.orders,
        0
      ),
      affiliateEarnings: user.affiliate.totalEarnings,
      referralCount: user.affiliate.referrals.length,
    };

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        subscription: user.subscription,
        profile: user.profile,
      },
      metrics,
      stores: user.stores,
      recentActivity: [], // TODO: Implement activity tracking
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/affiliate
// @desc    Get affiliate dashboard data
// @access  Private
router.get('/affiliate', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      'affiliate.referrals.user',
      'username email createdAt'
    );

    if (!user.affiliate.isAffiliate) {
      // Enable affiliate program for user
      user.affiliate.isAffiliate = true;
      if (!user.affiliate.referralCode) {
        user.generateReferralCode();
      }
      await user.save();
    }

    res.json({
      affiliate: {
        referralCode: user.affiliate.referralCode,
        totalEarnings: user.affiliate.totalEarnings,
        pendingPayouts: user.affiliate.pendingPayouts,
        referrals: user.affiliate.referrals,
        referralLink: `${process.env.FRONTEND_URL}/register?ref=${user.affiliate.referralCode}`,
      },
    });
  } catch (error) {
    console.error('Get affiliate data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/subscription
// @desc    Update user subscription
// @access  Private
router.put('/subscription', auth, async (req, res) => {
  try {
    const { plan } = req.body;

    if (!['free', 'creator', 'pro'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid subscription plan' });
    }

    const user = await User.findById(req.user.id);
    user.subscription.plan = plan;
    user.subscription.startDate = new Date();

    // Set end date based on plan (monthly for now)
    if (plan !== 'free') {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      user.subscription.endDate = endDate;
    }

    await user.save();

    res.json({
      message: 'Subscription updated successfully',
      subscription: user.subscription,
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', auth, async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.user.id).select('+password');

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Password is incorrect' });
    }

    // TODO: Clean up related data (stores, products, orders)
    await User.findByIdAndDelete(req.user.id);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
