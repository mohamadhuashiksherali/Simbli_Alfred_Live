import React, { createContext, useContext, useState, useEffect } from 'react';

const CookieConsentContext = createContext();

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
};

export const CookieConsentProvider = ({ children }) => {
  const [preferences, setPreferences] = useState({
    analytics: false,
    marketing: false
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load preferences from localStorage
    const savedPrefs = localStorage.getItem('cookiePrefs');
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs);
        setPreferences(prefs);
      } catch (error) {
        console.error('Error parsing cookie preferences:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  const updatePreferences = (newPrefs) => {
    setPreferences(newPrefs);
    localStorage.setItem('cookiePrefs', JSON.stringify(newPrefs));
  };

  const hasConsent = () => {
    return localStorage.getItem('cookiePrefs') !== null;
  };

  const canUseAnalytics = () => {
    return preferences.analytics;
  };

  const canUseMarketing = () => {
    return preferences.marketing;
  };

  const resetConsent = () => {
    localStorage.removeItem('cookiePrefs');
    setPreferences({ analytics: false, marketing: false });
  };

  const value = {
    preferences,
    isLoaded,
    updatePreferences,
    hasConsent,
    canUseAnalytics,
    canUseMarketing,
    resetConsent
  };

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
    </CookieConsentContext.Provider>
  );
};
