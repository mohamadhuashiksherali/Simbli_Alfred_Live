# Billing Navigation Integration

This document describes the integration of billing navigation functionality in the PricingPopup component.

## Overview

When users click on any plan button or the "Go to Subscription Page" button in the PricingPopup, they are now redirected to the Billing component instead of showing an alert.

## Implementation Details

### 1. Updated PricingPopup Component

**File**: `src/components/PricingPopup.jsx`

#### Added Navigation Prop:
```javascript
const PricingPopup = ({ isOpen, onClose, credits = 50, maxCredits = 100, availablePlans = [], onNavigateToBilling }) => {
```

#### Updated All Plan Buttons:
All plan buttons now check for the `onNavigateToBilling` function and redirect to billing:

```javascript
<button
  className="pricing-plan-btn"
  onClick={() => {
    if (onNavigateToBilling) {
      onNavigateToBilling();
      onClose(); // Close the popup after navigation
    } else {
      alert(`${plan.name} Plan selected!`);
      // TODO: Implement actual subscription logic
    }
  }}
>
  {plan.is_unlimited ? "Get Unlimited" : "Buy Credits"}
</button>
```

#### Updated "Go to Subscription Page" Button:
```javascript
<button
  className="pricing-subscription-btn"
  onClick={() => {
    if (onNavigateToBilling) {
      onNavigateToBilling();
      onClose(); // Close the popup after navigation
    } else {
      alert("Redirecting to subscription page...");
    }
  }}
>
  Go to Subscription Page
</button>
```

### 2. Updated ChatInterface Component

**File**: `src/components/ChatInterface.jsx`

#### Added Navigation Prop:
```javascript
const ChatInterface = ({ onNavigateToBilling }) => {
```

#### Passed Navigation Function to PricingPopup:
```javascript
<PricingPopup
  isOpen={showPricingPopup}
  onClose={() => setShowPricingPopup(false)}
  credits={50}
  maxCredits={100}
  availablePlans={availablePlans}
  onNavigateToBilling={onNavigateToBilling}
/>
```

### 3. Updated Dashboard Component

**File**: `src/components/Dashboard.jsx`

#### Passed Navigation Function to ChatInterface:
```javascript
{activeTab === "chat" && <ChatInterface onNavigateToBilling={() => setActiveTab("billing")} />}
```

## User Flow

1. **User is blocked from chatting** (chat_blocked: true)
2. **PricingPopup opens** with available subscription plans
3. **User clicks any plan button** or "Go to Subscription Page"
4. **Popup closes** automatically
5. **Dashboard switches to billing tab** (`setActiveTab("billing")`)
6. **Billing component renders** with full subscription management

## Benefits

- **Seamless Navigation**: Users are taken directly to the billing page
- **Better UX**: No more alert messages, actual functionality
- **Consistent Flow**: All buttons lead to the same destination
- **Clean Interface**: Popup closes automatically after navigation

## Fallback Behavior

If the `onNavigateToBilling` function is not provided:
- Plan buttons show alert messages (original behavior)
- "Go to Subscription Page" shows alert message
- This ensures backward compatibility

## Testing

To test the integration:

1. **Trigger chat block** (mock API response with chat_blocked: true)
2. **Click any plan button** in the pricing popup
3. **Verify** that the popup closes and billing tab opens
4. **Test "Go to Subscription Page" button** as well
5. **Verify** that the Billing component loads correctly

## Future Enhancements

- **Plan Pre-selection**: Pass selected plan data to billing component
- **URL Parameters**: Add plan ID to URL for deep linking
- **Analytics**: Track which plans users click on
- **A/B Testing**: Test different button texts and behaviors
