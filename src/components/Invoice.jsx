import React, { useState, useEffect } from 'react';
import { getSubscriptionInvoicesApi } from '../api/api';
import './Invoice.css';

const Invoice = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getSubscriptionInvoicesApi();
      
      if (response.data && response.data.status === "success") {
        setInvoices(response.data.invoices || []);
      } else {
        setError("Failed to fetch invoices");
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError("Error loading invoices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Paid': 'status-paid',
      'Failed': 'status-failed',
      'Pending': 'status-pending'
    };
    
    return (
      <span className={`status-badge ${statusClasses[status] || 'status-pending'}`}>
        {status}
      </span>
    );
  };


  if (loading) {
    return (
      <div className="invoice-container">
        <div className="invoice-header">
          <h1>Invoice</h1>
        </div>
        <div className="invoice-card">
          <div className="loading">Loading invoices...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invoice-container">
        <div className="invoice-header">
          <h1>Invoice</h1>
        </div>
        <div className="invoice-card">
          <div className="error">
            <p>Error: {error}</p>
            <button 
              onClick={fetchInvoices}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                backgroundColor: "#84E084",
                color: "#222222",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-container">
      <div className="invoice-header">
        <h1>Invoice</h1>
      </div>
      
      <div className="invoice-card">
        <div className="invoice-table">
          <div className="table-header">
            <div className="header-cell">Date</div>
            <div className="header-cell">Invoice ID</div>
            <div className="header-cell">Amount</div>
            <div className="header-cell">Status</div>
          </div>
          
          {invoices.length === 0 ? (
            <div className="no-invoices">
              No invoices found
            </div>
          ) : (
            invoices.map((invoice, index) => (
              <div key={invoice.id} className="table-row">
                <div className="table-cell date-cell">
                  {invoice.date}
                </div>
                <div className="table-cell invoice-id-cell">
                  {invoice.invoice_id}
                </div>
                <div className="table-cell amount-cell">
                  {formatAmount(invoice.amount)}
                </div>
                <div className="table-cell status-cell">
                  {getStatusBadge(invoice.status)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Invoice;
