# Pricing Popup Integration

This document explains how to integrate and use the PricingPopup component in the alfred-frontend application.

## Files Added

1. **`src/components/PricingPopup.jsx`** - The main pricing popup component
2. **`src/components/PricingPopup.css`** - Styles for the pricing popup
3. **`src/components/PricingPopupDemo.jsx`** - Demo component showing how to use the pricing popup

## Dependencies

- Bootstrap CSS (already available in package.json)
- React (already available)

## Usage

### Basic Usage

```jsx
import React, { useState } from "react";
import PricingPopup from "./components/PricingPopup";

function MyComponent() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const openPopup = () => setIsPopupOpen(true);
  const closePopup = () => setIsPopupOpen(false);

  return (
    <div>
      <button onClick={openPopup}>
        Open Pricing Popup
      </button>

      <PricingPopup
        isOpen={isPopupOpen}
        onClose={closePopup}
        credits={50}
        maxCredits={100}
      />
    </div>
  );
}
```

### Props

- `isOpen` (boolean): Controls whether the popup is visible
- `onClose` (function): Callback function called when popup should be closed
- `credits` (number, optional): Current credits (default: 50)
- `maxCredits` (number, optional): Maximum credits (default: 100)

### Features

- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Keyboard Support**: Press Escape to close the popup
- **Click Outside to Close**: Click on the overlay to close the popup
- **Smooth Animations**: Fade-in and slide-in animations
- **Bootstrap Integration**: Uses Bootstrap classes for layout

### Styling

The component uses its own CSS file (`PricingPopup.css`) which includes:
- Responsive grid layout for pricing plans
- Hover effects and animations
- Mobile-first responsive design
- Custom color scheme matching the brand

### Integration Examples

#### 1. In Dashboard Component

```jsx
// In Dashboard.jsx
import PricingPopup from './PricingPopup';

// Add state for popup
const [showPricingPopup, setShowPricingPopup] = useState(false);

// Add button to trigger popup
<button onClick={() => setShowPricingPopup(true)}>
  Upgrade Plan
</button>

// Add popup component
<PricingPopup
  isOpen={showPricingPopup}
  onClose={() => setShowPricingPopup(false)}
  credits={userCredits}
  maxCredits={userMaxCredits}
/>
```

#### 2. In Credit Limit Reached Scenario

```jsx
// When user reaches credit limit
if (userCredits <= 0) {
  setShowPricingPopup(true);
}
```

#### 3. In Subscription Management

```jsx
// In subscription settings
<button onClick={() => setShowPricingPopup(true)}>
  View Pricing Plans
</button>
```

## Customization

### Modifying Plans

To modify the pricing plans, edit the JSX in `PricingPopup.jsx`:

```jsx
// Example: Add a new plan
<div className="pricing-plan-card">
  <div className="pricing-plan-name">Enterprise Plan</div>
  <div className="pricing-plan-price">
    $199<span className="pricing-plan-price-suffix">/mo</span>
  </div>
  <div className="pricing-plan-desc">
    For large enterprises with custom needs.
  </div>
  <button className="pricing-plan-btn" onClick={() => handlePlanSelect('enterprise')}>
    Contact Sales
  </button>
</div>
```

### Styling Customization

Modify `PricingPopup.css` to change:
- Colors (search for color values like `#74DF74`)
- Font sizes
- Spacing and padding
- Border radius
- Animations

### Adding Functionality

To add actual purchase functionality:

```jsx
const handlePlanSelect = (planName) => {
  // Add your purchase logic here
  console.log(`Selected plan: ${planName}`);
  // Redirect to payment page, call API, etc.
  onClose(); // Close popup after selection
};
```

## Testing

Use the `PricingPopupDemo` component to test the popup:

```jsx
import PricingPopupDemo from './components/PricingPopupDemo';

// Add to your app for testing
<PricingPopupDemo />
```

## Notes

- The component is fully self-contained and doesn't interfere with existing styles
- All animations and interactions are handled internally
- The component follows React best practices with proper prop handling
- CSS is scoped to prevent conflicts with existing styles
