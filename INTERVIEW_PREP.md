# HealthyChef - MERN Stack Interview Preparation Guide

---

## 📦 Project Overview

**HealthyChef Invoice Management System** is a full-stack web application built using the **MERN Stack**:

| Letter | Technology | Role |
|--------|-----------|------|
| M | MongoDB | Database (cloud via Atlas) |
| E | Express.js | Backend framework |
| R | React.js | Frontend UI |
| N | Node.js | Backend runtime |

**What the app does:**
- Manage food items (add, view, delete)
- Create invoices for customers
- Add multiple items to an invoice with quantities
- Calculate GST and discount automatically
- Save invoices to MongoDB
- Download invoices as PDF
- View all invoices in a dashboard

---

## 🏗️ Project Structure

```
HealthyChef/
├── server/                    ← Backend (Node.js + Express)
│   ├── config/
│   │   └── db.js              ← MongoDB connection
│   ├── models/
│   │   ├── Item.js            ← Item schema
│   │   └── Invoice.js         ← Invoice schema
│   ├── controllers/
│   │   ├── itemController.js  ← Item business logic
│   │   └── invoiceController.js ← Invoice business logic
│   ├── routes/
│   │   ├── items.js           ← Item API routes
│   │   └── invoices.js        ← Invoice API routes
│   ├── .env                   ← Environment variables (secrets)
│   └── server.js              ← Entry point
│
└── client/                    ← Frontend (React)
    └── src/
        ├── App.js             ← Main component, navigation
        └── components/
            ├── ItemForm.js        ← Add new item form
            ├── ItemList.js        ← Display all items
            ├── InvoiceForm.js     ← Create invoice
            └── InvoiceDashboard.js ← View all invoices
```

---

## 🔧 Backend Code Explanation

### 1. `server.js` — Entry Point

```js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());          // Allow React (port 3000) to call Express (port 5000)
app.use(express.json());  // Parse incoming JSON request bodies

connectDB();              // Connect to MongoDB

app.use('/api/items', require('./routes/items'));
app.use('/api/invoices', require('./routes/invoices'));

app.listen(5000);
```

**Key points:**
- `cors()` — allows cross-origin requests between frontend and backend
- `express.json()` — middleware to parse JSON body from POST/PUT requests
- Routes are modular — each resource has its own route file

---

### 2. `config/db.js` — Database Connection

```js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1); // Stop server if DB fails
  }
};
```

**Key points:**
- Uses `async/await` for clean asynchronous code
- `MONGO_URI` stored in `.env` file for security
- `process.exit(1)` — stops the server if DB connection fails (no point running without DB)

---

### 3. `models/Item.js` — Item Schema

```js
const ItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: { type: String, required: true },
  variants: { type: [String], default: [] },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  createdAt: { type: Date, default: Date.now }
});
```

**Key points:**
- Mongoose Schema defines structure and validation rules
- `required` — field must be present
- `trim` — removes whitespace from strings
- `min` — minimum value validation for numbers
- `default: Date.now` — auto-sets creation timestamp

---

### 4. `models/Invoice.js` — Invoice Schema

```js
const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  customer: {
    name: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    billingAddress: { type: String, required: true }
  },
  items: [{
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    itemName: String,
    price: Number,
    quantity: { type: Number, min: 1 },
    gst: { type: Number, default: 0 },
    discount: { type: Number, default: 0 }
  }],
  calculations: {
    subtotal: Number,
    totalGST: Number,
    totalDiscount: Number,
    grandTotal: Number
  }
});
```

**Key points:**
- `unique: true` on invoiceNumber — no duplicate invoices
- `customer` is an **embedded document** (nested object)
- `items` is an **array of subdocuments**
- `ref: 'Item'` — creates a reference/relationship to the Item model
- `lowercase: true` — auto-converts email to lowercase

---

### 5. `controllers/invoiceController.js` — Business Logic

Follows the **MVC (Model-View-Controller)** pattern:

```js
// GET all invoices
exports.getInvoices = async (req, res) => {
  const invoices = await Invoice.find().sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: invoices });
};

// GET single invoice
exports.getInvoice = async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate('items.itemId');
  res.status(200).json({ success: true, data: invoice });
};

// POST create invoice
exports.createInvoice = async (req, res) => {
  // 1. Validate required fields
  // 2. Check for duplicate invoice number
  // 3. Save to MongoDB
  // 4. Return created invoice
  const invoice = await Invoice.create({ ...req.body });
  res.status(201).json({ success: true, data: invoice });
};

// DELETE invoice
exports.deleteInvoice = async (req, res) => {
  await Invoice.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, data: {} });
};
```

**REST API endpoints:**

| Method | Route | Action |
|--------|-------|--------|
| GET | /api/invoices | Get all invoices |
| GET | /api/invoices/:id | Get one invoice |
| POST | /api/invoices | Create invoice |
| PUT | /api/invoices/:id | Update invoice |
| DELETE | /api/invoices/:id | Delete invoice |

---

## ⚛️ Frontend Code Explanation

### 1. `InvoiceForm.js` — Key React Concepts Used

```js
// useState — stores component data
const [cartItems, setCartItems] = useState([]);
const [calculations, setCalculations] = useState({ subtotal: 0, grandTotal: 0 });

// useEffect — runs when dependencies change
useEffect(() => {
  // Recalculate totals whenever cart or GST changes
  let subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const gstAmount = (subtotal * gst) / 100;
  setCalculations({ subtotal, totalGST: gstAmount, grandTotal: subtotal + gstAmount });
}, [cartItems, gst]);

// axios — sends data to backend
const res = await axios.post('http://localhost:5000/api/invoices', invoicePayload);

// jsPDF — generates PDF on the client side
const doc = new jsPDF();
autoTable(doc, { head: [['Item', 'Qty', 'Price']], body: tableData });
doc.save('invoice.pdf');
```

---

### 2. `InvoiceDashboard.js` — Key Concepts

```js
// Fetch all invoices when component mounts
useEffect(() => {
  fetchInvoices();
}, []);

// Delete invoice
const handleDelete = async (id) => {
  await axios.delete(`http://localhost:5000/api/invoices/${id}`);
  setInvoices(invoices.filter(inv => inv._id !== id)); // Remove from UI
};

// Download PDF from dashboard
const handleDownloadPDF = (invoice) => {
  const doc = new jsPDF();
  autoTable(doc, { ... });
  doc.save(`HealthyChef_Invoice_${invoice.invoiceNumber}.pdf`);
};
```

---

## 🎯 Interview Questions & Answers

---

### 🔵 REACT QUESTIONS

**Q1: What is the difference between `useState` and `useEffect`?**
> `useState` stores and manages data inside a component. When state changes, the component re-renders.
> `useEffect` runs side effects — like API calls, calculations, or subscriptions — after render.
> In this app: `useState` stores cart items, `useEffect` recalculates totals when cart changes.

---

**Q2: Why do you pass a dependency array to `useEffect`?**
> To control when the effect runs.
> - `[]` — runs only once when component mounts (used to fetch items from backend)
> - `[cartItems, gst]` — runs every time cartItems or gst changes (used to recalculate totals)
> - No array — runs after every render (avoid this, causes infinite loops)

---

**Q3: What is the purpose of the `key` prop in a list?**
> React uses `key` to identify which items changed, added, or removed in a list.
> Without `key`, React re-renders the entire list on every change, which is slow.
> In this app: `key={item._id}` uses MongoDB's unique ID as the key.

---

**Q4: What is a controlled component in React?**
> A form element whose value is controlled by React state.
> Example: `<input value={invoiceData.customerName} onChange={handleInputChange} />`
> The input value always reflects the state, and state updates on every keystroke.

---

**Q5: What is the difference between `props` and `state`?**
> `state` — data managed inside a component, can be changed with setState.
> `props` — data passed from parent to child component, read-only.

---

**Q6: What is `async/await` in JavaScript?**
> A cleaner way to handle Promises (asynchronous operations).
> `async` marks a function as asynchronous.
> `await` pauses execution until the Promise resolves.
> Used in this app for all API calls to backend.

---

### 🟢 NODE.JS / EXPRESS QUESTIONS

**Q7: What is middleware in Express?**
> Functions that run between the request and response.
> They have access to `req`, `res`, and `next`.
> Examples in this app:
> - `cors()` — handles cross-origin requests
> - `express.json()` — parses JSON request bodies
> - Custom validation in controllers

---

**Q8: What is the MVC pattern?**
> Model-View-Controller — a design pattern to separate concerns:
> - **Model** — data and schema (Mongoose models)
> - **View** — user interface (React components)
> - **Controller** — business logic (controller functions)
> Keeps code organized, maintainable, and testable.

---

**Q9: What is the difference between `res.status(200)` and `res.status(201)`?**
> HTTP status codes communicate the result of a request:
> - `200 OK` — request succeeded (GET, PUT, DELETE)
> - `201 Created` — new resource was created (POST)
> - `400 Bad Request` — invalid input from client
> - `404 Not Found` — resource doesn't exist
> - `500 Internal Server Error` — server-side error

---

**Q10: What is CORS and why is it needed?**
> Cross-Origin Resource Sharing.
> Browsers block requests from one origin (localhost:3000) to another (localhost:5000) by default for security.
> The `cors()` middleware in Express adds headers that tell the browser to allow these requests.

---

**Q11: What is the difference between `PUT` and `PATCH`?**
> `PUT` — replaces the entire document with new data
> `PATCH` — updates only the specific fields provided
> This app uses `PUT` for invoice updates.

---

### 🟡 MONGODB / MONGOOSE QUESTIONS

**Q12: What is Mongoose and why use it over raw MongoDB driver?**
> Mongoose is an ODM (Object Data Modeling) library for MongoDB.
> Benefits over raw driver:
> - Schema validation (type checking, required fields, min/max)
> - Helper methods (find, findById, populate)
> - Middleware hooks (pre/post save)
> - Cleaner, more readable code

---

**Q13: What is the difference between `find()` and `findById()`?**
> `find()` — returns all documents matching a query (returns array)
> `findById(id)` — finds exactly one document by its `_id` field (returns object or null)

---

**Q14: What is `.populate()` in Mongoose?**
> Replaces an ObjectId reference with the actual document data from another collection.
> Example: `Invoice.findById(id).populate('items.itemId')`
> This replaces the `itemId` (just an ID) with the full Item document (name, price, etc.)
> Similar to a JOIN in SQL.

---

**Q15: What is an embedded document vs a referenced document?**
> **Embedded** — data stored inside the parent document (customer details in Invoice)
> - Faster reads, data always available together
> - Good for data that belongs to one parent
>
> **Referenced** — stores only the ID, fetches with populate (itemId in Invoice)
> - Good for shared data used across multiple documents
> - Avoids data duplication

---

**Q16: What does `unique: true` do in a Mongoose schema?**
> Creates a unique index in MongoDB.
> Ensures no two documents can have the same value for that field.
> Used on `invoiceNumber` — prevents duplicate invoices.
> MongoDB throws a duplicate key error if violated.

---

**Q17: What is the difference between SQL and NoSQL (MongoDB)?**

| SQL | MongoDB (NoSQL) |
|-----|----------------|
| Tables with rows | Collections with documents |
| Fixed schema | Flexible schema |
| JOINs for relations | Embedded docs or populate |
| Vertical scaling | Horizontal scaling |
| MySQL, PostgreSQL | MongoDB, Firebase |

---

### 🔴 TRICKY / ADVANCED QUESTIONS

**Q18: What happens if two users create an invoice at the same time with the same number?**
> The `unique: true` constraint on `invoiceNumber` creates a MongoDB unique index.
> The second insert will throw a `MongoServerError: E11000 duplicate key error`.
> This is caught in the try/catch block and returned as a 400 error to the client.

---

**Q19: Why do you use `process.exit(1)` in `db.js`?**
> If the database connection fails, the app cannot function at all.
> `process.exit(1)` stops the Node.js process with error code 1.
> This prevents the server from running in a broken state without a database.

---

**Q20: How does PDF generation work in this app?**
> PDF is generated entirely on the **client side** (browser) — no server involved.
> 1. `jsPDF` creates a new PDF document object
> 2. We draw text, shapes, and colors using jsPDF methods
> 3. `jspdf-autotable` renders the items table automatically
> 4. `doc.save('filename.pdf')` triggers browser download
> Advantage: No server load, instant download.

---

**Q21: What is `dotenv` and why is it used?**
> `dotenv` loads environment variables from a `.env` file into `process.env`.
> Used to store sensitive data like:
> - MongoDB connection string
> - API keys
> - Passwords
> The `.env` file is added to `.gitignore` so it's never pushed to GitHub.

---

**Q22: What is the difference between `findByIdAndDelete` and `deleteOne`?**
> `findByIdAndDelete(id)` — finds by `_id`, deletes it, and **returns the deleted document**
> `deleteOne({ _id: id })` — deletes the document but **returns only a result object** (not the document)
> `findByIdAndDelete` is preferred when you need to confirm what was deleted.

---

**Q23: How do you handle errors in this app?**
> Three levels of error handling:
> 1. **Mongoose ValidationError** — caught and returns field-specific messages (400)
> 2. **Custom validation** — manual checks before DB operations (400)
> 3. **General server errors** — caught in try/catch, returns 500
>
> Frontend shows `alert()` messages to the user on error.

---

**Q24: What is the React component lifecycle?**
> With hooks:
> - **Mount** — `useEffect(() => {}, [])` — runs once when component appears
> - **Update** — `useEffect(() => {}, [dep])` — runs when dependency changes
> - **Unmount** — return a cleanup function from useEffect
>
> In this app: fetch items on mount, recalculate totals on update.

---

**Q25: Why use `axios` instead of `fetch`?**
> `axios` advantages over `fetch`:
> - Automatically parses JSON response
> - Better error handling (throws on 4xx/5xx status codes)
> - Supports request/response interceptors
> - Cleaner syntax
> - Works in both browser and Node.js

---

## 📝 Quick Summary to Say in Interview

*"I built a full-stack Invoice Management System for a food brand called HealthyChef using the MERN stack. The backend is a REST API built with Node.js and Express, following the MVC pattern with Mongoose models for MongoDB. The frontend is React with hooks — useState for state management and useEffect for side effects like API calls and real-time calculations. The app allows creating invoices with multiple items, calculates GST and discounts automatically, saves to MongoDB Atlas, and generates downloadable PDFs using jsPDF on the client side."*

---

## 🏆 Most Commonly Asked Topics

1. **useState vs useEffect** — must know deeply
2. **REST API methods** — GET, POST, PUT, DELETE
3. **Mongoose Schema** — validation, types, references
4. **async/await** — how it works
5. **CORS** — what it is and why needed
6. **MVC pattern** — how code is organized
7. **MongoDB vs SQL** — key differences
8. **Error handling** — try/catch, HTTP status codes
9. **PDF generation** — client-side vs server-side
10. **Environment variables** — why .env is used

---

*Good luck with your interview! 🚀*
