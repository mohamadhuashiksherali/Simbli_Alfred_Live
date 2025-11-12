import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getBillingHistoryApi } from '../api/api';
import './BillingHistory.css';

const BillingHistory = () => {
  const { user } = useAuth();
  const [billingHistory, setBillingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchBillingHistory();
    }
  }, [user]);

  const fetchBillingHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getBillingHistoryApi();
      
      if (response.data && response.data.status === 'success') {
        setBillingHistory(response.data.billing_history || []);
      } else {
        setError('Failed to fetch billing history');
      }
    } catch (err) {
      console.error('Error fetching billing history:', err);
      setError('Error loading billing history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodIcon = (paymentMethod, status) => {
    if (paymentMethod === 'Subscription charged') {
      if (status === 'Paid') {
        return (
          <div className="payment-icon subscription-paid">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      } else {
        return (
          <div className="payment-icon subscription-failed">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      }
    } else if (paymentMethod === 'Top-up purchased') {
      return (
        <div className="payment-icon topup-paid">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      );
    } else if (paymentMethod === 'Payment failed') {
      return (
        <div className="payment-icon payment-failed">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      );
    } else if (paymentMethod === 'Refund issued') {
      return (
        <div className="payment-icon refund-issued">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 12L12 9L15 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      );
    }
    
    // Default icon
    return (
      <div className="payment-icon default">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Paid': 'status-paid',
      'Failed': 'status-failed',
      'Refunded': 'status-refunded',
      'Pending': 'status-pending'
    };

    return (
      <span className={`status-badge ${statusClasses[status] || 'status-default'}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAmount = (amount, currency) => {
    return `${currency}${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="billing-history-container">
        <div className="loading-state">
          <p>Loading billing history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="billing-history-container">
        <div className="error-state">
          <p>Error: {error}</p>
          <button 
            onClick={fetchBillingHistory}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#346BFD",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="billing-history-container">
      <h1 className="billing-history-title">Billing History</h1>
      
      <div className="billing-history-card">
        <div className="billing-history-table">
          <div className="table-header">
            <div className="header-cell">Payment Method</div>
            <div className="header-cell">Plan</div>
            <div className="header-cell">Date</div>
            <div className="header-cell">Amount</div>
            <div className="header-cell">Status</div>
          </div>
          
          <div className="table-body">
            {billingHistory.length === 0 ? (
              <div className="empty-state">
                <p>No billing history found</p>
              </div>
            ) : (
              billingHistory.map((transaction) => (
                <div key={transaction.id} className="table-row">
                  <div className="table-cell payment-method">
                    {getPaymentMethodIcon(transaction.payment_method, transaction.status)}
                    <span className="payment-text">{transaction.payment_method}</span>
                  </div>
                  <div className="table-cell plan">
                    {transaction.plan || 'Pro Plan - Monthly'}
                  </div>
                  <div className="table-cell date">
                    {formatDate(transaction.date)}
                  </div>
                  <div className="table-cell amount">
                    {formatAmount(transaction.amount, transaction.currency)}
                  </div>
                  <div className="table-cell status">
                    {getStatusBadge(transaction.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingHistory;
