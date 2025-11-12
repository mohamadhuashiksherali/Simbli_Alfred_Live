import React, { useState, useEffect } from 'react';
import { useCookieConsent } from '../contexts/CookieConsentContext';
import '../styles/CookieConsent.css';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [localPreferences, setLocalPreferences] = useState({
    analytics: false,
    marketing: false
  });
  
  const { 
    preferences, 
    isLoaded, 
    updatePreferences, 
    hasConsent 
  } = useCookieConsent();

  useEffect(() => {
    if (isLoaded && !hasConsent()) {
      setShowBanner(true);
    }
  }, [isLoaded, hasConsent]);

  const applyPreferences = (prefs) => {
    // Apply cookie preferences
    if (prefs.analytics) {
      console.log("Analytics cookies enabled");
      // Add analytics tracking code here
    }
    if (prefs.marketing) {
      console.log("Marketing cookies enabled");
      // Add marketing tracking code here
    }
  };

  const handleAcceptAll = () => {
    const prefs = { analytics: true, marketing: true };
    updatePreferences(prefs);
    setShowBanner(false);
    applyPreferences(prefs);
  };

  const handleRejectAll = () => {
    const prefs = { analytics: false, marketing: false };
    updatePreferences(prefs);
    setShowBanner(false);
    applyPreferences(prefs);
  };

  const handleManagePreferences = () => {
    setShowModal(true);
    setLocalPreferences({
      analytics: preferences.analytics,
      marketing: preferences.marketing
    });
  };

  const handleSavePreferences = () => {
    updatePreferences(localPreferences);
    setShowModal(false);
    applyPreferences(localPreferences);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handlePreferenceChange = (type) => {
    setLocalPreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  if (!showBanner && !showModal) {
    return null;
  }

  return (
    <>
      {/* Cookie Consent Banner */}
      {showBanner && (
        <div className="cookie-banner">
          <div className="cookie-inner">
            <div className="cookie-text">
              <h3>We value your privacy 🍪</h3>
              <p>
                We use cookies to enhance your browsing experience, analyze site traffic, and
                serve personalized content. You can accept all, reject all, or manage your preferences.
              </p>
            </div>
            <div className="cookie-actions">
              <button className="cookie-btn accept" onClick={handleAcceptAll}>
                Accept All
              </button>
              <button className="cookie-btn reject" onClick={handleRejectAll}>
                Reject All
              </button>
              <button className="cookie-btn manage" onClick={handleManagePreferences}>
                Manage Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      {showModal && (
  <div className="prefs-modal" onClick={handleCloseModal}>
    <div className="prefs-box" onClick={(e) => e.stopPropagation()}>
      <h3>Manage Cookie Preferences</h3>
      <p>Customize which cookies you want to allow:</p>

      <div className="prefs-options">
        {/* Necessary - always enabled */}
        <div className="cookie-switch">
          <input
            id="necessary-checkbox"
            type="checkbox"
            disabled
            checked
          />
          <label htmlFor="necessary-checkbox" className="cookie-slider"></label>
          <span className="cookie-label-text">Necessary (always enabled)</span>
        </div>

        {/* Analytics */}
        <div className="cookie-switch">
          <input
            id="analytics-checkbox"
            type="checkbox"
            checked={localPreferences.analytics}
            onChange={() => handlePreferenceChange('analytics')}
          />
          <label htmlFor="analytics-checkbox" className="cookie-slider"></label>
          <span className="cookie-label-text">Analytics</span>
        </div>

        {/* Marketing */}
        <div className="cookie-switch">
          <input
            id="marketing-checkbox"
            type="checkbox"
            checked={localPreferences.marketing}
            onChange={() => handlePreferenceChange('marketing')}
          />
          <label htmlFor="marketing-checkbox" className="cookie-slider"></label>
          <span className="cookie-label-text">Marketing</span>
        </div>
      </div>

      <div className="modal-actions">
        <button className="cookie-btn save" onClick={handleSavePreferences}>
          Save Preferences
        </button>
        <button className="cookie-btn cancel" onClick={handleCloseModal}>
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

      {/* {showModal && (
        <div className="prefs-modal" onClick={handleCloseModal}>
          <div className="prefs-box" onClick={(e) => e.stopPropagation()}>
            <h3>Manage Cookie Preferences</h3>
            <p>Customize which cookies you want to allow:</p>
            <div className="prefs-options">
              <label className="cookie-switch">
                <input type="checkbox" disabled checked />
                <span className="cookie-slider"></span>
                <span className="cookie-label-text">Necessary (always enabled)</span>
              </label>
              <label className="cookie-switch">
                <input 
                  type="checkbox" 
                  checked={localPreferences.analytics}
                  onChange={() => handlePreferenceChange('analytics')}
                />
                <span className="cookie-slider"></span>
                <span className="cookie-label-text">Analytics</span>
              </label>
              <label className="cookie-switch">
                <input 
                  type="checkbox" 
                  checked={localPreferences.marketing}
                  onChange={() => handlePreferenceChange('marketing')}
                />
                <span className="cookie-slider"></span>
                <span className="cookie-label-text">Marketing</span>
              </label>
            </div>
            <div className="modal-actions">
              <button className="cookie-btn save" onClick={handleSavePreferences}>
                Save Preferences
              </button>
              <button className="cookie-btn cancel" onClick={handleCloseModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )} */}

    </>
  );
};

export default CookieConsent;
