import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
// eslint-disable-next-line no-unused-vars
import autoTable from 'jspdf-autotable';
import PrintableInvoice from './PrintableInvoice';
import './InvoiceForm.css';

const InvoiceForm = () => {
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: '',
    invoiceDate: '',
    customerName: '',
    customerAddress: '',
    customerCity: '',
    phoneNumber: '',
    email: '',
    gstin: '' // Added GSTIN field
  });

  const [availableItems, setAvailableItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [cartItems, setCartItems] = useState([]); // Items with qty, deno, rate
  const [gst, setGst] = useState(18); // GST percentage
  
  const [calculations, setCalculations] = useState({
    subtotal: 0,
    totalGST: 0,
    grandTotal: 0,
    roundOff: 0,
    finalTotal: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  // Company details
  const companyDetails = {
    name: 'M MARINE SERVICES',
    tagline: 'All Types Of Marine Engineering Solution, Engineering Turnkey Projects, Service In Mechanical, Electrical, Safety Items, Service In Mechanical & IT Solution',
    gstin: '29AAYFN4510A1Z8',
    accountNo: '0815073000000174',
    ifsc: 'SIBL0000815',
    bankName: 'SOUTH INDIAN BANK KARWAR',
    phone: '+91 8149332389 / 8762850701',
    email: 'naikvishal063@gmail.com',
    address: 'Off. 395 Gaonkarwada Near Ice Factory, Uttara Kannada Karnataka 581324'
  };

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
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 100);
      return `-${random.toString().padStart(3, '0')}/${day}-${month}-${year}/${year % 100}NK`;
    };

    const getCurrentDate = () => {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      return `${day}-${month}-${year}`;
    };

    setInvoiceData(prev => ({
      ...prev,
      invoiceNumber: generateInvoiceNumber(),
      invoiceDate: getCurrentDate()
    }));
  }, []);

  // Calculate totals with round off
  useEffect(() => {
    let subtotal = 0;

    cartItems.forEach(cartItem => {
      subtotal += cartItem.rate * cartItem.quantity;
    });

    const gstAmount = (subtotal * parseFloat(gst)) / 100;
    const grandTotal = subtotal + gstAmount;
    const roundedTotal = Math.round(grandTotal);
    const roundOff = roundedTotal - grandTotal;

    setCalculations({
      subtotal: subtotal.toFixed(2),
      totalGST: gstAmount.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
      roundOff: roundOff.toFixed(2),
      finalTotal: roundedTotal.toFixed(2)
    });
  }, [cartItems, gst]);

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

  // Add item to cart with quantity and denomination
  const handleAddItem = () => {
    if (!selectedItemId) {
      alert('Please select an item');
      return;
    }

    const item = availableItems.find(i => i._id === selectedItemId);
    const existingItem = cartItems.find(i => i._id === selectedItemId);

    if (existingItem) {
      alert('Item already added. Please modify quantity in the summary below.');
      return;
    } else {
      // Add new item to cart
      setCartItems([...cartItems, {
        _id: item._id,
        description: item.name,
        quantity: 1,
        deno: 'pieces', // denomination
        rate: item.price
      }]);
    }

    setSelectedItemId(''); // Reset dropdown
  };

  // Update item in cart
  const updateCartItem = (itemId, field, value) => {
    setCartItems(cartItems.map(item =>
      item._id === itemId ? { ...item, [field]: value } : item
    ));
  };

  // Remove item from cart
  const removeItem = (itemId) => {
    setCartItems(cartItems.filter(item => item._id !== itemId));
  };

  // Convert number to words (Indian format)
  const numberToWords = (num) => {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (num === 0) return 'Zero';

    const convertHundreds = (n) => {
      let str = '';
      if (n > 99) {
        str += units[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n > 19) {
        str += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      }
      if (n > 9) {
        str += teens[n - 10] + ' ';
        return str;
      }
      if (n > 0) {
        str += units[n] + ' ';
      }
      return str;
    };

    let result = '';
    const crore = Math.floor(num / 10000000);
    num %= 10000000;
    const lakh = Math.floor(num / 100000);
    num %= 100000;
    const thousand = Math.floor(num / 1000);
    num %= 1000;
    const hundred = num;

    if (crore > 0) result += convertHundreds(crore) + 'Crore ';
    if (lakh > 0) result += convertHundreds(lakh) + 'Lakh ';
    if (thousand > 0) result += convertHundreds(thousand) + 'Thousand ';
    if (hundred > 0) result += convertHundreds(hundred);

    return result.trim() + ' Only';
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
        billingAddress: `${invoiceData.customerAddress}, ${invoiceData.customerCity}`,
        customerGstin: invoiceData.gstin,
        lineItems: cartItems.map(item => ({
          itemId: item._id,
          itemName: item.description,
          price: item.rate,
          quantity: item.quantity,
          denomination: item.deno,
          gst: 0,
          discount: 0,
          discountType: 'percentage'
        })),
        calculations: {
          subtotal: calculations.subtotal,
          totalGST: calculations.totalGST,
          grandTotal: calculations.finalTotal
        },
        gst: parseFloat(gst),
        discount: 0,
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
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() + 100);
      return `-${random.toString().padStart(3, '0')}/${day}-${month}-${year}/${year % 100}NK`;
    };

    const getCurrentDate = () => {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      return `${day}-${month}-${year}`;
    };

    setInvoiceData({
      invoiceNumber: generateInvoiceNumber(),
      invoiceDate: getCurrentDate(),
      customerName: '',
      customerAddress: '',
      customerCity: '',
      phoneNumber: '',
      email: '',
      gstin: ''
    });
    setCartItems([]);
    setSelectedItemId('');
    setGst(18);
    setTouched({});
  };

  const generatePDF = () => {
    if (!invoiceData.customerName || cartItems.length === 0) {
      alert('Please fill in customer details and add items before generating PDF');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = 210;
    const pageHeight = 297;
    
    // Add logo if available
    try {
      const logo = new Image();
      logo.src = '/assets/logo.png';
      // Logo will be added at position (15, 10) with width 40
      doc.addImage(logo, 'PNG', 15, 10, 40, 30);
    } catch (err) {
      console.log('Logo not found, skipping...');
    }
    
    // Company Header Text (next to logo)
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.setFont('helvetica', 'normal');
    
    const headerText = 'All Types Of Marine Engineering Solution, Engineering Turnkey Projects, Service In Mechanical, Electrical, Safety Items, Service In Mechanical & IT Solution';
    const headerLines = doc.splitTextToSize(headerText, 130);
    doc.text(headerLines, 60, 15);
    
    // GSTIN Number
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('GSTIN Number : 29AAYFN4510A1Z8', 60, 32);
    
    // Horizontal line below header
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    doc.line(15, 42, 195, 42);
    
    // INVOICE Title (centered and underlined)
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    const invoiceText = 'INVOICE';
    const invoiceWidth = doc.getTextWidth(invoiceText);
    doc.text(invoiceText, (pageWidth - invoiceWidth) / 2, 52);
    
    // Underline INVOICE
    const underlineY = 53;
    doc.line((pageWidth - invoiceWidth) / 2, underlineY, (pageWidth + invoiceWidth) / 2, underlineY);
    
    // TO:- Section (Left)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TO:-', 15, 62);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(invoiceData.customerName.toUpperCase(), 15, 68);
    doc.text(invoiceData.customerAddress.toUpperCase(), 15, 73);
    doc.text(invoiceData.customerCity.toUpperCase(), 15, 78);
    
    // Tax Invoice Details (Right)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`TAX INVOICE NO. :${invoiceData.invoiceNumber}`, 195, 62, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(`DATE :-${invoiceData.invoiceDate}`, 195, 68, { align: 'right' });
    
    // Items Table
    const tableStartY = 85;
    const tableData = cartItems.map((item, index) => {
      const amount = item.rate * item.quantity;
      return [
        index + 1,
        item.description,
        item.quantity.toString().padStart(2, '0'),
        item.deno,
        item.rate.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      ];
    });
    
    // Add empty rows to match reference (at least 5-6 rows total)
    const minRows = 6;
    while (tableData.length < minRows) {
      tableData.push(['', '', '', '', '', '']);
    }
    
    autoTable(doc, {
      startY: tableStartY,
      head: [['SR.\nNO.', 'DESCRIPTION', 'QTY', 'DENO', 'RATE', 'AMOUNT']],
      body: tableData,
      foot: [
        ['', '', '', '', 'SUB TOTAL', calculations.subtotal],
        ['', '', '', '', `GST ${gst} %`, calculations.totalGST],
        ['', '', '', '', 'TOTAL', calculations.grandTotal],
        ['', '', '', '', 'Round off', calculations.finalTotal]
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontSize: 9,
        fontStyle: 'bold',
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
        halign: 'center',
        valign: 'middle',
        cellPadding: 3
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontSize: 9,
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
        cellPadding: 3,
        minCellHeight: 10
      },
      footStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontSize: 9,
        fontStyle: 'bold',
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
        halign: 'right',
        cellPadding: 3
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'left', cellWidth: 85 },
        2: { halign: 'center', cellWidth: 15 },
        3: { halign: 'center', cellWidth: 20 },
        4: { halign: 'right', cellWidth: 28 },
        5: { halign: 'right', cellWidth: 32 }
      },
      margin: { left: 15, right: 15 },
      tableLineColor: [0, 0, 0],
      tableLineWidth: 0.5
    });
    
    let finalY = doc.lastAutoTable.finalY + 5;
    
    // Amount in words
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const amountInWords = numberToWords(Math.round(parseFloat(calculations.finalTotal)));
    doc.text(`IN WORDS:- Rupees ${amountInWords}.`, 15, finalY + 5);
    
    // Bank Details (Left side)
    finalY = finalY + 12;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Acc no. :- ${companyDetails.accountNo}`, 15, finalY);
    doc.text(`IFSC :- ${companyDetails.ifsc}`, 15, finalY + 5);
    doc.text(companyDetails.bankName, 15, finalY + 10);
    
    // Company Seal/Stamp placeholder (right side)
    // Circle for stamp
    doc.setDrawColor(0, 0, 255);
    doc.setLineWidth(1);
    doc.circle(160, finalY + 15, 15);
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 255);
    doc.text('M MARINE', 153, finalY + 12);
    doc.text('SERVICES', 152, finalY + 16);
    doc.text('KARWAR', 154, finalY + 20);
    
    // Signature text
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('For M MARINE SERVICES', 195, finalY + 5, { align: 'right' });
    
    // Horizontal line above footer
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.5);
    doc.line(15, 255, 195, 255);
    
    // Footer - Contact Information (similar to reference)
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    
    // Phone icon and number
    doc.text('📞', 15, 265);
    doc.text(`+91 ${companyDetails.phone}`, 20, 265);
    
    // Email icon and address
    doc.text('✉', 90, 265);
    doc.setTextColor(0, 0, 255);
    doc.textWithLink(companyDetails.email, 95, 265, { url: `mailto:${companyDetails.email}` });
    
    // Location icon and address
    doc.setTextColor(0, 0, 0);
    doc.text('📍', 15, 272);
    doc.text(companyDetails.address, 20, 272);
    
    // Blue vertical stripe on right edge (like reference)
    doc.setFillColor(70, 130, 180);
    doc.rect(200, 0, 10, pageHeight, 'F');
    
    // Blue diagonal accent (bottom right - like reference)
    doc.setFillColor(70, 130, 180);
    const trianglePoints = [
      { x: 190, y: 250 },
      { x: 210, y: 280 },
      { x: 210, y: 250 }
    ];
    doc.triangle(trianglePoints[0].x, trianglePoints[0].y, 
                 trianglePoints[1].x, trianglePoints[1].y, 
                 trianglePoints[2].x, trianglePoints[2].y, 'F');
    
    doc.save(`M_Marine_Invoice_${invoiceData.invoiceNumber.replace(/\//g, '_')}.pdf`);
  };

  return (
    <div className="invoice-form-page">
      <div className="invoice-header-section marine-header">
        <h1>🚢 M MARINE SERVICES</h1>
        <p>Marine Engineering Solutions & Turnkey Projects</p>
      </div>

      <div className="invoice-form-container">
        {/* Left Side - Form */}
        <form onSubmit={handleSubmit} className="invoice-form marine-form">
          {/* Invoice Details */}
          <div className="form-section">
            <h3 className="section-title">Invoice Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Tax Invoice No. <span className="required">*</span></label>
                <input
                  type="text"
                  name="invoiceNumber"
                  value={invoiceData.invoiceNumber}
                  onChange={handleInputChange}
                  readOnly
                  className="readonly-input"
                />
              </div>

              <div className="form-group">
                <label>Date <span className="required">*</span></label>
                <input
                  type="text"
                  name="invoiceDate"
                  value={invoiceData.invoiceDate}
                  onChange={handleInputChange}
                  readOnly
                  className="readonly-input"
                />
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="form-section">
            <h3 className="section-title">TO:- Customer Details</h3>
            <div className="form-group">
              <label>Customer Name / Organization <span className="required">*</span></label>
              <input
                type="text"
                name="customerName"
                value={invoiceData.customerName}
                onChange={handleInputChange}
                onBlur={() => handleBlur('customerName')}
                placeholder="e.g., THE COMMANDING OFFICER / INS KADAMBA"
                className={touched.customerName && !invoiceData.customerName ? 'error' : ''}
                required
              />
            </div>

            <div className="form-group">
              <label>Address <span className="required">*</span></label>
              <input
                type="text"
                name="customerAddress"
                value={invoiceData.customerAddress}
                onChange={handleInputChange}
                placeholder="e.g., NAVAL BASE KARWAR"
                required
              />
            </div>

            <div className="form-group">
              <label>City / Location <span className="required">*</span></label>
              <input
                type="text"
                name="customerCity"
                value={invoiceData.customerCity}
                onChange={handleInputChange}
                placeholder="City"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone Number <span className="required">*</span></label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={invoiceData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+91 XXXXXXXXXX"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email <span className="required">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={invoiceData.email}
                  onChange={handleInputChange}
                  placeholder="email@example.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Customer GSTIN <span className="optional">(optional)</span></label>
              <input
                type="text"
                name="gstin"
                value={invoiceData.gstin}
                onChange={handleInputChange}
                placeholder="e.g., 29AAYFN4510A1Z8"
              />
            </div>
          </div>

          {/* Add Item Section */}
          <div className="form-section">
            <h3 className="section-title">Add Items / Services</h3>
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
                className="btn-add-item marine-btn"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Cart Items Summary */}
          <div className="form-section">
            <h3 className="section-title">Items Summary</h3>
            {cartItems.length === 0 ? (
              <div className="empty-cart">
                <p>No items added yet</p>
              </div>
            ) : (
              <div className="marine-table">
                <table>
                  <thead>
                    <tr>
                      <th>SR. NO.</th>
                      <th>DESCRIPTION</th>
                      <th>QTY</th>
                      <th>DENO</th>
                      <th>RATE</th>
                      <th>AMOUNT</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item, index) => (
                      <tr key={item._id}>
                        <td>{index + 1}</td>
                        <td>{item.description}</td>
                        <td>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateCartItem(item._id, 'quantity', parseInt(e.target.value) || 1)}
                            min="1"
                            className="table-input"
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={item.deno}
                            onChange={(e) => updateCartItem(item._id, 'deno', e.target.value)}
                            className="table-input"
                            placeholder="pieces"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) => updateCartItem(item._id, 'rate', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="table-input"
                          />
                        </td>
                        <td className="amount-cell">Rs. {(item.rate * item.quantity).toFixed(2)}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => removeItem(item._id)}
                            className="btn-remove-table"
                            title="Remove"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* GST */}
          <div className="form-section">
            <h3 className="section-title">GST Configuration</h3>
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
                <small className="form-hint">Standard GST is 18%</small>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary marine-btn-secondary"
            >
              Reset Form
            </button>
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="btn-preview marine-btn"
              disabled={cartItems.length === 0}
            >
              👁️ Preview Invoice
            </button>
            <button
              type="button"
              onClick={generatePDF}
              className="btn-download marine-btn-download"
              disabled={cartItems.length === 0 || loading}
            >
              📄 Download PDF
            </button>
            <button
              type="submit"
              className="btn-primary marine-btn-primary"
              disabled={cartItems.length === 0 || loading}
            >
              {loading ? 'Saving...' : '💾 Save Invoice'}
            </button>
          </div>
        </form>

        {/* Right Side - Preview */}
        <div className="invoice-preview marine-preview">
          <div className="preview-header marine-preview-header">
            <h3>📋 Invoice Preview</h3>
          </div>
          
          <div className="preview-section">
            <div className="preview-label">Tax Invoice No.:</div>
            <div className="preview-value">{invoiceData.invoiceNumber}</div>
          </div>

          <div className="preview-section">
            <div className="preview-label">Date:</div>
            <div className="preview-value">{invoiceData.invoiceDate}</div>
          </div>

          <div className="preview-divider"></div>

          <div className="preview-section">
            <div className="preview-label">TO:-</div>
            <div className="preview-value">{invoiceData.customerName || '-'}</div>
          </div>

          <div className="preview-section">
            <div className="preview-label">Address:</div>
            <div className="preview-value">
              {invoiceData.customerAddress || '-'}<br />
              {invoiceData.customerCity}
            </div>
          </div>

          <div className="preview-divider"></div>

          <div className="preview-section">
            <div className="preview-label">Items Count:</div>
            <div className="preview-value">{cartItems.length}</div>
          </div>

          <div className="preview-divider"></div>

          <div className="preview-calculations marine-calculations">
            <div className="calc-row">
              <span>SUB TOTAL:</span>
              <span>Rs. {calculations.subtotal}</span>
            </div>
            <div className="calc-row">
              <span>GST {gst}%:</span>
              <span>Rs. {calculations.totalGST}</span>
            </div>
            <div className="calc-row">
              <span>TOTAL:</span>
              <span>Rs. {calculations.grandTotal}</span>
            </div>
            <div className="calc-row">
              <span>Round off:</span>
              <span>Rs. {calculations.roundOff}</span>
            </div>
            <div className="calc-row grand-total marine-grand-total">
              <span>FINAL TOTAL:</span>
              <span>Rs. {calculations.finalTotal}</span>
            </div>
          </div>

          <div className="preview-divider"></div>

          <div className="preview-section">
            <div className="preview-label">Amount in Words:</div>
            <div className="preview-value amount-words">
              Rupees {numberToWords(Math.round(parseFloat(calculations.finalTotal)))}.
            </div>
          </div>

          <div className="preview-divider"></div>

          <div className="company-details">
            <h4>Bank Details:</h4>
            <p><strong>Acc No:</strong> {companyDetails.accountNo}</p>
            <p><strong>IFSC:</strong> {companyDetails.ifsc}</p>
            <p><strong>Bank:</strong> {companyDetails.bankName}</p>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="preview-modal" onClick={() => setShowPreview(false)}>
          <div className="preview-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal-header">
              <h2>Invoice Preview</h2>
              <div className="preview-modal-actions">
                <button 
                  onClick={() => window.print()} 
                  className="btn-print marine-btn-primary"
                >
                  🖨️ Print
                </button>
                <button 
                  onClick={() => setShowPreview(false)} 
                  className="btn-close"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="preview-modal-body">
              <PrintableInvoice 
                invoiceData={invoiceData}
                cartItems={cartItems}
                calculations={calculations}
                gst={gst}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceForm;
