# Subscription Integration in PricingPopup

This document describes the integration of subscription functionality in the PricingPopup component using the same APIs as the Billing component.

## Overview

The PricingPopup component now handles actual subscription processing when users click "Buy Credits" on specific plans. It uses the same API endpoints and Razorpay integration as the Billing component.

## Implementation Details

### 1. Added Subscription API Functions

**File**: `src/api/api.js`

Added comprehensive subscription API functions:

```javascript
// Get subscription plans
export const getSubscriptionPlansApi = async () => { ... }

// Get user's current subscription
export const getMySubscriptionApi = async () => { ... }

// Start free trial
export const startTrialApi = async (planId, currency = 'INR', couponCode = null) => { ... }

// Convert trial to paid subscription
export const convertTrialToPaidApi = async (planId, currency = 'INR', couponCode = null) => { ... }

// Verify trial payment
export const verifyTrialPaymentApi = async (paymentData) => { ... }

// Verify conversion payment
export const verifyConversionPaymentApi = async (paymentData) => { ... }
```

### 2. Updated PricingPopup Component

**File**: `src/components/PricingPopup.jsx`

#### Added Imports:
```javascript
import { useAuth } from "../contexts/AuthContext";
import Swal from "sweetalert2";
import {
  getMySubscriptionApi,
  startTrialApi,
  convertTrialToPaidApi,
  verifyTrialPaymentApi,
  verifyConversionPaymentApi
} from "../api/api";
```

#### Added State Management:
```javascript
const { user } = useAuth();
const [mySubscription, setMySubscription] = useState(null);
const [loadingPlanId, setLoadingPlanId] = useState(null);
const [processingPlanId, setProcessingPlanId] = useState(null);
```

#### Added Subscription Logic:
- **`fetchMySubscription()`**: Fetches user's current subscription status
- **`handleSubscribe(planId)`**: Handles the complete subscription flow
- **Trial vs Conversion**: Automatically detects if user has an active trial
- **Razorpay Integration**: Opens payment popup with proper configuration
- **Payment Verification**: Verifies payment and updates subscription status

### 3. Updated Plan Buttons

#### Dynamic Plans (from API):
```javascript
<button
  className="pricing-plan-btn"
  onClick={() => handleSubscribe(plan.id)}
  disabled={processingPlanId === plan.id}
>
  {processingPlanId === plan.id ? (
    <span>Processing...</span>
  ) : (
    plan.is_unlimited ? "Get Unlimited" : "Buy Credits"
  )}
</button>
```

#### Fallback Plans:
```javascript
<button
  className="pricing-plan-btn"
  onClick={() => onNavigateToBilling ? onNavigateToBilling() : alert("Plan selected!")}
>
  Buy Credits
</button>
```

### 4. Added Loading States

**File**: `src/components/PricingPopup.css`

```css
.pricing-plan-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.pricing-plan-btn:disabled:hover {
  background-color: #74DF74;
  transform: none;
}
```

## User Flow

### For New Users (No Trial):
1. **User clicks "Buy Credits"** on any plan
2. **System calls** `startTrialApi()` with plan ID
3. **Razorpay popup opens** with trial details
4. **User completes payment**
5. **System verifies payment** via `verifyTrialPaymentApi()`
6. **Success message** shows "Trial Started!"
7. **Popup closes** automatically

### For Users with Active Trial:
1. **User clicks "Buy Credits"** on any plan
2. **System calls** `convertTrialToPaidApi()` with plan ID
3. **Razorpay popup opens** with conversion details
4. **User completes payment**
5. **System verifies payment** via `verifyConversionPaymentApi()`
6. **Success message** shows "Subscription Activated!"
7. **Popup closes** automatically

## Features

### ✅ **Complete Subscription Flow**
- Trial creation for new users
- Trial-to-paid conversion for existing trial users
- Razorpay payment integration
- Payment verification and error handling

### ✅ **User Experience**
- Loading states during processing
- Disabled buttons during API calls
- Success/error notifications via SweetAlert2
- Automatic popup closing after successful subscription

### ✅ **Error Handling**
- Login requirement validation
- API error handling with user-friendly messages
- Payment verification error handling
- Network error handling

### ✅ **State Management**
- Subscription status tracking
- Loading state management
- Processing state per plan

## API Endpoints Used

1. **`GET /subscription/plans`** - Get available plans
2. **`GET /subscription/my-subscription`** - Get user's subscription
3. **`POST /subscription/start-trial`** - Start free trial
4. **`POST /subscription/convert-trial-to-paid`** - Convert trial to paid
5. **`POST /subscription/verify-trial-payment`** - Verify trial payment
6. **`POST /subscription/verify-conversion-payment`** - Verify conversion payment

## Razorpay Integration

- **Script**: Already included in `index.html`
- **Configuration**: Dynamic based on plan and user type
- **Prefill**: User's name, email, and phone
- **Theme**: Brand colors (#28a745)
- **Currency**: INR (Indian Rupees)

## Error Messages

- **Login Required**: "Please login to start a subscription"
- **Trial Started**: "Free trial started successfully! You have 7 days to explore all features."
- **Subscription Activated**: "Your trial has been converted to a paid subscription!"
- **Payment Failed**: Specific error messages from API
- **Network Error**: "Error processing subscription. Please try again."

## Testing

To test the integration:

1. **Mock API responses** for different scenarios
2. **Test with new users** (no subscription)
3. **Test with trial users** (active trial)
4. **Test payment success/failure** scenarios
5. **Verify loading states** work correctly
6. **Check error handling** for various API errors

## Future Enhancements

- **Coupon Support**: Add coupon code functionality
- **Plan Comparison**: Show detailed plan features
- **Subscription Management**: Add cancel/upgrade options
- **Analytics**: Track subscription conversions
- **A/B Testing**: Test different button texts and flows
