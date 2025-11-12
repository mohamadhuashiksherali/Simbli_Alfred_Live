import React from "react";
import { X, AlertTriangle, Trash2 } from "lucide-react";
import "./DeleteDraftModal.css";

const DeleteDraftModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isLoading = false 
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div className="delete-draft-modal-overlay" onClick={handleBackdropClick}>
      <div className="delete-draft-modal-container">
        <div className="delete-draft-modal-content">
          {/* Close Button */}
          <button 
            className="delete-draft-modal-close-btn" 
            onClick={onClose}
            disabled={isLoading}
          >
            <X size={18} />
          </button>

          {/* Icon */}
          <div className="delete-draft-modal-icon">
            <svg width="52" height="52" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="36" cy="36" r="36" fill="#FFE6E9"/>
<path d="M30.6667 19H42.3333M19 24.8333H54M50.1111 24.8333L48.7475 45.2875C48.5429 48.3563 48.4406 49.8908 47.7778 51.0542C47.1942 52.0785 46.314 52.902 45.2533 53.4161C44.0483 54 42.5105 54 39.4348 54H33.5652C30.4895 54 28.9517 54 27.7468 53.4161C26.6859 52.902 25.8057 52.0785 25.2222 51.0542C24.5594 49.8908 24.4571 48.3563 24.2525 45.2875L22.8889 24.8333M32.6111 33.5833V43.3056M40.3889 33.5833V43.3056" stroke="#E63D4E" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

          </div>

          {/* Title */}
          <h3 className="delete-draft-modal-title">
            Delete Draft
          </h3>

          {/* Message */}
          <p className="delete-draft-modal-message">
            Are you sure you want to delete this draft? This action cannot be undone.
          </p>

          {/* Action Buttons */}
          <div className="delete-draft-modal-actions">
            <button 
              className="delete-draft-modal-cancel-btn"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              className="delete-draft-modal-confirm-btn"
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="delete-draft-modal-spinner"></div>
              ) : (
                <>
                  <Trash2 size={16} />
                  Delete 
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteDraftModal;
