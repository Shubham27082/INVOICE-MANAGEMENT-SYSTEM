const Invoice = require('../models/Invoice');

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Public
exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message
    });
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Public
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('items.itemId');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message
    });
  }
};

// @desc    Create new invoice
// @route   POST /api/invoices
// @access  Public
exports.createInvoice = async (req, res) => {
  try {
    const {
      invoiceNumber,
      invoiceDate,
      customerName,
      phoneNumber,
      email,
      billingAddress,
      lineItems,
      calculations
    } = req.body;

    // Validation
    if (!invoiceNumber || !customerName || !phoneNumber || !email || !billingAddress) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required customer information'
      });
    }

    if (!lineItems || lineItems.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please add at least one item to the invoice'
      });
    }

    if (!calculations) {
      return res.status(400).json({
        success: false,
        error: 'Invoice calculations are required'
      });
    }

    // Check if invoice number already exists
    const existingInvoice = await Invoice.findOne({ invoiceNumber });
    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        error: 'Invoice number already exists'
      });
    }

    // Create invoice
    const invoice = await Invoice.create({
      invoiceNumber,
      invoiceDate: invoiceDate || Date.now(),
      customer: {
        name: customerName,
        phoneNumber,
        email,
        billingAddress
      },
      items: lineItems,
      calculations: {
        subtotal: parseFloat(calculations.subtotal),
        totalGST: parseFloat(calculations.totalGST),
        totalDiscount: parseFloat(calculations.totalDiscount),
        grandTotal: parseFloat(calculations.grandTotal)
      }
    });

    res.status(201).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: messages
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message
    });
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Public
exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message
    });
  }
};

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Public
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error: ' + error.message
    });
  }
};
