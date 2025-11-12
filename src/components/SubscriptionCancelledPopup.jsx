import React from 'react';
import './SubscriptionCancelledPopup.css';

const SubscriptionCancelledPopup = ({
  isOpen,
  onClose,
  onReactivateSubscription,
  onGoToHome,
  onContactSupport
}) => {
  if (!isOpen) return null;

  return (
    <div className="subscription-cancelled-overlay">
      <div className="subscription-cancelled-container">
        <button 
          className="subscription-cancelled-close"
          onClick={onClose}
          aria-label="Close"
        >
          <svg width="13" height="13" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 1L1 16M1 1L16 16" stroke="#545454" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Success Icon */}
        <div className="subscription-cancelled-icon">
         <svg width="86" height="86" viewBox="0 0 86 86" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="43" cy="43" r="43" fill="#DEFFEC"/>
<path d="M63 40.7171V42.5111C62.9977 46.7161 61.636 50.8078 59.1181 54.1757C56.6005 57.5437 53.0614 60.0075 49.029 61.1998C44.9964 62.392 40.6867 62.2489 36.7422 60.7916C32.7978 59.3344 29.4301 56.6411 27.1414 53.1135C24.8527 49.5859 23.7656 45.4129 24.0423 41.2169C24.3189 37.0211 25.9446 33.027 28.6766 29.8305C31.4087 26.6339 35.1009 24.4062 39.2026 23.4795C43.3042 22.5527 47.5956 22.9767 51.4365 24.6882M63 26.9L43.5 46.4195L37.65 40.5695" stroke="#53C753" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

        </div>

        {/* Header */}
        <div className="subscription-cancelled-header">
          <h2 className="subscription-cancelled-title">
            Your Subscription<br/>has been Cancelled
          </h2>
          <p className="subscription-cancelled-description">
            We're sad to see you go – but you can reactivate anytime.<br/>Thank you for being part of our community.
          </p>
        </div>

        {/* Additional Info */}
        <div className="subscription-cancelled-info">
          <p>The change will be reflected in your account within 24 hours.</p>
        </div>

        {/* Action Buttons */}
        <div className="subscription-cancelled-actions">
          <button 
            className="subscription-cancelled-reactivate-btn"
            onClick={onReactivateSubscription}
          >
            Reactivate Subscription
          </button>
          
          <button 
            className="subscription-cancelled-home-btn"
            onClick={onGoToHome}
          >
            Go to Home
          </button>
          
          <button 
            className="subscription-cancelled-support-btn"
            onClick={onContactSupport}
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCancelledPopup;
