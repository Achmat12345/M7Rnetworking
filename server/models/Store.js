const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  description: {
    type: String,
    maxlength: 500,
  },
  logo: String,
  banner: String,
  theme: {
    primaryColor: {
      type: String,
      default: '#3B82F6',
    },
    secondaryColor: {
      type: String,
      default: '#1F2937',
    },
    fontFamily: {
      type: String,
      default: 'Inter',
    },
    template: {
      type: String,
      default: 'modern',
      enum: ['modern', 'minimal', 'classic', 'bold', 'creative'],
    },
  },
  settings: {
    isPublic: {
      type: Boolean,
      default: true,
    },
    allowGuestCheckout: {
      type: Boolean,
      default: true,
    },
    currency: {
      type: String,
      default: 'ZAR',
      enum: ['ZAR', 'USD', 'EUR', 'GBP'],
    },
    paymentMethods: {
      payfast: {
        enabled: {
          type: Boolean,
          default: true,
        },
        merchantId: String,
        merchantKey: String,
      },
      stripe: {
        enabled: {
          type: Boolean,
          default: false,
        },
        publishableKey: String,
      },
    },
    shipping: {
      enabled: {
        type: Boolean,
        default: true,
      },
      freeShippingThreshold: Number,
      rates: [
        {
          name: String,
          price: Number,
          description: String,
        },
      ],
    },
    taxes: {
      enabled: {
        type: Boolean,
        default: false,
      },
      rate: Number,
      includeInPrice: {
        type: Boolean,
        default: true,
      },
    },
  },
  contact: {
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      province: String,
      postalCode: String,
      country: {
        type: String,
        default: 'South Africa',
      },
    },
  },
  social: {
    facebook: String,
    instagram: String,
    twitter: String,
    youtube: String,
  },
  // No-code builder data
  pages: [
    {
      name: String,
      slug: String,
      content: mongoose.Schema.Types.Mixed, // GrapesJS content
      isHomePage: {
        type: Boolean,
        default: false,
      },
      isPublished: {
        type: Boolean,
        default: false,
      },
    },
  ],
  customDomain: {
    domain: String,
    isConnected: {
      type: Boolean,
      default: false,
    },
    sslEnabled: {
      type: Boolean,
      default: false,
    },
  },
  // Analytics
  analytics: {
    visitors: {
      type: Number,
      default: 0,
    },
    pageViews: {
      type: Number,
      default: 0,
    },
    orders: {
      type: Number,
      default: 0,
    },
    revenue: {
      type: Number,
      default: 0,
    },
  },
  // SEO
  seo: {
    title: String,
    description: String,
    keywords: [String],
    favicon: String,
  },
  // Relationships
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  products: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update updatedAt field
storeSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Generate slug from name
storeSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

// Index for search
storeSchema.index({ name: 'text', description: 'text' });
storeSchema.index({ slug: 1 });
storeSchema.index({ owner: 1 });

module.exports = mongoose.model('Store', storeSchema);
