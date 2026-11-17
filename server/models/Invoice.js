const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: [true, 'Please add an invoice number'],
    unique: true,
    trim: true
  },
  invoiceDate: {
    type: Date,
    required: [true, 'Please add an invoice date'],
    default: Date.now
  },
  customer: {
    name: {
      type: String,
      required: [true, 'Please add customer name'],
      trim: true
    },
    phoneNumber: {
      type: String,
      required: [true, 'Please add phone number'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please add email'],
      trim: true,
      lowercase: true
    },
    billingAddress: {
      type: String,
      required: [true, 'Please add billing address']
    },
    gstin: {
      type: String,
      trim: true,
      default: ''
    }
  },
  items: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true
    },
    itemName: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    denomination: {
      type: String,
      default: 'pieces'
    },
    gst: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage'
    }
  }],
  calculations: {
    subtotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    totalGST: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    totalDiscount: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    }
  },
  gst: {
    type: Number,
    default: 18,
    min: 0,
    max: 100
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'fixed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
