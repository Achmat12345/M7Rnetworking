const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending'
  },
  customer: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // Guest checkout info
    email: String,
    firstName: String,
    lastName: String,
    phone: String
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    price: Number,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    variant: {
      size: String,
      color: String,
      other: mongoose.Schema.Types.Mixed
    },
    subtotal: Number
  }],
  pricing: {
    subtotal: {
      type: Number,
      required: true
    },
    shipping: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'ZAR'
    }
  },
  shipping: {
    address: {
      firstName: String,
      lastName: String,
      company: String,
      street: String,
      city: String,
      province: String,
      postalCode: String,
      country: String
    },
    method: String,
    trackingNumber: String,
    estimatedDelivery: Date
  },
  billing: {
    address: {
      firstName: String,
      lastName: String,
      company: String,
      street: String,
      city: String,
      province: String,
      postalCode: String,
      country: String
    },
    sameAsShipping: {
      type: Boolean,
      default: true
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['payfast', 'stripe', 'manual'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
      default: 'pending'
    },
    transactionId: String,
    payfastPaymentId: String,
    stripePaymentIntentId: String,
    paidAt: Date,
    refundedAt: Date,
    refundAmount: Number
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  notes: String,
  // Affiliate tracking
  affiliate: {
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    commission: {
      rate: Number,
      amount: Number,
      paid: {
        type: Boolean,
        default: false
      },
      paidAt: Date
    }
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

// Generate order number
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.orderNumber = `M7R-${timestamp.slice(-6)}-${random}`;
  }
  this.updatedAt = Date.now();
  next();
});

// Calculate totals
orderSchema.pre('save', function(next) {
  // Calculate subtotal
  this.pricing.subtotal = this.items.reduce((total, item) => {
    item.subtotal = item.price * item.quantity;
    return total + item.subtotal;
  }, 0);
  
  // Calculate total
  this.pricing.total = this.pricing.subtotal + 
                      this.pricing.shipping + 
                      this.pricing.tax - 
                      this.pricing.discount;
  
  next();
});

// Index for search and filtering
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ 'customer.user': 1 });
orderSchema.index({ store: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
