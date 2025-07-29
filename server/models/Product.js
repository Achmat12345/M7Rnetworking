const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: ['tshirt', 'ebook', 'course', 'template', 'digital', 'physical', 'service']
  },
  type: {
    type: String,
    required: true,
    enum: ['physical', 'digital', 'service']
  },
  price: {
    currency: {
      type: String,
      default: 'ZAR',
      enum: ['ZAR', 'USD', 'EUR', 'GBP']
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    compareAtPrice: Number // For sales/discounts
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  inventory: {
    trackQuantity: {
      type: Boolean,
      default: true
    },
    quantity: {
      type: Number,
      default: 0
    },
    lowStockAlert: {
      type: Number,
      default: 5
    },
    sku: String
  },
  variants: [{
    name: String, // e.g., "Size", "Color"
    options: [String] // e.g., ["Small", "Medium", "Large"]
  }],
  // For T-shirts
  tshirtDetails: {
    sizes: [{
      size: String,
      quantity: Number,
      price: Number
    }],
    colors: [{
      name: String,
      hex: String,
      quantity: Number
    }],
    design: {
      front: String, // Image URL
      back: String,  // Image URL
      designFile: String // Original design file
    },
    material: String,
    printType: {
      type: String,
      enum: ['screen', 'dtg', 'vinyl', 'embroidery']
    }
  },
  // For Digital Products
  digitalDetails: {
    downloadUrl: String,
    fileSize: String,
    fileFormat: String,
    downloadLimit: Number,
    accessDuration: Number // in days
  },
  // SEO and Marketing
  seo: {
    title: String,
    metaDescription: String,
    keywords: [String]
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  // AI Generated Content
  aiGenerated: {
    description: {
      type: Boolean,
      default: false
    },
    tags: {
      type: Boolean,
      default: false
    },
    seoContent: {
      type: Boolean,
      default: false
    }
  },
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  sales: {
    type: Number,
    default: 0
  },
  revenue: {
    type: Number,
    default: 0
  },
  // Relationships
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt field
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for search
productSchema.index({ 
  name: 'text', 
  description: 'text', 
  tags: 'text' 
});

// Index for filtering
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ store: 1, isActive: 1 });
productSchema.index({ creator: 1 });

module.exports = mongoose.model('Product', productSchema);
