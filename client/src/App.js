import React, { useState } from 'react';
import ItemForm from './components/ItemForm';
import ItemList from './components/ItemList';
import InvoiceForm from './components/InvoiceForm';
import InvoiceDashboard from './components/InvoiceDashboard';
import './App.css';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentPage, setCurrentPage] = useState('items'); // 'items', 'invoice', or 'dashboard'

  const handleItemAdded = () => {
    // Trigger refresh of item list
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>M MARINE SERVICES</h1>
          <p>Marine Engineering Solutions & IT Services</p>
          
          <nav className="nav-tabs">
            <button 
              className={`nav-tab ${currentPage === 'items' ? 'active' : ''}`}
              onClick={() => setCurrentPage('items')}
            >
              Items
            </button>
            <button 
              className={`nav-tab ${currentPage === 'invoice' ? 'active' : ''}`}
              onClick={() => setCurrentPage('invoice')}
            >
              Create Invoice
            </button>
            <button 
              className={`nav-tab ${currentPage === 'dashboard' ? 'active' : ''}`}
              onClick={() => setCurrentPage('dashboard')}
            >
              Invoice Dashboard
            </button>
          </nav>
        </div>
      </header>
      
      <main className="app-main">
        <div className="container">
          {currentPage === 'items' ? (
            <>
              <ItemForm onItemAdded={handleItemAdded} />
              <ItemList refreshTrigger={refreshTrigger} />
            </>
          ) : currentPage === 'invoice' ? (
            <InvoiceForm />
          ) : (
            <InvoiceDashboard />
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>Built with MERN Stack 🚀</p>
      </footer>
    </div>
  );
}

export default App;
