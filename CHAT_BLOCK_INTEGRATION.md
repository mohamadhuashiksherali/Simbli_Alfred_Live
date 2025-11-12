# Chat Block Integration with Pricing Popup

This document describes the integration of the chat block status check with the pricing popup in the ChatInterface component.

## Overview

When a user tries to send a message in the chat interface, the system now checks if the user is blocked from chatting due to subscription limits. If blocked, a pricing popup is displayed showing available subscription plans.

## Implementation Details

### 1. API Integration

**File**: `src/api/api.js`

Added new API function:
```javascript
export const checkChatBlockStatusApi = async () => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(`${BASE_URL}/usage-limits/chat-block-status`, { headers });
    return response;
  } catch (err) {
    console.error("Error checking chat block status:", err);
    throw err;
  }
};
```

**Endpoint**: `GET /usage-limits/chat-block-status`

**Expected Response**:
```json
{
  "status": "success",
  "user_id": "82",
  "data": {
    "chat_blocked": true,
    "block_reason": "no_subscription",
    "message": "No active subscription found",
    "available_plans": [
      {
        "id": 1,
        "name": "Basic",
        "price_usd": 29.0,
        "price_inr": 2552.0,
        "images_limit": 75,
        "content_words_limit": 10000,
        "serp_searches_limit": 200,
        "is_unlimited": false
      },
      {
        "id": 2,
        "name": "Standard",
        "price_usd": 49.0,
        "price_inr": 4312.0,
        "images_limit": 150,
        "content_words_limit": 30000,
        "serp_searches_limit": 500,
        "is_unlimited": false
      },
      {
        "id": 3,
        "name": "Pro (Unlimited*)",
        "price_usd": 79.0,
        "price_inr": 6952.0,
        "images_limit": 300,
        "content_words_limit": 60000,
        "serp_searches_limit": 1000,
        "is_unlimited": true
      }
    ]
  }
}
```

### 2. ChatInterface Component Updates

**File**: `src/components/ChatInterface.jsx`

#### Added Imports:
```javascript
import PricingPopup from "./PricingPopup";
import { checkChatBlockStatusApi } from "../api/api";
```

#### Added State Variables:
```javascript
// Pricing popup state
const [showPricingPopup, setShowPricingPopup] = useState(false);
const [chatBlocked, setChatBlocked] = useState(false);
const [availablePlans, setAvailablePlans] = useState([]);
```

#### Modified handleSendMessage Function:
```javascript
const handleSendMessage = async () => {
  if (!input.trim() || loading) return;
  if (input.length > MAX_INPUT_LENGTH) return;

  // Check if user is blocked from chatting
  try {
    console.log("Checking chat block status...");
    const blockStatusResponse = await checkChatBlockStatusApi();
    console.log("Chat block status response:", blockStatusResponse.data);
    
    const { chat_blocked, available_plans } = blockStatusResponse.data.data;
    
    if (chat_blocked) {
      console.log("User is blocked from chatting. Available plans:", available_plans);
      setChatBlocked(true);
      setAvailablePlans(available_plans || []);
      setShowPricingPopup(true);
      return; // Stop execution if user is blocked
    }
  } catch (error) {
    console.error("Error checking chat block status:", error);
    // Continue with normal flow if API call fails
  }

  // ... rest of the function continues normally
};
```

#### Added PricingPopup Component:
```javascript
{/* Pricing Popup */}
<PricingPopup
  isOpen={showPricingPopup}
  onClose={() => setShowPricingPopup(false)}
  credits={50}
  maxCredits={100}
  availablePlans={availablePlans}
/>
```

### 3. PricingPopup Component Updates

**File**: `src/components/PricingPopup.jsx`

#### Updated Props:
```javascript
const PricingPopup = ({ isOpen, onClose, credits = 50, maxCredits = 100, availablePlans = [] }) => {
```

#### Dynamic Plan Rendering:
The component now dynamically renders plans from the API response:

- **If `availablePlans` is provided**: Renders plans from the API with real pricing and limits
- **If `availablePlans` is empty**: Falls back to default hardcoded plans
- **Plan Details**: Shows actual limits (words, images, searches) from the API
- **Pricing**: Uses `price_usd` from the API response
- **Unlimited Plans**: Handles `is_unlimited` flag appropriately

#### Plan Information Display:
```javascript
<div className="pricing-plan-desc">
  {plan.is_unlimited 
    ? "Unlimited access to all features"
    : `${plan.content_words_limit.toLocaleString()} words, ${plan.images_limit} images, ${plan.serp_searches_limit} searches`
  }
</div>
```

## User Flow

1. **User types a message** in the chat input field
2. **User presses Enter or clicks Send**
3. **System calls** `/usage-limits/chat-block-status` API
4. **If `chat_blocked` is true**:
   - Pricing popup opens immediately
   - User sees available subscription plans
   - Chat message is not sent
5. **If `chat_blocked` is false**:
   - Normal chat flow continues
   - Message is processed as usual

## Error Handling

- **API Call Fails**: System continues with normal chat flow (doesn't block user)
- **No Plans Available**: Falls back to default hardcoded plans
- **Network Issues**: Graceful degradation with console logging

## Console Logging

Added comprehensive logging for debugging:
- Chat block status check initiation
- API response details
- Available plans information
- Error handling

## Testing

To test the integration:

1. **Mock the API response** to return `chat_blocked: true`
2. **Try sending a message** in the chat interface
3. **Verify** that the pricing popup opens
4. **Check** that the popup shows the correct plans from the API
5. **Test** the close functionality

## Future Enhancements

- **Actual Subscription Logic**: Implement real subscription purchase flow
- **Plan Selection**: Add plan selection and payment processing
- **User Feedback**: Add loading states and better error messages
- **Analytics**: Track popup views and plan selections
