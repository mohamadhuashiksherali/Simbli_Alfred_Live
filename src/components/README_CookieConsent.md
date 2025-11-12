# Cookie Consent Integration

This document explains how the cookie consent functionality has been integrated into the React frontend.

## Files Created/Modified

### 1. Components
- `src/components/CookieConsent.jsx` - Main cookie consent banner and modal component
- `src/components/AnalyticsExample.jsx` - Example component showing how to use cookie consent

### 2. Context & Hooks
- `src/contexts/CookieConsentContext.jsx` - React context for managing cookie preferences globally
- `src/hooks/useCookieConsent.js` - Custom hook for cookie consent functionality

### 3. Styles
- `src/styles/CookieConsent.css` - Dedicated CSS file for cookie consent styling

### 4. Integration
- `src/App.jsx` - Updated to include CookieConsentProvider and CookieConsent component

## Features

### Cookie Consent Banner
- **Accept All** - Enables all cookie types (analytics + marketing)
- **Reject All** - Disables all optional cookie types
- **Manage Preferences** - Opens modal for granular control

### Cookie Types
- **Necessary** - Always enabled (required for basic functionality)
- **Analytics** - Optional (for tracking user behavior)
- **Marketing** - Optional (for targeted advertising)

### Preferences Modal
- Toggle switches for each cookie type
- Save/Cancel functionality
- Responsive design for mobile devices

## Usage

### Using the Context
```jsx
import { useCookieConsent } from '../contexts/CookieConsentContext';

const MyComponent = () => {
  const { canUseAnalytics, canUseMarketing, preferences } = useCookieConsent();
  
  useEffect(() => {
    if (canUseAnalytics()) {
      // Load analytics tracking
      console.log('Analytics enabled');
    }
  }, [canUseAnalytics]);
  
  return <div>My Component</div>;
};
```

### Using the Hook
```jsx
import useCookieConsent from '../hooks/useCookieConsent';

const MyComponent = () => {
  const { canUseAnalytics, updatePreferences } = useCookieConsent();
  
  const handleAnalyticsToggle = () => {
    updatePreferences({ analytics: !canUseAnalytics() });
  };
  
  return <button onClick={handleAnalyticsToggle}>Toggle Analytics</button>;
};
```

## Styling

The cookie consent uses a dark theme with:
- Fixed positioning at bottom of screen
- Smooth animations (fadeInUp, fadeIn)
- Responsive design for mobile
- Custom toggle switches
- Modern button styling

## Local Storage

Cookie preferences are stored in `localStorage` with the key `cookiePrefs`:
```json
{
  "analytics": true,
  "marketing": false
}
```

## GDPR Compliance

This implementation helps with GDPR compliance by:
- ✅ Asking for explicit consent before setting cookies
- ✅ Providing granular control over cookie types
- ✅ Storing user preferences persistently
- ✅ Allowing users to change their preferences
- ✅ Only loading tracking scripts after consent

## Customization

### Adding New Cookie Types
1. Update the preferences state in `CookieConsentContext.jsx`
2. Add new toggle switches in `CookieConsent.jsx`
3. Update the `applyPreferences` function to handle new types

### Styling Changes
- Modify `src/styles/CookieConsent.css`
- All styles use prefixed class names to avoid conflicts

### Analytics Integration
- Use `canUseAnalytics()` to conditionally load Google Analytics
- Use `canUseMarketing()` to conditionally load Facebook Pixel, etc.

## Example Integration

```jsx
// In your analytics setup
useEffect(() => {
  if (canUseAnalytics()) {
    // Load Google Analytics
    const script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID';
    document.head.appendChild(script);
  }
}, [canUseAnalytics]);
```

The cookie consent banner will automatically appear for new users and remember their preferences for returning users.
