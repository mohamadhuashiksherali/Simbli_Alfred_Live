import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Swal from "sweetalert2";
import "./SubscriptionPlans.css";
import { BASE_URL } from "../api/api";

const SubscriptionPlans = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mySubscription, setMySubscription] = useState(null);
  const [subscribing, setSubscribing] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState(null);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [planDiscounts, setPlanDiscounts] = useState([]);
  const [changingPlanId, setChangingPlanId] = useState(null);

  useEffect(() => {
    fetchPlans();
    if (user) {
      fetchMySubscription();
    }
  }, [user]);

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

  const fetchMySubscription = async () => {
    try {
      const token = localStorage.getItem("access-token");
      const response = await fetch(
        `${BASE_URL}/subscription/my-subscription`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      if (data.status === "success") {
        setMySubscription(data.subscription);
      } else {
        setMySubscription(null);
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
      setMySubscription(null);
    }
  };

  const handleSubscribe = async (planId) => {
    if (!user) {
      alert("Please login to start a free trial");
      return;
    }

    // Check if this is a trial-to-paid conversion (user has any active trial)
    const isTrialConversion =
      mySubscription &&
      mySubscription.trial_info &&
      mySubscription.trial_info.is_trial;

    setProcessingPlanId(planId);
    try {
      const token = localStorage.getItem("access-token");

      // Use different endpoint based on whether this is trial conversion or new trial
      const endpoint = isTrialConversion
        ? `${BASE_URL}/subscription/convert-trial-to-paid`
        : `${BASE_URL}/subscription/start-trial`;

      console.log(
        "Calling endpoint:",
        endpoint,
        "isTrialConversion:",
        isTrialConversion
      );

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan_id: planId,
          currency: "INR",
          coupon_code: appliedCoupon?.code || null,
        }),
      });

      console.log("Response status:", response.status);
      const data = await response.json();

      if (data.status === "success") {
        // Open Razorpay payment popup
        const options = {
          key: data.razorpay_key,
          amount: data.order.amount,
          currency: data.order.currency,
          name: "Alfred Social Media Agent",
          description: isTrialConversion
            ? `Subscribe to ${data.conversion_info?.plan_name || "Plan"}`
            : `Free Trial - ${data.trial_info?.plan_name || "Plan"}`,
          order_id: data.order.id,
          handler: async function (response) {
            // Verify payment (trial or conversion)
            try {
              const verifyEndpoint = isTrialConversion
                ? `${BASE_URL}/subscription/verify-conversion-payment`
                : `${BASE_URL}/subscription/verify-trial-payment`;

              const verifyResponse = await fetch(verifyEndpoint, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  plan_id: planId,
                  coupon_id: appliedCoupon?.id || null,
                  original_amount:
                    data.conversion_info?.original_amount || null,
                  discount_amount: data.conversion_info?.discount_amount || 0,
                }),
              });

              const verifyData = await verifyResponse.json();

              if (verifyData.status === "success") {
                // Clear coupon state after successful subscription
                setAppliedCoupon(null);
                setCouponCode("");
                setPlanDiscounts([]);

                if (isTrialConversion) {
                  await Swal.fire({
                    title: "Subscription Activated!",
                    text: `Your trial has been converted to a paid subscription! You now have full access to all features.`,
                    icon: "success",
                    confirmButtonColor: "#28a745",
                  });
                } else {
                  await Swal.fire({
                    title: "Trial Started!",
                    text: `Free trial started successfully! You have 7 days to explore all features. Auto-pay will be enabled after the trial period.`,
                    icon: "success",
                    confirmButtonColor: "#28a745",
                  });
                }
                fetchMySubscription(); // Refresh subscription data
              } else {
                await Swal.fire({
                  title: isTrialConversion
                    ? "Conversion Failed"
                    : "Trial Verification Failed",
                  text: verifyData.detail || "Unknown error",
                  icon: "error",
                  confirmButtonColor: "#dc3545",
                });
              }
            } catch (err) {
              console.error("Error verifying payment:", err);
              await Swal.fire({
                title: "Error",
                text: "Error verifying payment. Please contact support.",
                icon: "error",
                confirmButtonColor: "#dc3545",
              });
            }
          },
          prefill: {
            name: user.name || "",
            email: user.email || "",
            contact: user.phone || "",
          },
          theme: {
            color: "#28a745",
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        console.error("API Error:", data);
        await Swal.fire({
          title: "Failed to Start Trial",
          text: data.detail || data.message || "Unknown error",
          icon: "error",
          confirmButtonColor: "#dc3545",
        });
      }
    } catch (err) {
      console.error("Error starting trial:", err);
      await Swal.fire({
        title: "Error",
        text: `Error starting free trial: ${err.message}`,
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
    } finally {
      setProcessingPlanId(null);
    }
  };

  const handlePlanChange = async (newPlanId) => {
    // Find the new plan details
    const newPlan = plans.find((plan) => plan.id === newPlanId);
    const currentPlan = mySubscription?.plan;

    if (!newPlan || !currentPlan) {
      console.error("Plan not found");
      return;
    }

    const isUpgrade = newPlan.price_usd > currentPlan.price_usd;
    const action = isUpgrade ? "upgrade" : "downgrade";

    // Show SweetAlert confirmation
    const result = await Swal.fire({
      title: `${isUpgrade ? "⬆Upgrade" : " Downgrade"} Plan?`,
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Current Plan:</strong> ${currentPlan.name} ($${
        currentPlan.price_usd
      }/month)</p>
          <p><strong>New Plan:</strong> ${newPlan.name} ($${
        newPlan.price_usd
      }/month)</p>
          <p style="color: ${
            isUpgrade ? "#28a745" : "#ffc107"
          }; font-weight: bold;">
            ${
              isUpgrade ? "⬆️ You will be charged more" : "⬇️ You will pay less"
            }
          </p>
          <p style="font-size: 14px; color: #666; margin-top: 15px;">
            <strong>Note:</strong> This change will take effect from your next billing cycle.
          </p>
        </div>
      `,
      icon: isUpgrade ? "question" : "warning",
      showCancelButton: true,
      confirmButtonColor: isUpgrade ? "#28a745" : "#ffc107",
      cancelButtonColor: "#6c757d",
      confirmButtonText: `Yes, ${action} my plan`,
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (!result.isConfirmed) {
      return;
    }

    setChangingPlan(true);
    setChangingPlanId(newPlanId)
    try {
      const token = localStorage.getItem("access-token");
      const response = await fetch(
        `${BASE_URL}/subscription/change-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            new_plan_id: newPlanId,
          }),
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        await Swal.fire({
          title: "Success!",
          text: `${data.message}. The change will take effect on ${new Date(
            data.effective_date
          ).toLocaleDateString()}.`,
          icon: "success",
          confirmButtonColor: "#28a745",
        });
        fetchMySubscription(); // Refresh subscription data
      } else {
        await Swal.fire({
          title: "Error",
          text: "Failed to change plan: " + (data.detail || "Unknown error"),
          icon: "error",
          confirmButtonColor: "#dc3545",
        });
      }
    } catch (err) {
      await Swal.fire({
        title: "Error",
        text: "Error changing plan. Please try again.",
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
      console.error("Error changing plan:", err);
    } finally {
      setChangingPlan(false);
      setChangingPlanId(null)
    }
  };
console.log("changingPlanId",changingPlanId)
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      await Swal.fire({
        title: "Error",
        text: "Please enter a coupon code",
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
      return;
    }

    setCouponLoading(true);
    try {
      const token = localStorage.getItem("access-token");
      const response = await fetch(
        `${BASE_URL}/subscription/validate-coupon`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ coupon_code: couponCode.trim() }),
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        setAppliedCoupon(data.coupon);

        // Store plan discounts for displaying on cards
        if (data.plan_discounts) {
          setPlanDiscounts(data.plan_discounts);
        }

        // Handle different response formats
        let message = "";
        if (data.coupon.discount_percentage) {
          message = `${data.coupon.discount_percentage}% discount applied successfully`;
        } else if (data.coupon.discount_type === "fixed") {
          message = `Fixed discount applied successfully`;
        } else {
          message = data.message || "Coupon applied successfully";
        }

        await Swal.fire({
          title: "Coupon Applied!",
          text: message,
          icon: "success",
          confirmButtonColor: "#28a745",
        });
      } else {
        // Clear coupon state if validation failed
        setAppliedCoupon(null);
        setPlanDiscounts([]);

        await Swal.fire({
          title: "Coupon Not Applied",
          text:
            data.detail ||
            "This coupon has already been used or is not valid for this plan.",
          icon: "warning",
          confirmButtonColor: "#ffc107",
        });
      }
    } catch (err) {
      await Swal.fire({
        title: "Error",
        text: "Error applying coupon code",
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
      console.error("Error applying coupon:", err);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setPlanDiscounts([]);
  };

  const handleBuyAddon = async (addonType, amount, credits,usd_amount) => {
    if (!user) {
      alert("Please login to purchase add-ons");
      return;
    }

    try {
      const token = localStorage.getItem("access-token");
      const response = await fetch(
        `${BASE_URL}/subscription/buy-addon`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            addon_type: addonType,
            amount: amount,
            credits: credits,
            currency: "INR",
            price_usd : usd_amount
          }),
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        // Open Razorpay payment popup
        const options = {
          key: data.razorpay_key,
          amount: data.order.amount,
          currency: data.order.currency,
          name: "Alfred Social Media Agent",
          description: `Add-on: ${addonType} - ${credits} credits`,
          order_id: data.order.id,
          handler: async function (response) {
            // Verify add-on payment
            try {
              const verifyResponse = await fetch(
                `${BASE_URL}/subscription/verify-addon-payment`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_signature: response.razorpay_signature,
                    addon_type: addonType,
                    credits: credits,
                    amount: amount,
                  }),
                }
              );

              const verifyData = await verifyResponse.json();

              if (verifyData.status === "success") {
                await Swal.fire({
                  title: "Add-on Purchased!",
                  text: `Successfully purchased ${credits} ${addonType} credits! They have been added to your account.`,
                  icon: "success",
                  confirmButtonColor: "#28a745",
                });
                fetchMySubscription(); // Refresh subscription data
              } else {
                await Swal.fire({
                  title: "Purchase Failed",
                  text: verifyData.detail || "Unknown error",
                  icon: "error",
                  confirmButtonColor: "#dc3545",
                });
              }
            } catch (err) {
              console.error("Error verifying add-on payment:", err);
              await Swal.fire({
                title: "Error",
                text: "Error verifying add-on payment. Please contact support.",
                icon: "error",
                confirmButtonColor: "#dc3545",
              });
            }
          },
          prefill: {
            name: user.name || "",
            email: user.email || "",
            contact: user.phone || "",
          },
          theme: {
            color: "#28a745",
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        await Swal.fire({
          title: "Failed to Create Order",
          text: data.detail || "Unknown error",
          icon: "error",
          confirmButtonColor: "#dc3545",
        });
      }
    } catch (err) {
      await Swal.fire({
        title: "Error",
        text: "Error creating add-on order",
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
      console.error("Error buying add-on:", err);
    }
  };

  if (loading) {
    return (
      <div className="subscription-plans-container">
        <div className="loading">Loading subscription plans...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="subscription-plans-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="subscription-plans-container">
      <div className="subscription-header">
        <h1>Choose Your Plan</h1>
        <p>Select the perfect plan for your content creation needs</p>
      </div>

      {/* Subscription Plans */}
      <div className="plans-grid">
        {plans.map((plan) => (
          <div key={plan.id} className={`plan-card ${plan.name.toLowerCase()}`}>
            <div className="plan-header">
              <h3>{plan.name}</h3>
              <div className="plan-price">
                <span className="currency">$</span>
                <span className="amount">{billingCycle === "yearly" && plan.monthly_equivalent ? Math.round(plan.monthly_equivalent) : plan.price_usd}</span>
                <span className="period">{billingCycle === "yearly" ? "/mo (billed annually)" : "/month"}</span>
              </div>
              <div className="plan-price-inr">
                {(() => {
                  const discount = planDiscounts.find(
                    (d) => d.plan_id === plan.id
                  );
                  if (discount && appliedCoupon) {
                    return (
                      <div>
                        <div
                          className="original-price"
                          style={{
                            textDecoration: "line-through",
                            color: "#999",
                          }}
                        >
                          ₹{plan.price_inr}/month
                        </div>
                        <div
                          className="discounted-price"
                          style={{ color: "#28a745", fontWeight: "bold" }}
                        >
                          ₹{Math.round(discount.final_price / 100)}/month
                        </div>
                        <div
                          className="savings"
                          style={{ fontSize: "12px", color: "#dc3545" }}
                        >
                          Save ₹{Math.round(discount.discount_amount / 100)}
                        </div>
                      </div>
                    );
                  }
                  return `₹${plan.price_inr}/month`;
                })()}
              </div>
            </div>

            <div className="plan-features">
              <div className="feature">
                <span className="feature-icon">🖼️</span>
                <span className="feature-text">
                  {plan.is_unlimited ? "Unlimited" : plan.images_limit} Images
                </span>
              </div>
              <div className="feature">
                <span className="feature-icon">📝</span>
                <span className="feature-text">
                  {plan.is_unlimited
                    ? "Unlimited"
                    : plan.content_words_limit.toLocaleString()}{" "}
                  Content Words
                </span>
              </div>
              <div className="feature">
                <span className="feature-icon">🔍</span>
                <span className="feature-text">
                  {plan.is_unlimited ? "Unlimited" : plan.serp_searches_limit}{" "}
                  SERP Searches
                </span>
              </div>
            </div>

            <div className="plan-description">
              <p>{plan.description}</p>
            </div>

            <div className="plan-actions">
              {(() => {
                if (mySubscription && mySubscription.plan?.id === plan.id) {
                  // Current plan - show status
                  if (
                    mySubscription.trial_info &&
                    mySubscription.trial_info.is_trial
                  ) {
                    return (
                      <button
                        className="subscribe-btn"
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={processingPlanId === plan.id}
                      >
                        {processingPlanId === plan.id
                          ? "Processing..."
                          : "Subscribe"}
                      </button>
                    );
                  } else {
                    return (
                      <button className="current-plan-btn" disabled>
                        Subscribed
                      </button>
                    );
                  }
                } else if (
                  mySubscription &&
                  mySubscription.trial_info &&
                  mySubscription.trial_info.is_trial
                ) {
                  // User has trial - show Subscribe for all other plans
                  return (
                    <button
                      className="subscribe-btn"
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={processingPlanId === plan.id}
                    >
                      {processingPlanId === plan.id
                        ? "Processing..."
                        : "Subscribe"}
                    </button>
                  );
                } else if (mySubscription) {
                  // User has paid subscription - show upgrade/downgrade
                  return (
                    <button
                      className={`plan-change-btn ${
                        plan.price_usd > mySubscription.plan.price_usd
                          ? "upgrade-btn"
                          : "downgrade-btn"
                      }`}
                      onClick={() => handlePlanChange(plan.id)}
                      disabled={changingPlanId === plan.id}
                    >
                      {changingPlanId === plan.id
                        ? "Processing..."
                        : plan.price_usd > mySubscription.plan.price_usd
                        ? `⬆ Upgrade`
                        : `⬇ Downgrade`}
                    </button>
                  );
                } else {
                  // No subscription - show trial
                  return (
                    <button
                      className="subscribe-btn"
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={processingPlanId === plan.id}
                    >
                      {processingPlanId === plan.id
                        ? "Processing..."
                        : "Start Free Trial"}
                    </button>
                  );
                }
              })()}
            </div>
          </div>
        ))}
      </div>

      {/* Coupon Code Section */}
      <div className="coupon-section">
        <h3>Have a coupon code?</h3>
        <div className="coupon-input-group">
          <input
            type="text"
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="coupon-input"
            disabled={appliedCoupon}
          />
          {appliedCoupon ? (
            <button onClick={handleRemoveCoupon} className="remove-coupon-btn">
              Remove
            </button>
          ) : (
            <button
              onClick={handleApplyCoupon}
              className="apply-coupon-btn"
              disabled={couponLoading}
            >
              {couponLoading ? "Applying..." : "Apply"}
            </button>
          )}
        </div>
        {appliedCoupon && (
          <div className="applied-coupon">
            <span className="coupon-success">✓</span>
            <span className="coupon-text">
              {appliedCoupon.discount_percentage
                ? `${appliedCoupon.discount_percentage}% discount applied`
                : appliedCoupon.discount_type === "fixed"
                ? "Fixed discount applied"
                : "Coupon applied"}
            </span>
          </div>
        )}
      </div>

      {/* Add-ons & Billing Notes Section */}
      <div className="addons-section">
        <h2>Add-ons & Billing Notes</h2>
        <div className="addons-grid">
          <div className="addon-card">
            <div className="addon-price">$2</div>
            <h3>Additional 5,000 words/tokens</h3>
            <p>Extra content generation capacity for your projects.</p>
            <button
              className="buy-tokens-btn"
              onClick={() => handleBuyAddon("content_words", 18000, 5000,200)}
            >
              Buy More Tokens
            </button>
          </div>

          <div className="addon-card">
            <div className="addon-price">$4</div>
            <h3>Additional 50 images</h3>
            <p>Extra image generation quota for your content needs.</p>
            <button
              className="buy-tokens-btn"
              onClick={() => handleBuyAddon("images", 35000, 50,400)}
            >
              Buy More Tokens
            </button>
          </div>

          <div className="addon-card">
            <div className="addon-price">$2</div>
            <h3>Additional 100 Searches</h3>
            <p>Extra SERP search capacity for research and content planning.</p>
            <button
              className="buy-tokens-btn"
              onClick={() => handleBuyAddon("serp_searches", 18000, 100,200)}
            >
              Buy More Tokens
            </button>
          </div>
        </div>

        <div className="billing-notes">
          <p>
            ▲ Top-ups are billed immediately and reset monthly X Unused credits
            do not roll over (images, words, or searches)
          </p>
          <p>
            <a href="mailto:sales@alfred.com" className="contact-link">
              Contact Our Sales Team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
