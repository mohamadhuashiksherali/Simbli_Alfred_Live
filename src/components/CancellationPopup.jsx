import React, { useState, useEffect } from 'react';
import './CancellationPopup.css';

const CancellationPopup = ({
  isOpen,
  onClose,
  onContinue,
  onTalkToSupport,
  reasons = [],
  selectedReasonId,
  onReasonSelect,
  selectedComment,
  onCommentChange
}) => {
  const [localSelectedReasonId, setLocalSelectedReasonId] = useState(selectedReasonId);
  const [localComment, setLocalComment] = useState(selectedComment || '');

  useEffect(() => {
    setLocalSelectedReasonId(selectedReasonId);
  }, [selectedReasonId]);

  useEffect(() => {
    setLocalComment(selectedComment || '');
  }, [selectedComment]);

  const handleReasonSelect = (reasonId) => {
    setLocalSelectedReasonId(reasonId);
    onReasonSelect?.(reasonId);
  };

  const handleCommentChange = (e) => {
    const value = e.target.value;
    setLocalComment(value);
    onCommentChange?.(value);
  };

  const handleContinue = () => {
    if (!localSelectedReasonId) {
      // alert('Please select a reason');
      return;
    }
    onContinue?.(localSelectedReasonId, localComment);
  };

  const handleTalkToSupport = () => {
    onTalkToSupport?.();
  };

  if (!isOpen) return null;

  return (
    <div className="cancellation-popup-overlay ">
      <div className="cancellation-popup-container">
        <button
          className="cancellation-popup-close"
          onClick={onClose}
          aria-label="Close"
        >
        <svg width="13" height="13" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M16 1L1 16M1 1L16 16" stroke="#545454" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>

        </button>

        <div className="cancellation-popup-header">
          <div className="cancellation-popup-sad-icon">
            <svg width="53" height="53" viewBox="0 0 73 73" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M50.4167 50.4167C50.4167 50.4167 45.2292 43.5 36.5833 43.5C27.9375 43.5 22.75 50.4167 22.75 50.4167M53.875 27.0383C52.509 28.7156 50.6415 29.6667 48.6875 29.6667C46.7335 29.6667 44.9179 28.7156 43.5 27.0383M29.6667 27.0383C28.3006 28.7156 26.4331 29.6667 24.4792 29.6667C22.5252 29.6667 20.7096 28.7156 19.2917 27.0383M71.1667 36.5833C71.1667 55.683 55.683 71.1667 36.5833 71.1667C17.4835 71.1667 2 55.683 2 36.5833C2 17.4835 17.4835 2 36.5833 2C55.683 2 71.1667 17.4835 71.1667 36.5833Z" stroke="#7F7F7F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            </svg>

          </div>
          <div className="cancellation-popup-title col-lg-8 text-center">
            <h2 className="cancellation-popup-title mb-0 text-center"> It's been great having you, </h2>
            <h2 className="cancellation-popup-title  text-center">
               we’d love to see you again soon.
            </h2>
          </div>
          <p className="cancellation-popup-subtitle">
            Please tell us why you'd like to cancel - it helps us improve
          </p>
        </div>

        <div className="cancellation-reasons-grid">
          {reasons.map((reason) => (
            <button
              key={reason.id}
              className={`cancellation-reason-item ${localSelectedReasonId === reason.id ? 'selected' : ''
              }`}
              onClick={() => handleReasonSelect(reason.id)}
            >
              <div className="cancellation-reason-icon">
                {getReasonIcon(reason.title)}
              </div>
              <span className="cancellation-reason-text">{reason.title}</span>
            </button>
          ))}
        </div>

        {localSelectedReasonId &&
          reasons.find(r => r.id === localSelectedReasonId)?.title.toLowerCase().includes('other') && (
            <div className="cancellation-comment-section">
              <textarea
                type="text"
                placeholder="Share your Comments"
                value={localComment}
                onChange={handleCommentChange}
                className="cancellation-comment-input"
              />
            </div>
          )}

        <div className="cancellation-popup-actions">
          <button
            className="cancellation-continue-btn"
            onClick={handleContinue}
            disabled={!localSelectedReasonId}
          >
            Continue to Cancel
          </button>
          <button
            className="cancellation-support-btn"
            onClick={handleTalkToSupport}
          >
            Talk to Support
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function to get appropriate icons for each reason
const getReasonIcon = (title) => {
  const normalizedTitle = title.toLowerCase();

  if (normalizedTitle.includes('expensive')) {
    return (
      <svg  className='expen-svg' viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 6V10M17 6V10M1 4.2V11.8C1 12.9201 1 13.4802 1.21799 13.908C1.40973 14.2843 1.71569 14.5903 2.09202 14.782C2.51984 15 3.07989 15 4.2 15H17.8C18.9201 15 19.4802 15 19.908 14.782C20.2843 14.5903 20.5903 14.2843 20.782 13.908C21 13.4802 21 12.9201 21 11.8V4.2C21 3.0799 21 2.51984 20.782 2.09202C20.5903 1.7157 20.2843 1.40974 19.908 1.21799C19.4802 1 18.9201 1 17.8 1H4.2C3.0799 1 2.51984 1 2.09202 1.21799C1.7157 1.40973 1.40973 1.71569 1.21799 2.09202C1 2.51984 1 3.07989 1 4.2ZM13.5 8C13.5 9.3807 12.3807 10.5 11 10.5C9.6193 10.5 8.5 9.3807 8.5 8C8.5 6.6193 9.6193 5.5 11 5.5C12.3807 5.5 13.5 6.6193 13.5 8Z" stroke="black" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>


    );
  } else if (normalizedTitle.includes('using') && normalizedTitle.includes('enough')) {
    return (
      <svg  className='expen-svg' viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M7.5 6L12.5 11M12.5 6L7.5 11M7.9 17.2L9.36 19.1467C9.5771 19.4362 9.6857 19.5809 9.8188 19.6327C9.9353 19.678 10.0647 19.678 10.1812 19.6327C10.3143 19.5809 10.4229 19.4362 10.64 19.1467L12.1 17.2C12.3931 16.8091 12.5397 16.6137 12.7185 16.4645C12.9569 16.2656 13.2383 16.1248 13.5405 16.0535C13.7671 16 14.0114 16 14.5 16C15.8978 16 16.5967 16 17.1481 15.7716C17.8831 15.4672 18.4672 14.8831 18.7716 14.1481C19 13.5967 19 12.8978 19 11.5V5.8C19 4.11984 19 3.27976 18.673 2.63803C18.3854 2.07354 17.9265 1.6146 17.362 1.32698C16.7202 1 15.8802 1 14.2 1H5.8C4.11984 1 3.27976 1 2.63803 1.32698C2.07354 1.6146 1.6146 2.07354 1.32698 2.63803C1 3.27976 1 4.11984 1 5.8V11.5C1 12.8978 1 13.5967 1.22836 14.1481C1.53284 14.8831 2.11687 15.4672 2.85195 15.7716C3.40326 16 4.10218 16 5.5 16C5.98858 16 6.23287 16 6.45951 16.0535C6.76169 16.1248 7.04312 16.2656 7.2815 16.4645C7.46028 16.6137 7.60685 16.8091 7.9 17.2Z" stroke="black" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>

    );
  } else if (normalizedTitle.includes('better') && normalizedTitle.includes('alternative')) {
    return (
      <svg className='expen-svg' viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10.5 4H10.9344C13.9816 4 15.5053 4 16.0836 4.54729C16.5836 5.02037 16.8051 5.71728 16.6702 6.39221C16.514 7.17302 15.2701 8.05285 12.7823 9.8125L8.71772 12.6875C6.2299 14.4471 4.98599 15.327 4.82984 16.1078C4.69486 16.7827 4.91642 17.4796 5.41636 17.9527C5.99474 18.5 7.51836 18.5 10.5656 18.5H11.5M7 4C7 5.65685 5.65685 7 4 7C2.34315 7 1 5.65685 1 4C1 2.34315 2.34315 1 4 1C5.65685 1 7 2.34315 7 4ZM21 18C21 19.6569 19.6569 21 18 21C16.3431 21 15 19.6569 15 18C15 16.3431 16.3431 15 18 15C19.6569 15 21 16.3431 21 18Z" stroke="black" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>

    );
  } else if (normalizedTitle.includes('technical')) {
    return (
      <svg  className='expen-svg' viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 6V10M10 14H10.01M5.8 19H14.2C15.8802 19 16.7202 19 17.362 18.673C17.9265 18.3854 18.3854 17.9265 18.673 17.362C19 16.7202 19 15.8802 19 14.2V5.8C19 4.11984 19 3.27976 18.673 2.63803C18.3854 2.07354 17.9265 1.6146 17.362 1.32698C16.7202 1 15.8802 1 14.2 1H5.8C4.11984 1 3.27976 1 2.63803 1.32698C2.07354 1.6146 1.6146 2.07354 1.32698 2.63803C1 3.27976 1 4.11984 1 5.8V14.2C1 15.8802 1 16.7202 1.32698 17.362C1.6146 17.9265 2.07354 18.3854 2.63803 18.673C3.27976 19 4.11984 19 5.8 19Z" stroke="black" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>

    );
  } else if (normalizedTitle.includes('temporary')) {
    return (
      <svg className='expen-svg' viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 2H5.8C4.11984 2 3.27976 2 2.63803 2.32698C2.07354 2.6146 1.6146 3.07354 1.32698 3.63803C1 4.27976 1 5.11984 1 6.8V15.2C1 16.8802 1 17.7202 1.32698 18.362C1.6146 18.9265 2.07354 19.3854 2.63803 19.673C3.27976 20 4.11984 20 5.8 20H14.2C15.8802 20 16.7202 20 17.362 19.673C17.9265 19.3854 18.3854 18.9265 18.673 18.362C19 17.7202 19 16.8802 19 15.2V12M10 7H14V11M13.5 2.5V1M17.4393 3.56066L18.5 2.5M18.5103 7.5H20.0103M1 12.3471C1.65194 12.4478 2.31987 12.5 3 12.5C7.38636 12.5 11.2653 10.3276 13.6197 7" stroke="black" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>

    );
  } else {
    return (
      <svg  className='expen-svg' viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5.5 8.5H5.51M10 8.5H10.01M14.5 8.5H14.51M7.9 17.2L9.36 19.1467C9.5771 19.4362 9.6857 19.5809 9.8188 19.6327C9.9353 19.678 10.0647 19.678 10.1812 19.6327C10.3143 19.5809 10.4229 19.4362 10.64 19.1467L12.1 17.2C12.3931 16.8091 12.5397 16.6137 12.7185 16.4645C12.9569 16.2656 13.2383 16.1248 13.5405 16.0535C13.7671 16 14.0114 16 14.5 16C15.8978 16 16.5967 16 17.1481 15.7716C17.8831 15.4672 18.4672 14.8831 18.7716 14.1481C19 13.5967 19 12.8978 19 11.5V5.8C19 4.11984 19 3.27976 18.673 2.63803C18.3854 2.07354 17.9265 1.6146 17.362 1.32698C16.7202 1 15.8802 1 14.2 1H5.8C4.11984 1 3.27976 1 2.63803 1.32698C2.07354 1.6146 1.6146 2.07354 1.32698 2.63803C1 3.27976 1 4.11984 1 5.8V11.5C1 12.8978 1 13.5967 1.22836 14.1481C1.53284 14.8831 2.11687 15.4672 2.85195 15.7716C3.40326 16 4.10218 16 5.5 16C5.98858 16 6.23287 16 6.45951 16.0535C6.76169 16.1248 7.04312 16.2656 7.2815 16.4645C7.46028 16.6137 7.60685 16.8091 7.9 17.2ZM6 8.5C6 8.7761 5.77614 9 5.5 9C5.22386 9 5 8.7761 5 8.5C5 8.2239 5.22386 8 5.5 8C5.77614 8 6 8.2239 6 8.5ZM10.5 8.5C10.5 8.7761 10.2761 9 10 9C9.7239 9 9.5 8.7761 9.5 8.5C9.5 8.2239 9.7239 8 10 8C10.2761 8 10.5 8.2239 10.5 8.5ZM15 8.5C15 8.7761 14.7761 9 14.5 9C14.2239 9 14 8.7761 14 8.5C14 8.2239 14.2239 8 14.5 8C14.7761 8 15 8.2239 15 8.5Z" stroke="black" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>

    );
  }
};

export default CancellationPopup;
