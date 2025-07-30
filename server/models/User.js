const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  profile: {
    firstName: String,
    lastName: String,
    bio: String,
    avatar: String,
    website: String,
    social: {
      twitter: String,
      instagram: String,
      youtube: String,
      tiktok: String,
    },
  },
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'creator', 'pro'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'cancelled'],
      default: 'active',
    },
    startDate: Date,
    endDate: Date,
    stripeCustomerId: String,
    payfastCustomerId: String,
  },
  stores: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
    },
  ],
  affiliate: {
    isAffiliate: {
      type: Boolean,
      default: false,
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    referrals: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        dateReferred: {
          type: Date,
          default: Date.now,
        },
        commissionEarned: {
          type: Number,
          default: 0,
        },
      },
    ],
    totalEarnings: {
      type: Number,
      default: 0,
    },
    pendingPayouts: {
      type: Number,
      default: 0,
    },
  },
  settings: {
    notifications: {
      email: {
        type: Boolean,
        default: true,
      },
      marketing: {
        type: Boolean,
        default: false,
      },
    },
    privacy: {
      profileVisibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public',
      },
    },
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Update updatedAt field
userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate referral code
userSchema.methods.generateReferralCode = function () {
  const code =
    this.username.toLowerCase() + Math.random().toString(36).substr(2, 4);
  this.affiliate.referralCode = code;
  return code;
};

// Remove sensitive data from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.emailVerificationToken;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  return user;
};

module.exports = mongoose.model('User', userSchema);
