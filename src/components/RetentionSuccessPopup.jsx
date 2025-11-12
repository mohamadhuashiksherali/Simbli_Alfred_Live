import React from 'react';
import './RetentionSuccessPopup.css';

const RetentionSuccessPopup = ({
  isOpen,
  onClose,
  onGoToDashboard,
  onExploreFeatures,
  currentPlan,
  discountPercentage = 50,
  currency = "USD"
}) => {
  console.log(currentPlan,'currentplan')
  if (!isOpen) return null;

  // Calculate pricing - always show USD for retention offers
  const getPriceDisplay = (currentPlan) => {
    console.log(currentPlan,'current2')
    if (!currentPlan){
      console.log(currentPlan,'current3')
      return '$39'
    }
    console.log(currentPlan,'current4')

    
    // price_usd is already in dollars from the backend
    return `$${currentPlan.price_usd}`;
  };

  const getDiscountedPriceDisplay = () => {
    if (!currentPlan) return '$19.50';
    
    // price_usd is already in dollars from the backend
    const discountedPrice = currentPlan.price_usd * (1 - discountPercentage / 100);
    
    return `$${discountedPrice.toFixed(2)}`;
  };

  return (
    <div className="retention-success-overlay">
      <div className="retention-success-container">
        <button
          className="retention-success-close"
          onClick={onClose}
          aria-label="Close"
        >
            <svg width="13" height="13" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16 1L1 16M1 1L16 16" stroke="#545454" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
        </button>

        {/* Decorative Elements */}
        <div className="retention-success-decorations">
        </div>

        {/* Success Icon */}
        <div className="retention-success-icon">
         <svg width="70" height="70" viewBox="0 0 86 86" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="43" cy="43" r="43" fill="#DEFFEC"/>
<path d="M63 40.7171V42.5111C62.9977 46.7161 61.636 50.8078 59.1181 54.1757C56.6005 57.5437 53.0614 60.0075 49.029 61.1998C44.9964 62.392 40.6867 62.2489 36.7422 60.7916C32.7978 59.3344 29.4301 56.6411 27.1414 53.1135C24.8527 49.5859 23.7656 45.4129 24.0423 41.2169C24.3189 37.0211 25.9446 33.027 28.6766 29.8305C31.4087 26.6339 35.1009 24.4062 39.2026 23.4795C43.3042 22.5527 47.5956 22.9767 51.4365 24.6882M63 26.9L43.5 46.4195L37.65 40.5695" stroke="#53C753" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

        </div>

        {/* Header */}
        <div className="retention-success-header">
          <h2 className="retention-success-title">
            You're All Set!
          </h2>
          <p className="retention-success-subtitle">
            Thank You for Staying With Us!
          </p>
          <p className="retention-success-description">
            Your Special Offer Has Been Successfully Applied.
          </p>
        </div>

        {/* Offer Details Box */}
        <div className="retention-success-offer-box">
          <div className="retention-success-offer-text">
            Your limited-time <span className="retention-success-highlight">{discountPercentage}% OFF</span> will be applied to<br/>your next billing cycle.
          </div>
          <div className="retention-success-offer-note">
            After that month, your plan will renew at the standard price of {getPriceDisplay(currentPlan)}.
          </div>
        </div>

        {/* Action Buttons */}
        {/* <div className="retention-success-actions">
          <button
            className="retention-success-dashboard-btn"
            onClick={onGoToDashboard}
          >
            Go to My Dashboard
          </button>
          <button
            className="retention-success-features-btn"
            onClick={onExploreFeatures}
          >
            Explore Premium Features
          </button>
        </div> */}

        {/* Additional Info */}

        <div className="retention-success-info ">
          <p className='col-lg-8'>
            Your next renewal will be just {getDiscountedPriceDisplay()} ({discountPercentage}% OFF), valid for your upcoming billing month only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RetentionSuccessPopup;
