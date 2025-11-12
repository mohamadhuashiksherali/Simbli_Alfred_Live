import React, { useEffect } from 'react';

const RazorpayButton = ({ 
  planId, 
  planName, 
  planPrice, 
  orderData, 
  user, 
  onSuccess, 
  onError,
  onCancel 
}) => {
  useEffect(() => {
    // Load Razorpay script if not already loaded
    if (!window.Razorpay) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handlePayment = () => {
    if (typeof window.Razorpay === 'undefined') {
      onError('Razorpay is not loaded. Please refresh the page and try again.');
      return;
    }

    const options = {
      key: orderData.razorpay_key,
      amount: orderData.order.amount, // Amount in paise
      currency: orderData.order.currency,
      name: 'Alfred',
      description: `${planName} - Monthly Subscription`,
      order_id: orderData.order.id,
      prefill: {
        name: user.name || 'User',
        email: user.email || '',
      },
      theme: {
        color: '#007bff'
      },
      handler: function (response) {
        console.log('Payment successful:', response);
        onSuccess(response);
      },
      modal: {
        ondismiss: function() {
          console.log('Payment cancelled');
          onCancel();
        }
      },
      notes: {
        plan_id: planId,
        plan_name: planName
      }
    };

    console.log('Opening Razorpay payment with options:', options);
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <button 
      onClick={handlePayment}
      className="razorpay-button"
      style={{
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '6px',
        fontSize: '16px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
      }}
      onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
      onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
    >
      Start Free Trial (₹{planPrice} refunded)
    </button>
  );
};

export default RazorpayButton;
