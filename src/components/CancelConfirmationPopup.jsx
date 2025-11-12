import React from 'react';
import './CancelConfirmationPopup.css';

const CancelConfirmationPopup = ({
  isOpen,
  onClose,
  onKeepPlan,
  onCancelSubscription,
  title,
  message,
  confirmText,
  isTrial = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="cancel-confirmation-overlay">
      <div className="cancel-confirmation-container">
        <button
          className="cancel-confirmation-close"
          onClick={onClose}
          aria-label="Close"
        >
             <svg width="13" height="13" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16 1L1 16M1 1L16 16" stroke="#545454" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
        </button>

        {/* Warning Icon */}
        <div className="cancel-confirmation-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" viewBox="0 0 86 86" fill="none">
            <circle cx="43" cy="43" r="43" fill="#CFF3DE"/>
            <path d="M43.5001 36.7278V45.1703M43.5001 53.6128H43.5201M40.7343 25.9461L24.306 55.9309C23.3948 57.5941 22.9392 58.4257 23.0065 59.1083C23.0653 59.7034 23.3604 60.2444 23.8185 60.5965C24.3437 61 25.2531 61 27.0718 61H59.9282C61.747 61 62.6562 61 63.1815 60.5965C63.6395 60.2444 63.9348 59.7034 63.9935 59.1083C64.0608 58.4257 63.6052 57.5941 62.694 55.9309L46.2657 25.9461C45.3579 24.2889 44.9039 23.4603 44.3117 23.1821C43.7949 22.9393 43.2051 22.9393 42.6886 23.1821C42.0962 23.4603 41.6421 24.289 40.7343 25.9461Z" stroke="#3ABF62" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Header */}
        <div className="cancel-confirmation-header">
          <h2 className="cancel-confirmation-title">
            {title}
          </h2>
          <p className="cancel-confirmation-message">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="cancel-confirmation-actions">
          <button
            className="cancel-confirmation-keep-btn"
            onClick={onKeepPlan}
          >
            Keep My Plan
          </button>
          <button
            className="cancel-confirmation-cancel-btn"
            onClick={onCancelSubscription}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelConfirmationPopup;
