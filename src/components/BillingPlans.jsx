import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import "./BillingPlans.css";
import { BASE_URL } from "../api/api";

const BillingPlans = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly"); // monthly or annual
  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

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
      // alert("Please login to subscribe to a plan");
      return;
    }

    try {
      const token = localStorage.getItem("access-token");
      const response = await fetch(
        `${BASE_URL}/subscription/subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ plan_id: planId }),
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        // alert(
        //   `Successfully subscribed to ${data.subscription.plan_name} plan!`
        // );
        // Redirect to dashboard or refresh the page
        window.location.reload();
      } else {
        // alert("Failed to subscribe: " + (data.detail || "Unknown error"));
      }
    } catch (err) {
      // alert("Error subscribing to plan");
      console.error("Error subscribing:", err);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      // alert("Please enter a coupon code");
      return;
    }

    setApplyingCoupon(true);
    try {
      // TODO: Implement coupon validation API
      // alert("Coupon code functionality coming soon!");
    } catch (err) {
      // alert("Error applying coupon code");
      console.error("Error applying coupon:", err);
    } finally {
      setApplyingCoupon(false);
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
      return `/mo (billed annually)`;
    }
    return `/mo`;
  };

  if (loading) {
    return (
      <div className="billing-plans-container">
        <div className="loading">Loading subscription plans...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="billing-plans-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="billing-plans-container">
      {/* Header */}
      <div className="billing-header">
        <h1>Choose the plan that's right for you</h1>
        <p>
          Whether you're just starting out or scaling your business, we've got a
          plan to fit your needs.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="billing-toggle">
        <div className="toggle-container">
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
            Annual Billing Save 16%
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="plans-grid">
        {plans.map((plan, index) => (
          <div key={plan.id} className={`plan-card ${plan.name.toLowerCase()}`}>
            {plan.name === "Standard" && (
              <div className="popular-badge">Popular</div>
            )}

            <div className="plan-header">
              <h3>{plan.name}</h3>
              <div className="plan-price">
                <span className="currency">$</span>
                <span className="amount">{getPrice(plan)}</span>
                <span className="period">{getBillingText(plan)}</span>
              </div>
              <p className="plan-description">
                {plan.name === "Basic" &&
                  "Essential tools for solo creators & small teams."}
                {plan.name === "Standard" &&
                  "More power for content-heavy workflows."}
                {plan.name === "Pro " &&
                  "Unlimited scale for agencies & advanced users."}
              </p>
            </div>

            <div className="plan-features">
              <div className="feature">
                <span className="feature-icon">✓</span>
                <span className="feature-text">
                  {plan.is_unlimited ? "Unlimited*" : plan.images_limit} Images
                  per month
                </span>
              </div>
              <div className="feature">
                <span className="feature-icon">✓</span>
                <span className="feature-text">
                  {plan.is_unlimited
                    ? "Unlimited*"
                    : plan.content_words_limit.toLocaleString()}{" "}
                  Content Words
                </span>
              </div>
              <div className="feature">
                <span className="feature-icon">✓</span>
                <span className="feature-text">
                  {plan.is_unlimited ? "Unlimited*" : plan.serp_searches_limit}{" "}
                  SERP Searches
                </span>
              </div>
              <div className="feature">
                <span className="feature-icon">✓</span>
                <span className="feature-text">1 Ayrshare Profile</span>
              </div>
            </div>

            <div className="plan-actions">
              <button
                className="subscribe-btn"
                onClick={() => handleSubscribe(plan.id)}
              >
                Get Started
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Coupon Code Section */}
      <div className="coupon-section">
        <div className="coupon-container">
          <span className="coupon-icon">🎁</span>
          <span className="coupon-text">Have a coupon code?</span>
          <input
            type="text"
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="coupon-input"
          />
          <button
            className="apply-btn"
            onClick={handleApplyCoupon}
            disabled={applyingCoupon}
          >
            {applyingCoupon ? "Applying..." : "Apply"}
          </button>
        </div>
      </div>

      {/* Add-ons Section */}
      <div className="addons-section">
        <h3>Add-ons & Billing Notes</h3>
        <div className="addons-grid">
          <div className="addon-card">
            <div className="addon-price">$1</div>
            <div className="addon-description">
              Additional 5,000 words/tokens
            </div>
            <button className="addon-btn">Buy More Tokens</button>
          </div>
          <div className="addon-card">
            <div className="addon-price">$4</div>
            <div className="addon-description">Additional 50 images</div>
            <button className="addon-btn">Buy More Tokens</button>
          </div>
          <div className="addon-card">
            <div className="addon-price">$2</div>
            <div className="addon-description">Additional 100 Searches</div>
            <button className="addon-btn">Buy More Tokens</button>
          </div>
        </div>

        <div className="billing-notes">
          <p>• Top-ups are billed immediately and reset monthly</p>
          <p>• Unused credits do not roll over (images, words, or searches)</p>
          <p>
            •{" "}
            <a href="#" className="contact-link">
              Contact Our Sales Team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default BillingPlans;
