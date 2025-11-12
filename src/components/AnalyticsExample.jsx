import React, { useEffect } from 'react';
import { useCookieConsent } from '../contexts/CookieConsentContext';

const AnalyticsExample = () => {
  const { canUseAnalytics, canUseMarketing } = useCookieConsent();

  useEffect(() => {
    // Example: Only load analytics if user has consented
    if (canUseAnalytics()) {
      console.log('Loading analytics tracking...');
      // Here you would load Google Analytics, Mixpanel, etc.
      // Example: gtag('config', 'GA_MEASUREMENT_ID');
    }
  }, [canUseAnalytics]);

  useEffect(() => {
    // Example: Only load marketing scripts if user has consented
    if (canUseMarketing()) {
      console.log('Loading marketing tracking...');
      // Here you would load Facebook Pixel, Google Ads, etc.
      // Example: fbq('init', 'PIXEL_ID');
    }
  }, [canUseMarketing]);

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Cookie Consent Status</h3>
      <div className="space-y-2">
        <p className={`text-sm ${canUseAnalytics() ? 'text-green-600' : 'text-red-600'}`}>
          Analytics: {canUseAnalytics() ? 'Enabled' : 'Disabled'}
        </p>
        <p className={`text-sm ${canUseMarketing() ? 'text-green-600' : 'text-red-600'}`}>
          Marketing: {canUseMarketing() ? 'Enabled' : 'Disabled'}
        </p>
      </div>
    </div>
  );
};

export default AnalyticsExample;
