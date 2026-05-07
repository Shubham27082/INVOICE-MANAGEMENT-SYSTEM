import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
// eslint-disable-next-line no-unused-vars
import autoTable from 'jspdf-autotable';
import './InvoiceForm.css';

const InvoiceForm = () => {
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: '',
    invoiceDate: '',
    customerName: '',
    phoneNumber: '',
    email: '',
    billingAddress: ''
  });

  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [cartItems, setCartItems] = useState([]); // Items in the summary/cart
  const [gst, setGst] = useState(18); // Single GST for entire invoice
  const [discount, setDiscount] = useState(0); // Fixed discount amount
  
  const [calculations, setCalculations] = useState({
    subtotal: 0,
    totalGST: 0,
    totalDiscount: 0,
    grandTotal: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});

  // Fetch items from backend
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/items');
        if (res.data.success) {
          setAvailableItems(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching items:', err);
      }
    };
    fetchItems();
  }, []);

  // Auto-generate invoice number and date
  useEffect(() => {
    const generateInvoiceNumber = () => {
      const timestamp = Date.now();
      return `INV-${timestamp}`;
    };

    const getCurrentDate = () => {
      const today = new Date();
      return today.toISOString().split('T')[0];
    };

    setInvoiceData(prev => ({
      ...prev,
      invoiceNumber: generateInvoiceNumber(),
      invoiceDate: getCurrentDate()
    }));
  }, []);

  // Calculate totals
  useEffect(() => {
    let subtotal = 0;

    cartItems.forEach(cartItem => {
      subtotal += cartItem.price * cartItem.quantity;
    });

    const gstAmount = (subtotal * parseFloat(gst)) / 100;
    const discountAmount = parseFloat(discount) || 0; // Fixed amount discount

    const grandTotal = subtotal + gstAmount - discountAmount;

    setCalculations({
      subtotal: subtotal.toFixed(2),
      totalGST: gstAmount.toFixed(2),
      totalDiscount: discountAmount.toFixed(2),
      grandTotal: grandTotal.toFixed(2)
    });
  }, [cartItems, gst, discount]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Add item to cart
  const handleAddItem = () => {
    if (!selectedItemId) {
      alert('Please select an item');
      return;
    }

    const item = availableItems.find(i => i._id === selectedItemId);
    const existingItem = cartItems.find(i => i._id === selectedItemId);

    if (existingItem) {
      // Increase quantity if item already in cart
      setCartItems(cartItems.map(i =>
        i._id === selectedItemId ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      // Add new item to cart
      setCartItems([...cartItems, {
        _id: item._id,
        name: item.name,
        price: item.price,
        quantity: 1
      }]);
    }

    setSelectedItemId(''); // Reset dropdown
  };

  // Increase quantity
  const increaseQuantity = (itemId) => {
    setCartItems(cartItems.map(item =>
      item._id === itemId ? { ...item, quantity: item.quantity + 1 } : item
    ));
  };

  // Decrease quantity
  const decreaseQuantity = (itemId) => {
    setCartItems(cartItems.map(item =>
      item._id === itemId && item.quantity > 1 ? { ...item, quantity: item.quantity - 1 } : item
    ));
  };

  // Remove item from cart
  const removeItem = (itemId) => {
    setCartItems(cartItems.filter(item => item._id !== itemId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      alert('Please add at least one item to the invoice');
      return;
    }

    if (!validateEmail(invoiceData.email)) {
      alert('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const invoicePayload = {
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceDate: invoiceData.invoiceDate,
        customerName: invoiceData.customerName,
        phoneNumber: invoiceData.phoneNumber,
        email: invoiceData.email,
        billingAddress: invoiceData.billingAddress,
        lineItems: cartItems.map(item => ({
          itemId: item._id,
          itemName: item.name,
          price: item.price,
          quantity: item.quantity,
          gst: 0,
          discount: 0,
          discountType: 'percentage'
        })),
        calculations: {
          subtotal: calculations.subtotal,
          totalGST: calculations.totalGST,
          totalDiscount: calculations.totalDiscount,
          grandTotal: calculations.grandTotal
        },
        gst: parseFloat(gst),
        discount: parseFloat(discount),
        discountType: 'fixed'
      };

      const res = await axios.post('http://localhost:5000/api/invoices', invoicePayload);

      if (res.data.success) {
        alert('Invoice saved successfully!');
        handleReset();
      }
    } catch (err) {
      console.error('Error saving invoice:', err);
      const errorMessage = err.response?.data?.message || 'Failed to save invoice';
      alert('Error: ' + (Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const generateInvoiceNumber = () => {
      const timestamp = Date.now();
      return `INV-${timestamp}`;
    };

    const getCurrentDate = () => {
      const today = new Date();
      return today.toISOString().split('T')[0];
    };

    setInvoiceData({
      invoiceNumber: generateInvoiceNumber(),
      invoiceDate: getCurrentDate(),
      customerName: '',
      phoneNumber: '',
      email: '',
      billingAddress: ''
    });
    setCartItems([]);
    setSelectedItemId('');
    setGst(18);
    setDiscount(0);
    setTouched({});
  };

  const generatePDF = () => {
    if (!invoiceData.customerName || cartItems.length === 0) {
      alert('Please fill in customer details and add items before generating PDF');
      return;
    }

    const doc = new jsPDF();
    
    // HealthyChef Header
    doc.setFillColor(76, 175, 80);
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('HealthyChef', 105, 15, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Making Healthy Eating Easy & Accessible', 105, 23, { align: 'center' });
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 105, 32, { align: 'center' });
    
    // Invoice Details
    doc.setFillColor(245, 245, 245);
    doc.rect(140, 42, 55, 18, 'F');
    
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${invoiceData.invoiceNumber}`, 142, 48);
    doc.text(`Date: ${new Date(invoiceData.invoiceDate).toLocaleDateString('en-IN')}`, 142, 54);
    
    // Bill To
    doc.setFontSize(11);
    doc.setTextColor(76, 175, 80);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 20, 48);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(invoiceData.customerName, 20, 56);
    doc.setFontSize(9);
    doc.text(invoiceData.phoneNumber, 20, 62);
    doc.text(invoiceData.email, 20, 68);
    
    const addressLines = doc.splitTextToSize(invoiceData.billingAddress, 80);
    doc.text(addressLines, 20, 74);
    
    const tableStartY = 74 + (addressLines.length * 5) + 8;
    
    // Prepare table data
    const tableData = cartItems.map((item, index) => {
      const itemTotal = item.price * item.quantity;
      
      return [
        index + 1,
        item.name,
        item.quantity,
        `Rs. ${Math.round(item.price)}`,
        `Rs. ${Math.round(itemTotal)}`
      ];
    });
    
    // Items Table
    autoTable(doc, {
      startY: tableStartY,
      head: [['#', 'Item', 'Qty', 'Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [76, 175, 80],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center',
        cellPadding: 5
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [50, 50, 50],
        cellPadding: 4
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'left', cellWidth: 85 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 30 },
        4: { halign: 'right', cellWidth: 35, fontStyle: 'bold' }
      },
      margin: { left: 20, right: 20 },
      alternateRowStyles: {
        fillColor: [250, 250, 250]
      }
    });
    
    let finalY = doc.lastAutoTable.finalY + 10;
    
    // Calculations Summary
    const summaryX = 115;
    const summaryWidth = 75;
    
    doc.setDrawColor(76, 175, 80);
    doc.setLineWidth(0.5);
    doc.setFillColor(250, 250, 250);
    doc.rect(summaryX, finalY, summaryWidth, 45, 'FD');
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    
    const subtotal = Math.round(parseFloat(calculations.subtotal));
    const totalGST = Math.round(parseFloat(calculations.totalGST));
    const totalDiscount = Math.round(parseFloat(calculations.totalDiscount));
    const grandTotal = Math.round(parseFloat(calculations.grandTotal));
    
    doc.text('Subtotal:', summaryX + 5, finalY + 10);
    doc.text(`Rs. ${subtotal}`, summaryX + summaryWidth - 5, finalY + 10, { align: 'right' });
    
    doc.text(`GST (${gst}%):`, summaryX + 5, finalY + 20);
    doc.text(`Rs. ${totalGST}`, summaryX + summaryWidth - 5, finalY + 20, { align: 'right' });
    
    doc.text('Discount:', summaryX + 5, finalY + 30);
    doc.text(`-Rs. ${totalDiscount}`, summaryX + summaryWidth - 5, finalY + 30, { align: 'right' });
    
    doc.setDrawColor(76, 175, 80);
    doc.setLineWidth(1);
    doc.line(summaryX + 5, finalY + 34, summaryX + summaryWidth - 5, finalY + 34);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(76, 175, 80);
    doc.text('Grand Total:', summaryX + 5, finalY + 42);
    doc.text(`Rs. ${grandTotal}`, summaryX + summaryWidth - 5, finalY + 42, { align: 'right' });
    
    // Terms & Conditions
    finalY = finalY + 55;
    
    if (finalY > 240) {
      doc.addPage();
      finalY = 20;
    }
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(76, 175, 80);
    doc.text('Terms & Conditions:', 20, finalY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    
    const terms = [
      '1. Payment is due within 30 days of invoice date.',
      '2. Late payments may incur additional charges.',
      '3. All prices are in INR unless otherwise specified.',
      '4. Goods remain the property of the seller until payment is received in full.',
      '5. Please include invoice number with payment.'
    ];
    
    let termsY = finalY + 7;
    terms.forEach(term => {
      doc.text(term, 20, termsY);
      termsY += 5;
    });
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      doc.setFillColor(76, 175, 80);
      doc.rect(0, 285, 210, 12, 'F');
      
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);
      doc.text(`Page ${i} of ${pageCount}`, 20, 291);
      doc.text('HealthyChef - Fueling Your Body with the Best Ingredients', 105, 291, { align: 'center' });
      doc.text('Thank you!', 190, 291, { align: 'right' });
    }
    
    doc.save(`HealthyChef_Invoice_${invoiceData.invoiceNumber}.pdf`);
  };

  return (
    <div className="invoice-form-page">
      <div className="invoice-header-section">
        <h1>Create Invoice</h1>
        <p>Fill in the details below to generate an invoice</p>
      </div>

      <div className="invoice-form-container">
        {/* Left Side - Form */}
        <form onSubmit={handleSubmit} className="invoice-form">
          {/* Customer Details */}
          <div className="form-section">
            <h3 className="section-title">Customer Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Customer Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="customerName"
                  value={invoiceData.customerName}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('customerName')}
                  className={touched.customerName && !invoiceData.customerName ? 'error' : ''}
                  required
                />
                {touched.customerName && !invoiceData.customerName && (
                  <span className="error-message">Customer name is required</span>
                )}
              </div>

              <div className="form-group">
                <label>Phone Number <span className="required">*</span></label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={invoiceData.phoneNumber}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('phoneNumber')}
                  className={touched.phoneNumber && !invoiceData.phoneNumber ? 'error' : ''}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email <span className="required">*</span></label>
              <input
                type="email"
                name="email"
                value={invoiceData.email}
                onChange={handleInputChange}
                onBlur={() => handleBlur('email')}
                className={touched.email && (!invoiceData.email || !validateEmail(invoiceData.email)) ? 'error' : ''}
                required
              />
            </div>

            <div className="form-group">
              <label>Billing Address <span className="required">*</span></label>
              <textarea
                name="billingAddress"
                value={invoiceData.billingAddress}
                onChange={handleInputChange}
                onBlur={() => handleBlur('billingAddress')}
                rows="3"
                required
              />
            </div>
          </div>

          {/* Add Item Section */}
          <div className="form-section">
            <h3 className="section-title">Add Items</h3>
            <div className="add-item-row">
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>Select Item <span className="required">*</span></label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="item-select"
                >
                  <option value="">-- Select an item --</option>
                  {availableItems.map(item => (
                    <option key={item._id} value={item._id}>
                      {item.name} - Rs. {item.price}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="btn-add-item"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Cart Items */}
          <div className="form-section">
            <h3 className="section-title">Items Summary</h3>
            {cartItems.length === 0 ? (
              <div className="empty-cart">
                <p>No items added yet</p>
              </div>
            ) : (
              <div className="cart-items">
                {cartItems.map(item => (
                  <div key={item._id} className="cart-item">
                    <div className="cart-item-info">
                      <h4>{item.name}</h4>
                      <p className="cart-item-price">Rs. {item.price} each</p>
                    </div>
                    <div className="cart-item-controls">
                      <button
                        type="button"
                        onClick={() => decreaseQuantity(item._id)}
                        className="btn-quantity"
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="quantity-display">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => increaseQuantity(item._id)}
                        className="btn-quantity"
                      >
                        +
                      </button>
                      <span className="item-total">Rs. {item.price * item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(item._id)}
                        className="btn-remove"
                        title="Remove item"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* GST and Discount */}
          <div className="form-section">
            <h3 className="section-title">GST & Discount</h3>
            <div className="form-row">
              <div className="form-group">
                <label>GST % <span className="required">*</span></label>
                <input
                  type="number"
                  value={gst}
                  onChange={(e) => setGst(e.target.value)}
                  min="0"
                  max="100"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label>Discount (Rs.)</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="Enter discount amount"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary"
            >
              Reset Form
            </button>
            <button
              type="button"
              onClick={generatePDF}
              className="btn-download"
              disabled={cartItems.length === 0 || loading}
            >
              Download PDF
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={cartItems.length === 0 || loading}
            >
              {loading ? 'Saving...' : 'Save Invoice'}
            </button>
          </div>
        </form>

        {/* Right Side - Preview/Summary */}
        <div className="invoice-preview">
          <div className="preview-header">
            <h3>Invoice Preview</h3>
          </div>
          
          <div className="preview-section">
            <div className="preview-label">Invoice Number:</div>
            <div className="preview-value">{invoiceData.invoiceNumber}</div>
          </div>

          <div className="preview-section">
            <div className="preview-label">Date:</div>
            <div className="preview-value">{invoiceData.invoiceDate}</div>
          </div>

          <div className="preview-divider"></div>

          <div className="preview-section">
            <div className="preview-label">Customer:</div>
            <div className="preview-value">{invoiceData.customerName || '-'}</div>
          </div>

          <div className="preview-section">
            <div className="preview-label">Phone:</div>
            <div className="preview-value">{invoiceData.phoneNumber || '-'}</div>
          </div>

          <div className="preview-section">
            <div className="preview-label">Email:</div>
            <div className="preview-value">{invoiceData.email || '-'}</div>
          </div>

          <div className="preview-divider"></div>

          <div className="preview-section">
            <div className="preview-label">Items:</div>
            <div className="preview-value">{cartItems.length}</div>
          </div>

          {cartItems.length > 0 && (
            <div className="preview-items-list">
              {cartItems.map(item => (
                <div key={item._id} className="preview-item">
                  <span>{item.name} × {item.quantity}</span>
                  <span>Rs. {item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          )}

          <div className="preview-divider"></div>

          <div className="preview-calculations">
            <div className="calc-row">
              <span>Subtotal:</span>
              <span>Rs. {calculations.subtotal}</span>
            </div>
            <div className="calc-row">
              <span>Total GST ({gst}%):</span>
              <span>Rs. {calculations.totalGST}</span>
            </div>
            <div className="calc-row">
              <span>Total Discount:</span>
              <span>-Rs. {calculations.totalDiscount}</span>
            </div>
            <div className="calc-row grand-total">
              <span>Grand Total:</span>
              <span>Rs. {calculations.grandTotal}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;
