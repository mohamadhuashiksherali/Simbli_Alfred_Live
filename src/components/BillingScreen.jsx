import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import RazorpayButton from "./RazorpayButton";
import "./BillingScreen.css";
import { BASE_URL } from "../api/api";

const BillingScreen = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly"); // 'monthly' or 'annual'
  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [loadingPlanId, setLoadingPlanId] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/subscription/plans`
      );
      const data = await response.json();

      if (data.status === "success") {
        setPlans(data.plans);
      } else {
        setError("Failed to fetch subscription plans");
      }
    } catch (err) {
      setError("Error fetching subscription plans");
      console.error("Error fetching plans:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    if (!user) {
      // alert("Please login to start a free trial");
      return;
    }

    setLoadingPlanId(planId);
    try {
      // Create trial subscription with small amount collection
      const token = localStorage.getItem("access-token");

      const trialResponse = await fetch(
        `${BASE_URL}/subscription/start-trial`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            plan_id: planId,
            currency: "INR",
          }),
        }
      );

      const data = await trialResponse.json();

      console.log("Trial response:", data);
      console.log("Response status:", trialResponse.status);

      if (data.status !== "success") {
        console.error("Trial endpoint error:", data);
        // alert(
        //   "Failed to start free trial: " + (data.detail || "Unknown error")
        // );
        return;
      }

      setOrderData(data);
      setSelectedPlan(planId);
      setShowCouponInput(false);
    } catch (err) {
      // alert("Error starting free trial: " + err.message);
      console.error("Error starting free trial:", err);
    } finally {
      setLoadingPlanId(null);
    }
  };

  const handlePaymentSuccess = async (response) => {
    console.log("Trial payment successful:", response);

    try {
      // Verify trial payment with backend
      const token = localStorage.getItem("access-token");

      const verifyResponse = await fetch(
        `${BASE_URL}/subscription/verify-trial-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            payment_id: response.razorpay_payment_id,
            order_id: response.razorpay_order_id,
            signature: response.razorpay_signature,
            plan_id: selectedPlan,
          }),
        }
      );

      const verifyData = await verifyResponse.json();

      if (verifyData.status === "success") {
        // alert(
        //   "Free trial started successfully! You have 7 days to explore all features. Auto-pay will be enabled after the trial period."
        // );
        window.location.reload();
      } else {
        // alert(
        //   "Trial verification failed: " + (verifyData.detail || "Unknown error")
        // );
      }
    } catch (err) {
      console.error("Error verifying trial payment:", err);
      // alert("Error verifying trial payment. Please contact support.");
    }
  };

  const handlePaymentError = (error) => {
    console.error("Payment error:", error);
    // alert("Payment failed: " + error);
  };

  const handlePaymentCancel = () => {
    console.log("Payment cancelled");
    setOrderData(null);
    setSelectedPlan(null);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      // alert("Please enter a coupon code");
      return;
    }

    setApplyingCoupon(true);
    try {
      const token = localStorage.getItem("access-token");

      // Detect user's location and set currency
      let currency = "USD"; // Default currency
      try {
        const response = await fetch("https://ipapi.co/json/");
        const locationData = await response.json();
        if (locationData.country_code === "IN") {
          currency = "INR";
        }
      } catch (error) {
        console.log("Could not detect location, using default currency USD");
      }

      const response = await fetch(
        `${BASE_URL}/subscription/validate-coupon`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            coupon_code: couponCode,
            plan_id: selectedPlan,
            currency: currency,
          }),
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        setCouponDiscount(data.discount_amount);
        setAppliedCoupon(data.coupon);
        const currencySymbol = data.currency === "INR" ? "₹" : "$";
        const displayAmount =
          data.currency === "INR"
            ? data.discount_amount / 100
            : data.discount_amount / 100;
        // alert(`Coupon applied! You saved ${currencySymbol}${displayAmount}`);
      } else {
        // alert("Invalid coupon code: " + (data.detail || "Unknown error"));
      }
    } catch (err) {
      // alert("Error applying coupon");
      console.error("Error applying coupon:", err);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const proceedToPayment = async () => {
    try {
      // Proceed with subscription creation
      await handleSubscribe(selectedPlan);
    } catch (err) {
      console.error("Error proceeding to payment:", err);
    }
  };

  const getPrice = (plan) => {
    if (billingCycle === "annual") {
      // Use monthly_equivalent from backend (with 8% discount)
      return plan.monthly_equivalent ? Math.round(plan.monthly_equivalent) : plan.price_usd;
    }
    return plan.price_usd;
  };

  const getBillingText = (plan) => {
    if (billingCycle === "annual") {
      return `$${getPrice(plan)}/mo (billed annually)`;
    }
    return `$${plan.price_usd}/mo`;
  };

  if (loading) {
    return (
      <div className="billing-screen">
        <div className="loading">Loading subscription plans...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="billing-screen">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="billing-screen">
      <style>
        {

          `
          .loading, .error {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  font-size: 1.1rem;
  color: #6c757d;
}

.error {
  color: #dc3545;
}
          `
        }
      </style>
      {/* Header */}
      <div className="billing-header">
        <div className="header-left">
          <img src="/Simbliai.jpg" alt="Simbli" className="logo" />
        </div>
        <div className="header-right">
          <div className="user-profile">
            <img src="/Alfred.png" alt="Alfred" className="user-avatar" />
            <div className="user-info">
              <div className="user-name">Alfred</div>
              <div className="user-role">Social Media Agent</div>
            </div>
            <div className="dropdown-arrow">▼</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="billing-content">
        <div className="billing-title">
          <h1>Choose the plan that's right for you</h1>
          <p>
            Whether you're just starting out or scaling your business, we've got
            a plan to fit your needs.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="billing-toggle">
          <button
            className={`toggle-option ${
              billingCycle === "monthly" ? "active" : ""
            }`}
            onClick={() => setBillingCycle("monthly")}
          >
            Monthly Billing
          </button>
          <button
            className={`toggle-option ${
              billingCycle === "annual" ? "active" : ""
            }`}
            onClick={() => setBillingCycle("annual")}
          >
            Annual Billing Save 8%
          </button>
        </div>

        {/* Plan Cards */}
        <div className="plans-grid">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`plan-card ${index === 1 ? "popular" : ""}`}
            >
              {index === 1 && <div className="popular-badge">Popular</div>}

              <div className="plan-header">
                <h3>{plan.name}</h3>
                <div className="plan-price">{getBillingText(plan)}</div>
                <p className="plan-description">
                  {plan.name === "Basic" &&
                    "Essential tools for solo creators & small teams."}
                  {plan.name === "Standard" &&
                    "More power for content-heavy workflows."}
                  {plan.name === "Pro" &&
                    "Unlimited scale for agencies & advanced users."}
                </p>
              </div>

              <div className="plan-features">
                <div className="feature">
                  <span className="checkmark">✓</span>
                  {plan.is_unlimited ? "Unlimited*" : plan.images_limit} Images
                  per month
                </div>
                <div className="feature">
                  <span className="checkmark">✓</span>
                  {plan.is_unlimited
                    ? "Unlimited*"
                    : plan.content_words_limit.toLocaleString()}{" "}
                  Content Words
                </div>
                <div className="feature">
                  <span className="checkmark">✓</span>
                  {plan.is_unlimited
                    ? "Unlimited*"
                    : plan.serp_searches_limit}{" "}
                  SERP Searches
                </div>
                <div className="feature">
                  <span className="checkmark">✓</span>1 Ayrshare Profile
                </div>
                {index > 0 && (
                  <div className="feature">
                    <span className="checkmark">✓</span>
                    Everything in {plans[index - 1].name}, plus...
                  </div>
                )}
              </div>

              {/* Show RazorpayButton if order data is ready for this plan */}
              {orderData && selectedPlan === plan.id ? (
                <RazorpayButton
                  planId={plan.id}
                  planName={plan.name}
                  planPrice={plan.price_inr}
                  orderData={orderData}
                  user={user}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onCancel={handlePaymentCancel}
                />
              ) : (
                <button
                  className="subscribe-btn"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loadingPlanId === plan.id}
                >
                  {loadingPlanId === plan.id
                    ? "Preparing..."
                    : "Start Free Trial"}
                </button>
              )}

              {/* Coupon Section - Show only for the selected plan */}
              {showCouponInput && selectedPlan === plan.id && !orderData && (
                <div className="coupon-section">
                  <h3>Have a coupon code? (Optional)</h3>
                  <div className="coupon-input-group">
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="coupon-input"
                    />
                    <button
                      className="apply-coupon-btn"
                      onClick={handleApplyCoupon}
                      disabled={applyingCoupon}
                    >
                      {applyingCoupon ? "Applying..." : "Apply"}
                    </button>
                  </div>

                  {appliedCoupon && (
                    <div className="coupon-applied">
                      <p>
                        ✅ Coupon "{appliedCoupon.code}" applied! You saved ₹
                        {couponDiscount / 100}
                      </p>
                    </div>
                  )}

                  <div className="payment-actions">
                    <button
                      className="proceed-payment-btn"
                      onClick={proceedToPayment}
                    >
                      {appliedCoupon ? "Proceed to Payment" : "Skip & Pay"}
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={() => {
                        setShowCouponInput(false);
                        setSelectedPlan(null);
                        setCouponCode("");
                        setCouponDiscount(0);
                        setAppliedCoupon(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BillingScreen;
