import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "./BillingNewCss.css";
import CancellationPopup from "./CancellationPopup";
import RetentionOfferPopup from "./RetentionOfferPopup";
import CancelConfirmationPopup from "./CancelConfirmationPopup";
import RetentionSuccessPopup from "./RetentionSuccessPopup";
import SubscriptionCancelledPopup from "./SubscriptionCancelledPopup";
import Loading from "../assets/simbli_loader.gif"
import { BASE_URL, verifySubscriptionAuthenticationApi } from "../api/api";

const BillingNewCode = ({ onNavigateToInvoice }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [billingCycle, setBillingCycle] = useState("monthly");
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
  const [currency, setCurrency] = useState("INR");
  const [countryCode, setCountryCode] = useState("IN");
  const [showManagePlanModal, setShowManagePlanModal] = useState(false);
  const [retentionPending, setRetentionPending] = useState(false);
  const [selectedCancelReasonId, setSelectedCancelReasonId] = useState(null);
  const [selectedCancelComment, setSelectedCancelComment] = useState("");
  const [cancellingInProgress, setCancellingInProgress] = useState(false);
  const [showCancellationPopup, setShowCancellationPopup] = useState(false);
  const [cancellationReasons, setCancellationReasons] = useState([]);
  const [showRetentionOffer, setShowRetentionOffer] = useState(false);
  const [pendingCancellationData, setPendingCancellationData] = useState(null);
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  const [cancelConfirmationData, setCancelConfirmationData] = useState(null);
  const [showRetentionSuccess, setShowRetentionSuccess] = useState(false);
  const [showSubscriptionCancelled, setShowSubscriptionCancelled] = useState(false);
  const [addonPricing, setAddonPricing] = useState(null);
  const [retentionOfferData, setRetentionOfferData] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [retentionProcessing, setRetentionProcessing] = useState(false);
  const [changingPlanId, setChangingPlanId] = useState(null);
  const [planChangeState ,setPlanChangeState] = useState(false);
  const [showPlanChangeLoader, setShowPlanChangeLoader] = useState(false);
  // Auto-detect user's currency and country
  useEffect(() => {
    const detectUserLocation = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        if (data.currency && data.country_code) {
          const detectedCountry = data.country_code;
          let detectedCurrency = data.currency;
          
          // Razorpay only supports USD and INR
          // Map currency to USD/INR based on country code
          if (detectedCountry.toUpperCase() === "IN") {
            detectedCurrency = "INR";
          } else {
            // For all other countries, use USD (Razorpay requirement)
            detectedCurrency = "USD";
          }
          
          console.log(`🌍 Detected country: ${detectedCountry}, Original currency: ${data.currency}, Mapped to Razorpay currency: ${detectedCurrency}`);
          
          setCurrency(detectedCurrency);
          setCountryCode(detectedCountry);
        }
      } catch (error) {
        console.log("Could not detect location, using default INR");
        // Keep default values (INR, IN)
      }
    };

    detectUserLocation();
  }, []);

  // Fetch addon pricing when currency changes
  useEffect(() => {
    const fetchAddonPricing = async () => {
      if (!currency || !countryCode) return;

      try {
        const token = localStorage.getItem("access-token");
        const response = await fetch(
          `${BASE_URL}/subscription/addon-pricing?country_code=${countryCode}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();
        if (data.status === "success") {
          console.log("🔍 Addon pricing fetched:", data.pricing);
          setAddonPricing(data.pricing);
        } else {
          console.error("❌ Failed to fetch addon pricing:", data);
        }
      } catch (error) {
        console.error("Failed to fetch addon pricing:", error);
      }
    };

    fetchAddonPricing();
  }, [currency, countryCode]);

  useEffect(() => {
    fetchPlans();
    if (user) {
      fetchMySubscription(true); // Sync with Razorpay on initial load to get latest autopay_cancelled status
      // fetch retention status
      (async () => {
        try {
          const token = localStorage.getItem("access-token");
          const res = await fetch(`${BASE_URL}/subscription/retention-status`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data && data.status === "success") {
            setRetentionPending(!!data.pending);
            setRetentionOfferData(data.retention_offer || null);
          } else {
            setRetentionPending(false);
            setRetentionOfferData(null);
          }
        } catch (_) {
          setRetentionPending(false);
        }
      })();
    }
  }, [user, currency, countryCode,planChangeState]);

  // Check subscription status once when page becomes visible (catches GPay cancellations)
  useEffect(() => {
    if (!user) return;
    
    // Only check once when page becomes visible (user switches back to tab/window)
    // Sync with Razorpay to catch any GPay cancellations
    let hasChecked = false;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !hasChecked) {
        console.log("👁️ Page became visible - checking subscription status with Razorpay sync");
        hasChecked = true;
        fetchMySubscription(true); // Sync with Razorpay
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  // Separate effect for billing cycle changes to avoid unnecessary reloads
  useEffect(() => {
    fetchPlans();
  }, [billingCycle]);

  const fetchPlans = async () => {
    try {
      // setLoading(true);
      const params = new URLSearchParams({
        billing_cycle: billingCycle,
        currency: currency,
        country_code: countryCode,
      });

      const response = await fetch(
        `${BASE_URL}/subscription/plans?${params}`
      );
      const data = await response.json();

      if (data.status === "success") {
        // Filter plans by billing cycle first, then group by plan type
        const filteredPlans = data.plans.filter(
          (plan) => plan.billing_cycle === billingCycle
        );

        // Group by plan type (Basic, Standard, Pro)
        const groupedPlans = filteredPlans.reduce((acc, plan) => {
          const planType = plan.name.split(" - ")[0]; // Extract "Basic Plan", "Standard Plan", "Pro Plan"
          acc[planType] = plan;
          return acc;
        }, {});

        // Convert to array and sort by price
        const sortedPlans = Object.values(groupedPlans).sort(
          (a, b) => a.converted_price - b.converted_price
        );
        setPlans(sortedPlans);
        setCurrency(data.currency);
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

  const fetchMySubscription = async (syncWithRazorpay = false) => {
    try {
      const token = localStorage.getItem("access-token");
      const url = `${BASE_URL}/subscription/my-subscription${syncWithRazorpay ? '?sync_with_razorpay=true' : ''}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.status === "success") {
        const subscription = data.subscription;
        if (subscription) {
          console.log("📋 Subscription fetched:", {
            status: subscription.status,
            autopay_cancelled: subscription.autopay_cancelled,
            plan: subscription.plan?.name,
            synced_with_razorpay: syncWithRazorpay
          });
          
          // Check if status changed (e.g., from active to cancelled)
          if (mySubscription && 
              mySubscription.autopay_cancelled !== subscription.autopay_cancelled) {
            console.log("🔄 Subscription status changed:", {
              old: { autopay_cancelled: mySubscription.autopay_cancelled },
              new: { autopay_cancelled: subscription.autopay_cancelled }
            });
          }
        }
        setMySubscription(subscription);
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
      // alert("Please login to start a free trial");
      return;
    }

    // Check if this is a trial-to-paid conversion (user has any active trial)
    const isTrialConversion =
      mySubscription &&
      mySubscription.trial_info &&
      mySubscription.trial_info.is_trial;

    // Allow trial users to subscribe to any plan (upgrade/downgrade)
    // The backend will handle plan switching and cancel the trial subscription

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

      console.log("🌍 Sending trial request with currency:", currency, "country:", countryCode);
      console.log("🎫 Applied coupon:", appliedCoupon);
      console.log("🎫 Coupon code being sent:", appliedCoupon?.code || null);

      const requestBody = {
        plan_id: planId,
        country_code: countryCode,
        currency: currency, // Send currency preference (e.g., "USD" for VPN users)
        coupon_code: (billingCycle === "monthly" && appliedCoupon?.code) || null, // Only send coupon for monthly plans
        is_current_plan_with_retention: (billingCycle === "monthly" && retentionPending && mySubscription?.plan?.id === planId), // Only send retention for monthly plans
      };
      
      console.log("📤 Request body:", requestBody);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status);

      const data = await response.json();
      console.log("💰 Backend response data:", data);
      console.log("💳 Order currency from backend:", data.order?.currency);
      console.log("💵 Order amount from backend:", data.order?.amount);
      console.log("🌍 Frontend detected currency:", currency);
      console.log("🌍 Frontend detected country:", countryCode);

      if (data.status === "success") {
        // PRIORITY 1: Check for subscription_id or short_url FIRST (subscription flow)
        // This handles both trial conversion and new trial subscriptions
        if (data.subscription_id && data.razorpay_key) {
          console.log("✅ Using subscription_id with Razorpay checkout modal:", data.subscription_id);
          
          // Ensure Razorpay script is loaded
          if (!window.Razorpay) {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            document.body.appendChild(script);
            
            // Wait for script to load
            script.onload = () => {
              openSubscriptionAuthModal(data);
            };
          } else {
            openSubscriptionAuthModal(data);
          }
        } else if (data.short_url) {
          // Fallback: if subscription_id not available, use short_url in popup
          console.log("⚠️ subscription_id not available, using short_url in popup");
          // Open short_url in a popup window (not full redirect)
          const authWindow = window.open(data.short_url, 'RazorpayAuth', 'width=600,height=700,scrollbars=yes,resizable=yes');
          
          if (!authWindow) {
            // Popup blocked - show error
            Swal.fire({
              title: "Popup Blocked",
              text: "Please allow popups for this site to complete authorization.",
              icon: "warning",
              confirmButtonText: "OK",
            });
            return;
          }
          
          // Check if window was closed (user completed auth)
          const checkClosed = setInterval(() => {
            if (authWindow.closed) {
              clearInterval(checkClosed);
              // IMPORTANT: Call verify-subscription-authentication to store in database immediately
              if (data.subscription_id) {
                try {
                  setPaymentProcessing(true);
                  console.log("📝 Calling verify-subscription-authentication after short_url auth...");
                  verifySubscriptionAuthenticationApi({
                    subscription_id: data.subscription_id
                  }).then((verifyResponse) => {
                    setPaymentProcessing(false);
                    console.log("✅ verify-subscription-authentication response:", verifyResponse.data);
                  }).catch((verifyErr) => {
                    setPaymentProcessing(false);
                    console.error("❌ Error verifying subscription authentication:", verifyErr);
                  });
                } catch (verifyErr) {
                  setPaymentProcessing(false);
                  console.error("❌ Error calling verify-subscription-authentication:", verifyErr);
                }
              }
              // Refresh subscription after auth
              setTimeout(() => {
                fetchMySubscription(true); // sync_with_razorpay=true
                setPlanChangeState(!planChangeState);
              }, 2000);
            }
          }, 1000);
        } else if (data.requires_authorization && !data.subscription_id && !data.short_url) {
          // No subscription method available
          Swal.fire({
            title: "Error",
            text: "Authentication method not available. Please contact support.",
            icon: "error",
            timer: 4000,
            timerProgressBar:true,
            confirmButtonText: "OK",
          });
        } else if (!isTrialConversion && data.order) {
          // For new trial, use existing order flow
          console.log("🔧 Razorpay options - Amount:", data.order.amount, "Currency:", data.order.currency);

          // Force currency override if needed
          let finalCurrency = data.order.currency || currency;
          let finalAmount = data.order.amount;

          // If user wants USD but Razorpay returned INR, try to force USD
          if (currency === "USD" && data.order.currency === "INR") {
            console.log("🔄 Attempting to force USD currency for USA VPN user");
            finalCurrency = "USD";
            // Convert INR amount to USD (approximate)
            finalAmount = Math.max(1, Math.round(data.order.amount / 83)); // Rough conversion
            console.log("🔄 Converted amount:", data.order.amount, "INR ->", finalAmount, "USD cents");
          }

          console.log("🔧 Final Razorpay options - Amount:", finalAmount, "Currency:", finalCurrency);

          const options = {
            key: data.razorpay_key,
            amount: finalAmount,
            currency: finalCurrency,
            name: "Alfred Social Media Agent",
            description: `Free Trial - ${data.trial_info?.plan_name || "Plan"}`,
            order_id: data.order.id,
            handler: async function (response) {
              // Show loading state
              setPaymentProcessing(true);
              // Verify payment
              try {
                const verifyResponse = await fetch(`${BASE_URL}/subscription/verify-trial-payment`, {
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
                  }),
                });

                const verifyData = await verifyResponse.json();

                if (verifyData.status === "success") {
                  setPaymentProcessing(false);
                  await Swal.fire({
                    title: "Trial Started!",
                    text: `Free trial started successfully! You have 7 days to explore all features. Auto-pay will be enabled after the trial period.`,
                    icon: "success",
                    confirmButtonColor: "#28a745",
                    timer: 4000,
                    timerProgressBar: true,
                  });
                  setPlanChangeState(!planChangeState)
                  fetchMySubscription();
                } else {
                  setPaymentProcessing(false);
                  await Swal.fire({
                    title: "Trial Verification Failed",
                    text: verifyData.detail || verifyData.message || "Unknown error",
                    icon: "error",
                    confirmButtonColor: "#dc3545",
                    timer: 4000,
                    timerProgressBar: true,
                  });
                }
              } catch (err) {
                setPaymentProcessing(false);
                console.error("Error verifying payment:", err);
                await Swal.fire({
                  title: "Error",
                  text: "Error verifying payment. Please contact support.",
                  timer: 4000,
                  timerProgressBar: true,
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
          // No authentication needed - show success
          await Swal.fire({
            title: "Subscription Created!",
            text: "Your subscription has been created successfully.",
            icon: "success",
            confirmButtonColor: "#28a745",
            timer: 4000,
            timerProgressBar: true,
          });
          fetchMySubscription();
          setPlanChangeState(!planChangeState);
        }
      } else {
        console.error("API Error:", data);
        // Handle validation errors (422) - data.detail is an array
        let errorMessage = "Unknown error";
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            errorMessage = data.detail
              .map((err) => err.msg || err.message || err)
              .join(", ");
          } else {
            errorMessage = data.detail;
          }
        } else if (data.message) {
          errorMessage = data.message;
        }

        await Swal.fire({
          title: "Failed to Start Trial",
          text: errorMessage,
          icon: "error",
          confirmButtonColor: "#dc3545",
          timer: 4000,
          timerProgressBar: true,
        });
      }
    } catch (err) {
      console.error("Error starting trial:", err);
      await Swal.fire({
        title: "Error",
        text: `Error starting free trial: ${err.message}`,
        icon: "error",
        confirmButtonColor: "#dc3545",
        timer: 4000,
        timerProgressBar: true,
      });
    } finally {
      setProcessingPlanId(null);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      await Swal.fire({
        title: "Coupon Required",
        text: "Please enter a coupon code",
        icon: "info",
        confirmButtonColor: "#dc3545",
        timer: 4000,
        timerProgressBar: true,
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
        body: JSON.stringify({
          coupon_code: couponCode.trim(),
        }),
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        setAppliedCoupon(data.coupon);
        setPlanDiscounts(data.plan_discounts || []);
        await Swal.fire({
          title: "Coupon Applied!",
          text: `You saved ${data?.coupon?.discount_type !== "fixed" ? data?.coupon?.discount_percentage : data?.coupon.discount_value} ${data?.coupon?.discount_type !== "fixed"?"%":"$"} on your subscription!`,
          icon: "success",
          confirmButtonColor: "#28a745",
          timer: 4000,
          timerProgressBar: true,
        });
      } else {
        await Swal.fire({
          title: "Invalid Coupon",
          text: data.detail || "This coupon code is not valid",
          icon: "error",
          confirmButtonColor: "#dc3545",
          timer: 4000,
          timerProgressBar: true,
        });
      }
    } catch (err) {
      await Swal.fire({
        title: "Error",
        text: "Error applying coupon code",
        icon: "error",
        confirmButtonColor: "#dc3545",
        timer: 4000,
        timerProgressBar: true,
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

  const fetchCancellationReasons = async () => {
    try {
      const res = await fetch(`${BASE_URL}/subscription/cancellation-reasons`);
      const data = await res.json();
      if (data.status === "success") {
        setCancellationReasons(data.reasons || []);
        return data.reasons || [];
      }
    } catch (_) {}
    setCancellationReasons([]);
    return [];
  };

  // const showCancellationReasonsModal = async () => {
  //   const reasons = await fetchCancellationReasons();
  //   // Build choices UI (two-column tiles)
  //   const itemsHtml = reasons
  //     .map(
  //       (r, idx) => `
  //       <label class="cancel-reason-item" data-id="${r.id}" style="display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid #E5E7EB;border-radius:8px;cursor:pointer;background:#F7F9FB;">
  //         <input type="radio" name="cancel_reason" value="${r.id}" style="display:none;" ${selectedCancelReasonId===r.id?"checked":""}/>
  //         <span style="font-size:13px;color:#111827;">${r.title}</span>
  //       </label>
  //     `
  //     )
  //     .join("");

  //   const html = `
  //     <div style="text-align:center;margin-bottom:14px;">
  //       <div style="font-size:18px;font-weight:800;color:#0f172a;margin-bottom:8px;">Wait! Before You Go...</div>
  //       <div style="font-size:12px;color:#6b7280;">Please tell us why you'd like to cancel – it helps us improve</div>
  //     </div>
  //     <div class="cancel-reasons" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;text-align:left;">${itemsHtml}</div>
  //     <div id="other-comment-wrapper" style="margin-top:12px;display:none;">
  //       <input id="other-comment" type="text" placeholder="Share your Comments" style="width:100%;padding:10px 12px;border:1px solid #E5E7EB;border-radius:8px;font-size:13px;"/>
  //     </div>
  //   `;

  //   const result = await Swal.fire({
  //     html,
  //     showCancelButton: true,
  //     confirmButtonText: "Continue to Cancel",
  //     cancelButtonText: "Talk to support",
  //     reverseButtons: false,
  //     width: 520,
  //     focusConfirm: false,
  //     didOpen: () => {
  //       const container = Swal.getHtmlContainer();
  //       if (!container) return;
  //       const labels = Array.from(container.querySelectorAll('.cancel-reason-item'));
  //       const normalize = (s) => (s||'').toLowerCase();
  //       const updateUI = () => {
  //         labels.forEach((lab) => {
  //           const input = lab.querySelector('input[name="cancel_reason"]');
  //           if (input?.checked) {
  //             lab.style.border = '1px solid #28a745';
  //             lab.style.background = '#E7F6EC';
  //           } else {
  //             lab.style.border = '1px solid #E5E7EB';
  //             lab.style.background = '#F7F9FB';
  //           }
  //         });
  //         const checkedLabel = labels.find(l => l.querySelector('input[name="cancel_reason"]')?.checked);
  //         const title = checkedLabel?.innerText?.trim() || '';
  //         const otherWrap = container.querySelector('#other-comment-wrapper');
  //         const otherInput = container.querySelector('#other-comment');
  //         if (normalize(title) === 'other') {
  //           otherWrap.style.display = 'block';
  //           if (selectedCancelComment) otherInput.value = selectedCancelComment;
  //         } else {
  //           otherWrap.style.display = 'none';
  //         }
  //       };
  //       labels.forEach((lab) => {
  //         lab.addEventListener('click', () => {
  //           const input = lab.querySelector('input[name="cancel_reason"]');
  //           if (input) { input.checked = true; }
  //           updateUI();
  //         });
  //       });
  //       // If no prior selection, keep current (no auto-select); otherwise render highlights
  //       updateUI();
  //     },
  //   });

  //   if (result.isConfirmed) {
  //     const container = Swal.getHtmlContainer();
  //     const checked = container?.querySelector('input[name="cancel_reason"]:checked');
  //     const reasonId = checked ? parseInt(checked.value, 10) : selectedCancelReasonId;
  //     const otherComment = container?.querySelector('#other-comment')?.value || '';
  //     if (!reasonId) {
  //       await Swal.fire({
  //         icon: 'warning',
  //         title: 'Please select a reason',
  //         confirmButtonColor: '#28a745',
  //       });
  //       return { action: 'dismiss' };
  //     }
  //     // Persist selection for next time
  //     setSelectedCancelReasonId(reasonId || null);
  //     setSelectedCancelComment(otherComment);
  //     return { action: "continue", reasonId, otherComment };
  //   } else if (result.dismiss === Swal.DismissReason.cancel) {
  //     return { action: "support" };
  //   }
  //   return { action: "dismiss" };
  // };

  // const handleCancelSubscription = async () => {
  //   if (cancellingInProgress) return;
  //   setCancellingInProgress(true);
  //   // Step 1: Reasons modal first
  //   const reasonsChoice = await showCancellationReasonsModal();
  //   if (reasonsChoice.action === "support") {
  //     // You can route to support or open chat
  //     window.open("mailto:contact@simbli.ai", "_blank");
  //     setCancellingInProgress(false);
  //     return;
  //   }
  //   if (reasonsChoice.action !== "continue") {
  //     setCancellingInProgress(false);
  //     return;
  //   }

  //   // Step 2: Retention offer modal
  //   const retentionHtml = `
  //     <div style="text-align:center;margin-bottom:14px;">
  //       <div style="font-size:18px;font-weight:800;color:#0f172a;margin-bottom:8px;">Wait! Before You Go...</div>
  //       <div style="font-size:12px;color:#6b7280;">Here's an exclusive offer just for you!</div>
  //     </div>
  //     <div style="background:#E7F6EC;border:1px solid #CFECDC;border-radius:10px;padding:16px;text-align:center;margin-bottom:10px;">
  //       <div style="font-size:16px;color:#0f172a;font-weight:700;">Claim 50% OFF for 1 Month</div>
  //       <div style="font-size:12px;color:#6b7280;margin-top:4px;">Enjoy 50% OFF for your next billing cycle.</div>
  //     </div>
  //     <div style="font-size:11px;color:#6b7280;display:flex;align-items:center;gap:6px;justify-content:center;margin-bottom:8px;">
  //       <span>⏱</span>
  //       <span>Offer valid for the next 24 hours</span>
  //     </div>
  //   `;

  //   const retentionResult = await Swal.fire({
  //     html: retentionHtml,
  //     showConfirmButton: true,
  //     confirmButtonText: "Enjoy 50% OFF for 1 Month",
  //     showCancelButton: true,
  //     cancelButtonText: "Continue Cancellation",
  //     reverseButtons: false,
  //     width: 520,
  //     focusConfirm: false,
  //     customClass: {
  //       confirmButton: "swal-btn-text-black",
  //     },
  //   });

  //   if (retentionResult.isConfirmed) {
  //     const successHtml = `
  //       <div style=\"text-align:center;margin-bottom:12px;\">\n          <div style=\"font-size:18px;font-weight:800;color:#0f172a;margin-bottom:4px;\">You're All Set!</div>\n          <div style=\"font-size:12px;color:#6b7280;\">Thank You for Staying With Us!<br/>Your Special Offer Has Been Successfully Applied.</div>\n        </div>\n        <div style=\"background:#E7F6EC;border:1px solid #CFECDC;border-radius:10px;padding:16px;text-align:center;margin-bottom:14px;\">\n          <div style=\"font-size:13px;color:#0f172a;\">Your limited-time <b>50% OFF</b> will be applied to<br/>your next billing cycle.</div>\n          <div style=\"font-size:11px;color:#6b7280;margin-top:6px;\">After that month, your plan will renew at the standard price.</div>\n        </div>\n      `;
  //     try {
  //       const token = localStorage.getItem("access-token");
  //       await fetch(`${BASE_URL}/subscription/retention-accept`, {
  //         method: "POST",
  //         headers: { "Authorization": `Bearer ${token}` },
  //       });
  //       setRetentionPending(true);
  //     } catch (_) {}
  //     await Swal.fire({
  //       html: successHtml,
  //       showConfirmButton: true,
  //       confirmButtonText: "Go to My Dashboard",
  //       showCancelButton: true,
  //       cancelButtonText: "Explore Premium Features",
  //       reverseButtons: false,
  //       width: 520,
  //     });
  //     setCancellingInProgress(false);
  //     return; // stop cancellation flow
  //   }

  const handleCancellationReasonSelect = (reasonId) => {
    setSelectedCancelReasonId(reasonId);
  };

  const handleCancellationCommentChange = (comment) => {
    setSelectedCancelComment(comment);
  };

  const handleCancellationContinue = (reasonId, comment) => {
    setShowCancellationPopup(false);
    setPendingCancellationData({ reasonId, comment });
    // setShowRetentionOffer(true);
    // setShowCancelConfirmation(true);
    console.log("Hii")
    proceedWithCancellation(reasonId, comment);
    console.log("Hii2")
  };

  const handleCancellationSupport = () => {
    setShowCancellationPopup(false);
    window.open("mailto:contact@simbli.ai", "_blank");
  };

  const handleRetentionOfferAccept = async () => {
    setRetentionProcessing(true);
    setShowRetentionOffer(false);
    try {
      const token = localStorage.getItem("access-token");
      await fetch(`${BASE_URL}/subscription/retention-accept`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });
      setRetentionPending(true);

      // Hide loading state before showing success popup
      setRetentionProcessing(false);
      setShowRetentionSuccess(true);
    } catch (error) {
      console.error("Error accepting retention offer:", error);
    }
  };

  const handleGoToDashboard = () => {
    setShowRetentionSuccess(false);
    // Navigate to dashboard or scroll to plans
    document.querySelector('.plans-grid')?.scrollIntoView({behavior:'smooth'});
  };

  const handleExploreFeatures = () => {
    setShowRetentionSuccess(false);
    // Navigate to features or scroll to plans
    document.querySelector('.plans-grid')?.scrollIntoView({behavior:'smooth'});
  };


  const handleGoToHome = () => {
    setShowSubscriptionCancelled(false);
    // Navigate to home page
    window.location.href = '/';
  };

  const handleContactSupport = () => {
    setShowSubscriptionCancelled(false);
    // Open support email
    window.open('mailto:contact@simbli.ai', '_blank');
  };

  const handleRetentionOfferContinue = () => {
    setShowRetentionOffer(false);
    if (pendingCancellationData) {
      proceedWithCancellation(pendingCancellationData.reasonId, pendingCancellationData.comment);
    }
  };

  // Function to open Razorpay modal for subscription authentication (after payment)
  const openSubscriptionAuthModal = (data) => {
    console.log("🔐 Opening Razorpay modal for subscription authentication:", data.subscription_id);
    
    const options = {
      key: data.razorpay_key,
      subscription_id: data.subscription_id,
      name: "Alfred Social Media Agent",
      description: "Authorize Autopay - Activate Subscription",
      prefill: {
        name: user?.username || "User",
        email: user?.email || "",
      },
      theme: {
        color: "#28a745",
      },
      handler: async function (response) {
        setPaymentProcessing(true);
        console.log("✅ Subscription authenticated and activated:", response);
        console.log("📋 Response data:", JSON.stringify(response, null, 2));
        
        // Get subscription_id from response
        const subscriptionId = response.subscription_id || data.subscription_id;
        console.log("📋 Subscription ID:", subscriptionId);
        
        // IMPORTANT: Call verify-subscription-authentication to store in database immediately
        try {
          console.log("📝 Calling verify-subscription-authentication to store in database immediately...");
          const verifyResponse = await verifySubscriptionAuthenticationApi({
            subscription_id: subscriptionId
          });
          console.log("✅ verify-subscription-authentication response:", verifyResponse.data);
          
          if (verifyResponse.data.status === "success") {
            setPaymentProcessing(false);
            console.log("✅ Subscription stored in database immediately after authentication");
            console.log("📋 Database status:", verifyResponse.data.status);
            console.log("📋 Is Trial:", verifyResponse.data.is_trial);
          }
        } catch (verifyErr) {
          setPaymentProcessing(false);
          console.error("❌ Error verifying subscription authentication:", verifyErr);
          // Continue anyway - webhook will handle it
        }
        
        // Sync with Razorpay to update subscription status immediately
        try {
          await fetchMySubscription(true); // sync_with_razorpay=true
        } catch (err) {
          console.error("Error syncing subscription:", err);
        }
        
        // Wait a bit for webhook to process, then sync again
        setTimeout(async () => {
          try {
            await fetchMySubscription(true); // Sync again to ensure status is updated
            setPlanChangeState(!planChangeState);
          } catch (err) {
            console.error("Error syncing subscription after delay:", err);
          }
        }, 3000);
        setPaymentProcessing(false)
        Swal.fire({
          title: "🎉 Subscription Activated!",
          text: "Your subscription has been activated and autopay has been authorized. You now have full access to all features.",
          icon: "success",
          timer: 4000,
          timerProgressBar: true,
          confirmButtonText: "Great!",
          confirmButtonColor: "#28a745"
        });
      },
      modal: {
        ondismiss: function() {
          console.log("❌ Subscription authentication cancelled");
          Swal.fire({
            title: "Authentication Cancelled",
            text: "You can authorize autopay later from your subscription settings. Your subscription will be active after authorization.",
            icon: "info",
            timer: 4000,
            timerProgressBar: true,
            confirmButtonText: "OK",
          }).then(() => {
            fetchMySubscription();
          });
        }
      }
    };
    
    if (window.Razorpay) {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      console.error("❌ Razorpay not loaded");
      Swal.fire({
        title: "Error",
        text: "Payment system is loading. Please refresh the page and try again.",
        icon: "error",
        timer: 4000,
        timerProgressBar: true,
        confirmButtonText: "OK",
      });
    }
  };

  // Function to open Razorpay modal for reactivation
  const openReactivateModal = (data) => {
    console.log("🔐 Opening Razorpay modal for reactivation:", data.subscription_id);
    
    const options = {
      key: data.razorpay_key,
      subscription_id: data.subscription_id,
      name: "Alfred Social Media Agent",
      description: "Reactivate Subscription - Authorize Autopay",
      prefill: {
        name: user?.username || "User",
        email: user?.email || "",
      },
      theme: {
        color: "#28a745",
      },
      handler: async function (response) {
        setPaymentProcessing(true)
        console.log("✅ Subscription reactivated and authorized:", response);
        
        // Get subscription_id from response
        const subscriptionId = response.subscription_id || data.subscription_id;
        console.log("📋 Subscription ID:", subscriptionId);
        
        // IMPORTANT: Call verify-subscription-authentication to store in database immediately
        try {
          console.log("📝 Calling verify-subscription-authentication after reactivation...");
          const verifyResponse = await verifySubscriptionAuthenticationApi({
            subscription_id: subscriptionId
          });
          setPaymentProcessing(false);
          console.log("✅ verify-subscription-authentication response:", verifyResponse.data);
        } catch (verifyErr) {
          setPaymentProcessing(false);
          console.error("❌ Error verifying subscription authentication:", verifyErr);
        }
        
        Swal.fire({
          title: "🎉 Authorization Complete!",
          text: "Your subscription has been reactivated and autopay has been authorized. Billing will resume from your next cycle.",
          icon: "success",
          timer: 4000,
          timerProgressBar: true,
          confirmButtonText: "Great!",
          confirmButtonColor: "#28a745"
        }).then(() => {
          fetchMySubscription(true); // sync_with_razorpay=true
        });
      },
      modal: {
        ondismiss: function() {
          console.log("❌ Subscription reactivation authorization cancelled");
          Swal.fire({
            title: "Authorization Cancelled",
            text: "You can reactivate and authorize autopay later.",
            icon: "info",
            timer: 4000,
            timerProgressBar: true,
            confirmButtonText: "OK",
          });
        }
      }
    };
    
    if (window.Razorpay) {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      console.error("❌ Razorpay not loaded");
      Swal.fire({
        title: "Error",
        text: "Payment system is loading. Please refresh the page and try again.",
        icon: "error",
        timer: 4000,
        timerProgressBar: true,
        confirmButtonText: "OK",
      });
    }
  };

  const handleReactivateSubscription = async () => {
    console.log("🔍 Reactivate subscription clicked");
    console.log("📊 Current subscription data:", mySubscription);
    console.log("🚫 Autopay cancelled:", mySubscription?.autopay_cancelled);
    console.log("✅ Should show reactivate button:", mySubscription && mySubscription.autopay_cancelled);

    try {
      const token = localStorage.getItem("access-token");
      console.log("🔑 Token exists:", !!token);

      const response = await fetch(`${BASE_URL}/subscription/reactivate-subscription`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
      });

      console.log("📡 Response status:", response.status);

      const data = await response.json();

      if (data.status === "success") {
        // Check if authentication is required (PRIORITIZE modal over redirect)
        if (data.requires_authorization && data.subscription_id && data.razorpay_key) {
          // PREFERRED: Use subscription_id for modal checkout (opens in popup, not redirect)
          console.log("🔐 Authentication required - using subscription_id for modal checkout:", data.subscription_id);
          
          // Ensure Razorpay script is loaded
          if (!window.Razorpay) {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.async = true;
            document.body.appendChild(script);
            
            // Wait for script to load
            script.onload = () => {
              openReactivateModal(data);
            };
          } else {
            openReactivateModal(data);
          }
        } else if (data.requires_authorization && data.short_url) {
          // FALLBACK: Use short_url only if subscription_id is not available (open in popup, not redirect)
          console.log("🔐 Authentication required - using short_url as fallback (opening in popup):", data.short_url);
          
          // Open short_url in popup window (not redirect)
          const popup = window.open(
            data.short_url,
            'RazorpayAuthorization',
            'width=600,height=700,scrollbars=yes,resizable=yes'
          );
          
          if (!popup) {
            // Popup blocked - show error
            Swal.fire({
              title: "Popup Blocked",
              text: "Please allow popups for this site to complete authorization, or click the link below.",
              icon: "warning",
              timer: 4000,
              timerProgressBar: true,
              showCancelButton: true,
              confirmButtonText: "Open Authorization Link",
              cancelButtonText: "Cancel",
              confirmButtonColor: "#28a745"
            }).then((result) => {
              if (result.isConfirmed) {
                window.open(data.short_url, '_blank');
              }
            });
            return;
          }
          
          // Check if popup is closed (user completed authorization)
          const checkPopup = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkPopup);
              console.log("✅ Popup closed - checking if authorization completed");
              // IMPORTANT: Call verify-subscription-authentication to store in database immediately
              if (data.subscription_id) {
                try {
                  
                  console.log("📝 Calling verify-subscription-authentication after short_url auth...");
                  verifySubscriptionAuthenticationApi({
                    subscription_id: data.subscription_id
                  }).then((verifyResponse) => {
                    console.log("✅ verify-subscription-authentication response:", verifyResponse.data);
                  }).catch((verifyErr) => {
                    console.error("❌ Error verifying subscription authentication:", verifyErr);
                  });
                } catch (verifyErr) {
                  console.error("❌ Error calling verify-subscription-authentication:", verifyErr);
                }
              }
              // Refresh subscription after a delay to check if authorized
              setTimeout(() => {
                fetchMySubscription(true); // sync_with_razorpay=true
              }, 2000);
            }
          }, 1000);
          
          // Show info message
          Swal.fire({
            title: "Authorization Required",
            text: "Please complete the authorization in the popup window. Your subscription will be reactivated after authorization.",
            icon: "info", 
            confirmButtonText: "OK",
            timer: 5000,
            timerProgressBar: true
          });
        } else {
          // No authentication needed - already reactivated
          Swal.fire({
            title: "Subscription Reactivated!",
            timer: 4000,
            timerProgressBar: true,
            text: "Your subscription has been reactivated successfully. Billing will resume from your next cycle.",
            icon: "success",
            confirmButtonText: "OK",
            confirmButtonColor: "#28a745"
          });
          fetchMySubscription();
        }
      } else {
        Swal.fire({
          title: "Error",
          text: data.message || data.detail || "Failed to reactivate subscription",
          icon: "error",
          confirmButtonText: "OK",
          timer: 4000,
          timerProgressBar: true,
        });
      }
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to reactivate subscription. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
        timer: 4000,
        timerProgressBar: true,
      });
    }
  };

  const handleCancelSubscription = async () => {
    if (cancellingInProgress) return;
    await fetchCancellationReasons();
    setShowCancellationPopup(true);
  };

  const proceedWithCancellation = async (reasonId, comment) => {
    setCancellingInProgress(true);
    console.log("reasonId", reasonId);
    console.log("comment", comment);

    const isTrial = mySubscription?.trial_info?.is_trial;

    let title, message, confirmText, endDate;

    if (isTrial) {
      const trialEndDate = new Date(
        mySubscription.trial_info?.trial_ends_at || mySubscription.trial_ends_at
      );
      const now = new Date();
      const daysLeft = Math.max(
        0,
        Math.ceil((trialEndDate - now) / (24 * 60 * 60 * 1000))
      );

      title = "Cancel Trial?";
      message = `You still have ${daysLeft} day(s) remaining in your trial. Cancelling will stop autopay immediately, but you'll retain access until ${trialEndDate.toLocaleDateString(
        "en-US",
        { year: "numeric", month: "long", day: "numeric" }
      )}.`;
      confirmText = "Cancel Trial";
      endDate = trialEndDate;
    } else {
      const nextBilling = new Date(mySubscription.next_billing_date);
      title = "Cancel Subscription?";
      message = `Your subscription will remain active until ${nextBilling.toLocaleDateString(
        "en-US",
        { year: "numeric", month: "long", day: "numeric" }
      )}. Are you sure you want to cancel?`;
      confirmText = "Cancel Now";
      endDate = nextBilling;
    }

    // Load SweetAlert2 dynamically if not present
    // if (!window.Swal) {
    //   const script = document.createElement("script");
    //   script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
    //   script.onload = () => handleCancelSubscription();
    //   document.head.appendChild(script);
    //   return;
    // }

    // // 🔔 Custom SweetAlert Confirmation
    // const result = await window.Swal.fire({
    //   title: `<span class="swal2_title_Cancel">${title}</span>`,
    //   html: `<div class="Cancel_Remain">${message}</div>`,
    //   iconHtml:
    //     '<svg xmlns="http://www.w3.org/2000/svg" width="86" height="86" viewBox="0 0 86 86" fill="none"><circle cx="43" cy="43" r="43" fill="#CFF3DE"/><path d="M43.5001 36.7278V45.1703M43.5001 53.6128H43.5201M40.7343 25.9461L24.306 55.9309C23.3948 57.5941 22.9392 58.4257 23.0065 59.1083C23.0653 59.7034 23.3604 60.2444 23.8185 60.5965C24.3437 61 25.2531 61 27.0718 61H59.9282C61.747 61 62.6562 61 63.1815 60.5965C63.6395 60.2444 63.9348 59.7034 63.9935 59.1083C64.0608 58.4257 63.6052 57.5941 62.694 55.9309L46.2657 25.9461C45.3579 24.2889 44.9039 23.4603 44.3117 23.1821C43.7949 22.9393 43.2051 22.9393 42.6886 23.1821C42.0962 23.4603 41.6421 24.289 40.7343 25.9461Z" stroke="#3ABF62" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    //   showCancelButton: true,
    //   confirmButtonColor: "#28a745",
    //   cancelButtonColor: "#d33",
    //   confirmButtonText: "Keep My Plan",
    //   cancelButtonText: confirmText,
    //   reverseButtons: true,
    //   customClass: {
    //     popup: "swal2-popup-custom",
    //     title: "swal2-title",
    //     htmlContainer: "swal2-html-container",
    //     confirmButton: "swal2-confirm",
    //     cancelButton: "swal2-cancel",
    //   },
    // });

    // try {
    //   if (result.dismiss === window.Swal.DismissReason.cancel) {
    //     // User clicked "Cancel Now" → call API
    //     try {
    //       const token = localStorage.getItem("access-token");
    //       const response = await fetch(
    //         `${BASE_URL}/subscription/cancel-subscription`,
    //         {
    //           method: "POST",
    //           headers: {
    //             "Content-Type": "application/json",
    //             Authorization: `Bearer ${token}`,
    //           },
    //           body: JSON.stringify({
    //             remove_autopay: true,
    //             reason_id: reasonsChoice.reasonId || null,
    //             comment: reasonsChoice.otherComment || "",
    //           }),
    //         }
    //       );

    setCancelConfirmationData({
      title,
      message,
      confirmText,
      isTrial,
      reasonId,
      comment
    });
    setShowCancelConfirmation(true);
    setCancellingInProgress(false);
  };

  const handleKeepPlan = () => {
    setShowCancelConfirmation(false);
    setCancelConfirmationData(null);
    Swal.fire({
      title: "Great!",
      text: "Your subscription remains active.",
      icon: "success",
      confirmButtonColor: "#28a745",
      timer: 4000,
      timerProgressBar: true,
    });
  };

  const handleConfirmCancellation = async () => {
    setShowCancelConfirmation(false);
    setCancellingInProgress(true);

    try {
      const token = localStorage.getItem("access-token");
      const response = await fetch(
        `${BASE_URL}/subscription/cancel-subscription`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            remove_autopay: true,
            reason_id: cancelConfirmationData?.reasonId || null,
            comment: cancelConfirmationData?.comment || "",
          }),
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        // Hide loading state before showing success modal
        setCancellingInProgress(false);
        setShowSubscriptionCancelled(true);
        fetchMySubscription();
      } else {
        // Hide loading state before showing error modal
        setCancellingInProgress(false);
        Swal.fire({
          title: "Error",
          text: data.message || data.detail || "Failed to cancel subscription",
          icon: "error",
          confirmButtonText: "OK",
          timer: 4000,
          timerProgressBar: true,
        });
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      // Hide loading state before showing error modal
      setCancellingInProgress(false);
      Swal.fire({
        title: "Error",
        text: "Something went wrong. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
        timer: 4000,
        timerProgressBar: true,
      });
    } finally {
      setCancellingInProgress(false);
      setCancelConfirmationData(null);
    }
  };

  const proceedWithPlanChange = async (newPlanId) => {
    // Find the new plan details
    const newPlan = plans.find((plan) => plan.id === newPlanId);
    const currentPlan = mySubscription?.plan;

    if (!newPlan || !currentPlan) {
      console.error("Plan not found");
      return;
    }

    // const isUpgrade = newPlan.price_usd > currentPlan.price_usd;
    const isUpgrade = newPlan.billing_cycle === 'yearly' || newPlan.price_usd > currentPlan.price_usd;
    const action = isUpgrade ? "upgrade" : "downgrade";

    // Show SweetAlert confirmation
    const result = await Swal.fire({
      title: `${isUpgrade ? "Upgrade" : "Downgrade"} Plan`,
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Current Plan:</strong> ${currentPlan.name} ($${
        currentPlan.price_usd
      }/month)</p>
          <p><strong>New Plan:</strong> ${newPlan.name} ($${
        newPlan.price_usd
      }/month)</p>
          <p style="color: ${
            isUpgrade ? "#84E084" : "#EAEAEA"
          }; font-weight: bold;">
            ${isUpgrade ? "You will be charged more" : "You will pay less"}
          </p>
          <p style="font-size: 14px; color: #666; margin-top: 15px;">
            <strong>Note:</strong> This change will take effect from your next billing cycle.
          </p>
        </div>
      `,
      icon: isUpgrade ? "question" : "warning",
      showCancelButton: true,
      confirmButtonColor: isUpgrade ? "#84E084" : "#EAEAEA",
      cancelButtonColor: "#EAEAEA",
      confirmButtonText: `Yes, ${action} my plan`,
      cancelButtonText: "Cancel",
      reverseButtons: true,
      customClass: {
        popup: "swal-wide",
      },
    });
    setChangingPlanId(newPlanId)
    if (result.isConfirmed) {
      setChangingPlan(true);
      setShowPlanChangeLoader(true);
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
            change_type: action,
          }),
          }
        );

        const data = await response.json();

        if (data.status === "success") {
          setShowPlanChangeLoader(false);
          Swal.fire({
            title: "Plan Change Scheduled!",
            timer: 4000,
            timerProgressBar: true,
            text: `Your plan will be ${action}d to ${newPlan.name} from your next billing cycle.`,
            icon: "success",
            confirmButtonText: "OK",
            confirmButtonColor: "#28a745",
          });
          fetchMySubscription();
        } else {
          setShowPlanChangeLoader(false);
          Swal.fire({
            title: "Error",
            timer: 4000,
            timerProgressBar: true,
            text: data.message || data.detail || "Failed to change plan",
            icon: "error",
            confirmButtonText: "OK",
          });
        }
      } catch (error) {
        setShowPlanChangeLoader(false);
        console.error("Error changing plan:", error);
        Swal.fire({
          title: "Error",
          timer: 4000,
          timerProgressBar: true,
          text: "Failed to change plan. Please try again.",
          icon: "error",
          confirmButtonText: "OK",
        });
      } finally {
        setChangingPlan(false);
        setChangingPlanId(null)
      }
    }
  };

  const handlePlanChange = async (newPlanId) => {
    // Check if subscription is cancelled
    if (mySubscription && mySubscription.autopay_cancelled) {
      const result = await Swal.fire({
        title: "Reactivate Your Subscription",
        html: `
          <div style="text-align: left; margin: 20px 0;">
            <p>Your subscription is currently cancelled. To upgrade or switch to a different plan, you must reactivate your current plan first.</p>
            <p style="color: #666; font-size: 14px; margin-top: 15px;">
              <strong>What happens when you reactivate?</strong><br>
              • Your current [Plan Name] will be immediately reactivated. <br>
              •  You can then proceed directly to the plan upgrade options. <br>
              • Billing will resume from your next cycle.
            </p>
          </div>
        `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#28a745",
        cancelButtonColor: "#6c757d",
        cancelButtonText: "Cancel",
        confirmButtonText: "Reactivate & Continue",
        reverseButtons: true
      });
      if (result.isConfirmed) {
        // Reactivate subscription first
        try {
          const token = localStorage.getItem("access-token");
          const response = await fetch(`${BASE_URL}/subscription/reactivate-subscription`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
          });

          const data = await response.json();

          if (data.status === "success") {
            Swal.fire({
              title: "Subscription Reactivated!",
              text: "Your subscription has been reactivated. You can now upgrade your plan.",
              icon: "success",
              timer: 4000,
              timerProgressBar: true,
              confirmButtonText: "Continue to Upgrade",
              confirmButtonColor: "#28a745"
            }).then(() => {
              // Refresh subscription data and proceed with plan change
              fetchMySubscription();
              // Proceed with the original plan change
              proceedWithPlanChange(newPlanId);
            });
          } else {
            Swal.fire({
              title: "Error",
              timer: 4000,
              timerProgressBar: true,
              text: data.message || data.detail || "Failed to reactivate subscription",
              icon: "error",
              confirmButtonText: "OK",
            });
          }
        } catch (error) {
          console.error("Error reactivating subscription:", error);
          Swal.fire({
            title: "Error",
            timer: 4000,
            timerProgressBar: true,
            text: "Failed to reactivate subscription. Please try again.",
            icon: "error",
            confirmButtonText: "OK",
          });
        }
      }
      return;
    }

    // Find the new plan details
    const newPlan = plans.find((plan) => plan.id === newPlanId);
    const currentPlan = mySubscription?.plan;

    if (!newPlan || !currentPlan) {
      console.error("Plan not found");
      return;
    }

    // const isUpgrade = newPlan.price_usd > currentPlan.price_usd;
    const isUpgrade = newPlan.billing_cycle === 'yearly' || newPlan.price_usd > currentPlan.price_usd;
    const action = isUpgrade ? "upgrade" : "downgrade";

    // Show SweetAlert confirmation
    const result = await Swal.fire({
      title: `${isUpgrade ? "Upgrade" : "Downgrade"} Plan`,
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Current Plan:</strong> ${currentPlan.name} ($${
        currentPlan.price_usd
      }/month)</p>
          <p><strong>New Plan:</strong> ${newPlan.name} ($${
        newPlan.price_usd
      }/month)</p>
          <p style="color: ${
            isUpgrade ? "#84E084" : "#EAEAEA"
          }; font-weight: bold;">
            ${isUpgrade ? "You will be charged more" : "You will pay less"}
          </p>
          <p style="font-size: 14px; color: #666; margin-top: 15px;">
            <strong>Note:</strong> This change will take effect from your next billing cycle.
          </p>
        </div>
      `,
      icon: isUpgrade ? "question" : "warning",
      showCancelButton: true,
      confirmButtonColor: isUpgrade ? "#84E084" : "#EAEAEA",
      cancelButtonColor: "#EAEAEA",
      confirmButtonText: `Yes, ${action} my plan`,
      cancelButtonText: "Cancel",
      reverseButtons: true,
      customClass: {
        confirmButton: "swal-btn-text-black",
        cancelButton: "swal-btn-text-black",
      },
    });

    if (!result.isConfirmed) {
      return;
    }

    setChangingPlan(true);
    setShowPlanChangeLoader(true);
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
        setShowPlanChangeLoader(false);
        await Swal.fire({
          title: "Success!",
          timer: 4000,
          timerProgressBar: true,
          text: `${data.message}. The change will take effect on ${new Date(
            data.effective_date
          ).toLocaleDateString()}.`,
          icon: "success",
          confirmButtonColor: "#28a745",
        });
        fetchMySubscription(); // Refresh subscription data
      } else if (data.status === "retention_offer_warning") {
        // Hide loader before showing warning
        setShowPlanChangeLoader(false);
        // Show retention offer warning
        const result = await Swal.fire({
          title: "Retention Offer Warning",
          html: `
            <div style="text-align: left; margin: 20px 0;">
              <p style="color: #dc3545; font-weight: bold; margin-bottom: 15px;">
                ⚠️ ${data.message}
              </p>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="margin: 0; font-weight: bold;">Your Current Retention Offer:</p>
                <p style="margin: 5px 0 0 0; color: #28a745;">
                  ${data.retention_offer.discount_percentage}% discount
                </p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #666;">
                  Applied on: ${new Date(data.retention_offer.applied_at).toLocaleDateString()}
                </p>
              </div>
              <p style="color: #666; font-size: 14px;">
                <strong>What happens if you proceed?</strong><br>
                • Your retention offer will be permanently deleted<br>
                • You cannot use this offer again<br>
                • Your plan change will be scheduled normally
              </p>
            </div>
          `,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#dc3545",
          cancelButtonColor: "#6c757d",
          confirmButtonText: "Yes, Delete Offer & Proceed",
          cancelButtonText: "Keep Offer & Cancel",
          reverseButtons: true
        });

        if (result.isConfirmed) {
          // User confirmed - proceed with plan change and delete retention offer
          setShowPlanChangeLoader(true);
          try {
            const confirmResponse = await fetch(
              `${BASE_URL}/subscription/change-plan-confirmed`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  new_plan_id: newPlanId,
                  confirm_retention_deletion: true,
                }),
              }
            );

            const confirmData = await confirmResponse.json();

            if (confirmData.status === "success") {
              setShowPlanChangeLoader(false);
              await Swal.fire({
                title: "Plan Change Scheduled!",
                timer: 4000,
                timerProgressBar: true,
                text: `${confirmData.message}. Your retention offer has been removed.`,
                icon: "success",
                confirmButtonColor: "#28a745",
              });
              setPlanChangeState(!planChangeState);
              fetchMySubscription(); // Refresh subscription data
            } else {
              setShowPlanChangeLoader(false);
              await Swal.fire({
                title: "Error",
                timer: 4000,
                timerProgressBar: true,
                text: "Failed to change plan: " + (confirmData.detail || confirmData.message || "Unknown error"),
                icon: "error",
                confirmButtonColor: "#dc3545",
              });
            }
          } catch (confirmErr) {
            setShowPlanChangeLoader(false);
            await Swal.fire({
              title: "Error",
              timer: 4000,
              timerProgressBar: true,
              text: "Error confirming plan change. Please try again.",
              icon: "error",
              confirmButtonColor: "#dc3545",
            });
            console.error("Error confirming plan change:", confirmErr);
          }
        }
      } else {
        setShowPlanChangeLoader(false);
        await Swal.fire({
          title: "Error",
          text:
            "Failed to change plan: " +
            (data.detail || data.message || "Unknown error"),
          icon: "error",
          confirmButtonColor: "#dc3545",
         
          timer: 4000,
          timerProgressBar: true,
        });
      }
    } catch (err) {
      setShowPlanChangeLoader(false);
      await Swal.fire({
        title: "Error",
        text: "Error changing plan. Please try again.",
        timer: 4000,
        timerProgressBar: true,
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
      console.error("Error changing plan:", err);
    } finally {
      setChangingPlan(false);
      setChangingPlanId(null)
    }
  };

  const handleBuyAddon = async (addonType) => {
    if (!user) {
      // alert("Please login to purchase add-ons");
      return;
    }

    // Get dynamic pricing for this addon type
    if (!addonPricing || !addonPricing[addonType]) {
      // alert("Pricing not available. Please try again.");
      return;
    }

    const pricing = addonPricing[addonType];

    console.log("🔍 Buying addon:", addonType);
    console.log("💰 Pricing data:", pricing);
    console.log("🌍 Currency:", currency);

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
          amount: pricing.razorpay_amount, // Use dynamic amount from pricing
          credits: pricing.credits, // Use dynamic credits from pricing
          country_code: countryCode, // Use detected country code
          price_usd: pricing.usd_cents, // Use USD amount in cents
        }),
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        const options = {
          key: data.razorpay_key,
          amount: data.order.amount,
          currency: data.order.currency,
          name: "Alfred Social Media Agent",
          description: `Add-on: ${addonType} - ${pricing.credits} credits`,
          order_id: data.order.id,
          handler: async function (response) {
            // Show loading state
            setPaymentProcessing(true);
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
                    credits: pricing.credits,
                    amount: pricing.razorpay_amount,
                    price_usd: pricing.usd_cents,
                  }),
                }
              );

              const verifyData = await verifyResponse.json();

              if (verifyData.status === "success") {
                // Hide loading state before showing success modal
                setPaymentProcessing(false);
                await Swal.fire({
                  title: "Add-on Purchased!",
                  text: (function(){
                    if (verifyData && verifyData.message) return verifyData.message;
                    const map={content_words:"Content Words", serp_searches:"Web Searches", images:"Images"};
                    const display=(map[addonType]||addonType).replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase());
                    return `Successfully purchased ${pricing.credits} ${display} credits! They have been added to your account.`;
                  })(),
                  icon: "success",
                  confirmButtonColor: "#28a745",
                  timer: 4000,
                  timerProgressBar: true,
                });
                fetchMySubscription();
              } else {
                // Hide loading state before showing error modal
                setPaymentProcessing(false);
                await Swal.fire({
                  title: "Purchase Failed",
                  text:
                    verifyData.detail || verifyData.message || "Unknown error",
                  icon: "error",
                  confirmButtonColor: "#dc3545",
                  timer: 4000,
                  timerProgressBar: true,
                });
              }
            } catch (err) {
              await Swal.fire({
                title: "Purchase Failed",
                text: "Error verifying payment. Please contact support.",
                icon: "error",
                confirmButtonColor: "#dc3545",
                timer: 4000,
                timerProgressBar: true,
              });
              console.error("Error verifying addon payment:", err);
            }
          },
          prefill: {
            name: user?.username || "",
            email: user?.email || "",
          },
          theme: {
            color: "#3264FC",
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      } else {
        await Swal.fire({
          title: "Failed to Create Order",
          text: data.detail || data.message || "Unknown error",
          icon: "error",
          confirmButtonColor: "#dc3545",
          timer: 4000,
          timerProgressBar: true,
        });
      }
    } catch (err) {
      await Swal.fire({
        title: "Purchase Failed",
        text: "Error initiating purchase. Please try again.",
        icon: "error",
        confirmButtonColor: "#dc3545",
        timer: 4000,
        timerProgressBar: true,
      });
      console.error("Error buying addon:", err);
    }
  };

  const showManageplan = () => {
    const handleViewInvoices = () => {
      console.log("Click---")
      // Close the SweetAlert popup first
      onNavigateToInvoice();
      // navigate(`/dashboard?tab=invoice`)
      window.Swal.close();
      // Navigate after popup closes to avoid interruption (SPA navigation)
      // setTimeout(() => {
      //   try {
      //     const ts = Date.now();
      //     navigate(`/dashboard?tab=invoice&ts=${ts}`, { replace: false });
      //     // Also explicitly signal tab change for robustness
      //     setTimeout(() => {
      //       try {
      //         const event = new CustomEvent("changeTab", {
      //           detail: { tab: "invoice" },
      //         });
      //         window.dispatchEvent(event);
      //       } catch (_) {}
      //     }, 100);
      //     // After dashboard picks up the tab, remove the URL param (give ample time)
      //     setTimeout(() => {
      //       try {
      //         const url = new URL(window.location.href);
      //         if (url.pathname === "/dashboard") {
      //           url.searchParams.delete("tab");
      //           url.searchParams.delete("ts");
      //           window.history.replaceState({}, "", url.toString());
      //         }
      //       } catch (_) {}
      //     }, 800);
      //   } catch (_) {
      //     const ts = Date.now();
      //     navigate(`/dashboard?tab=invoice&ts=${ts}`, { replace: false });
      //   }
      // }, 50);
    };
    if (window.Swal) {
      const cancelSection =
        mySubscription && !mySubscription.autopay_cancelled
          ? `<div id="cancel-subscription" style="color:#DB2222; cursor:pointer; padding:8px 0;">Cancel Subscription</div>`
          : "";
      window.Swal.fire({
        showConfirmButton: false,
        html: `
        <div style="text-align:left; font-family:Inter, sans-serif;">
          <p class="swal2_title_Cancel mb-0" >Manage Plan</p>
          <p class="mb-0" style="color:#424242; font-size:13px; margin-bottom:15px; padding-bottom:15px; border-bottom:1px solid #E5E7EB;">
            Update your plan or billing details
          </p>
  
          <div id="change-plan" style="display:flex; flex-direction:column; gap:0; font-size:15px;">
            <div style="display:flex; justify-content:space-between; align-items:center; cursor:pointer; padding:15px 0; border-bottom:1px solid #E5E7EB;">
              <span class="Change_Plan_popup">Change Plan</span>
              <span style="color:#9CA3AF;">
                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="14" viewBox="0 0 8 14" fill="none">
                  <path d="M1 13L7 7L1 1" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </div>
            
            <div id="view-invoices" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer; padding:15px 0; border-bottom:1px solid #E5E7EB;">
              <span class="Change_Plan_popup">View Invoices</span>
              <span style="color:#9CA3AF;">
                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="14" viewBox="0 0 8 14" fill="none">
                  <path d="M1 13L7 7L1 1" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
            </div>
             ${cancelSection}
        </div>
          </div>
  
          <div style="text-align:right; margin-top:20px;">
            <button class="mt-2" id="done-btn" style="
              background-color:#74DF74;
              color:#000000;
              border:none;
              border-radius:6px;
              padding:6px 25px;
              cursor:pointer;
              font-weight:500;
            ">
              Done
            </button>
          </div>
        </div>
        `,
        width: 450,
        padding: " 10px 13px",
        showCloseButton: false,
        allowOutsideClick: true,
        didOpen: () => {
          document.getElementById("done-btn").addEventListener("click", () => {
            window.Swal.close();
          });
          document
            .getElementById("change-plan")
            .addEventListener("click", () => {
              window.Swal.close();
            });

          // document
          //   .getElementById("cancel-subscription")
          //   .addEventListener("click", async (e) => {
          //     e.preventDefault();
          //     // Close Manage Plan popup first to prevent flicker
          //     window.Swal.close();
          //     // Open cancel flow after popup closes
          //     setTimeout(() => {
          //       handleCancelSubscription();
          //     }, 50);
          //   });
          document
            .getElementById("view-invoices")?.addEventListener("click", handleViewInvoices);

          const cancelBtn = document.getElementById("cancel-subscription");
          if (cancelBtn) {
            cancelBtn.addEventListener("click", async (e) => {
              e.preventDefault();
              window.Swal.close();
              setTimeout(() => {
                handleCancelSubscription();
              }, 50);
            });
          }
        },
      });
      return;
    }

    // Load SweetAlert2 dynamically if not loaded
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
    script.onload = showManageplan;
    document.head.appendChild(script);
  };

  if (loading) {
    return (
      <div className="billing-page">
        {/* <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>Loading subscription plans...</p>
        </div> */}
        <div className="min-h-screen  flex items-center justify-center">
          <div className="text-center">
            {/* <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div> */}
            {/* <p className="mt-4 text-gray-600">Loading...</p> */}
            {/* <div className="loader"></div> */}
            <img src={Loading} alt="" className="w-24 h-24" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="billing-page">
        <div style={{ textAlign: "center", padding: "2rem", color: "red" }}>
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="billing-page">
      {/* Payment Processing Loader */}
      {paymentProcessing && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              display:"flex",
              flexDirection:"column",
              alignItems:"center",
              justifyContent:"center",
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              textAlign: "center",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
            }}
          >
            {/* <div
              style={{
                width: "50px",
                height: "50px",
                border: "4px solid #f3f3f3",
                borderTop: "4px solid #17a2b8",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 20px",
              }}
                
            ></div> */}
            <img src={Loading} className="w-12 h-12"/>
            <h4 style={{ margin: "5px 0 10px", color: "#333" }}>
              Processing Payment...
            </h4>
            <p style={{ margin: 0, color: "#666" }}>
              Please wait while we verify your payment
            </p>
          </div>
        </div>
      )}

      {/* Retention Processing Loader */}
      {retentionProcessing && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              display:"flex",
              flexDirection:"column",
              alignItems:"center",
              justifyContent:"center",
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              textAlign: "center",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
            }}
          >
            {/* <div
              style={{
                width: "50px",
                height: "50px",
                border: "4px solid #f3f3f3",
                borderTop: "4px solid #28a745",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 20px",
              }}
            ></div> */}
            <img src={Loading} className="w-12 h-12"/>
            <h4 style={{ margin: "5px 0 10px", color: "#333" }}>
              Applying Special Offer...
            </h4>
            <p style={{ margin: 0, color: "#666" }}>
              Please wait while we apply your 50% discount
            </p>
          </div>
        </div>
      )}

      {/* Cancellation Processing Loader */}
      {cancellingInProgress && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              display:"flex",
              flexDirection:"column",
              alignItems:"center",
              justifyContent:"center",
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              textAlign: "center",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
            }}
          >
            {/* <div
              style={{
                width: "50px",
                height: "50px",
                border: "4px solid #f3f3f3",
                borderTop: "4px solid #dc3545",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 20px",
              }}
            ></div> */}
            <img src={Loading} className="w-12 h-12"/>
            <h4 style={{ margin: "5px 0 10px", color: "#333" }}>
              Cancelling Subscription...
            </h4>
            <p style={{ margin: 0, color: "#666" }}>
              Please wait while we process your cancellation
            </p>
          </div>
        </div>
      )}

      {/* Plan Change Processing Loader */}
      {showPlanChangeLoader && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              display:"flex",
              flexDirection:"column",
              alignItems:"center",
              justifyContent:"center",
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              textAlign: "center",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
            }}
          >
            <img src={Loading} className="w-12 h-12"/>
            <h4 style={{ margin: "5px 0 10px", color: "#333" }}>
              Changing Plan...
            </h4>
            <p style={{ margin: 0, color: "#666" }}>
              Please wait while we process your plan change
            </p>
          </div>
        </div>
      )}
      <div className="billing-header Billing_Header">
        <h1>Choose the plan that's right for you</h1>
        <p className="mb-0">
          Whether you're just starting out or scaling your business, we've got a
          plan to fit your needs.
        </p>

        {/* Billing Toggle */}
        <div className="" style={{ marginTop: "2rem", marginBottom: "" }}>
          <div className="billing-toggle">
            <button
              className={`toggle-btn ${
                billingCycle === "monthly" ? "active" : ""
              }`}
              onClick={() => setBillingCycle("monthly")}
            >
              Monthly Billing
            </button>
            <button
              className={`toggle-btn ${
                billingCycle === "yearly" ? "active" : ""
              }`}
              onClick={() => setBillingCycle("yearly")}
            >
              Annual Billing
              <span className="save-badge"> save 8.3 %</span>
            </button>
          </div>
        </div>
      </div>

      {/* Current Plan Section */}
      <div className="Mange_Plan p-3 mb-4">
        <div className="d-md-flex d-block align-items-center justify-content-between">
          {mySubscription && mySubscription.plan && (
            <div>
              <p className="mb-0 Current_plan d-md-flex d-block">
                Current Plan: {mySubscription.plan.name} - $
                {mySubscription.plan.price_usd}/mo
                {mySubscription?.status &&( <span 
                    className={`status-badge ${mySubscription?.status}`}
                    style={{
                      marginLeft: "8px",
                      fontSize: "12px",
                      backgroundColor: mySubscription?.autopay_cancelled ? "#FFE9E9" : "#E3F2FD",
                      color: mySubscription?.autopay_cancelled ? "#FF0000" : "#1976D2",
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontWeight: "500",
                    }}
                  >
                   {mySubscription?.autopay_cancelled 
                     ? "AUTOPAY CANCELLED" 
                     : (mySubscription?.trial_info?.is_trial 
                         ? "TRIAL" 
                         : (mySubscription?.status?.toUpperCase() || 'NO SUBSCRIPTION'))}
                 </span>)}
              </p>
              {(() => {
                const endDate =
                  mySubscription.next_billing_date ||
                  mySubscription.current_period_end;
                const hasValidDate =
                  endDate &&
                  endDate !== "Invalid Date" &&
                  !isNaN(new Date(endDate).getTime());
                const shouldShowDate =
                  hasValidDate || !mySubscription.autopay_cancelled;

                if (!shouldShowDate) return null;

                return (
                  <p
                    style={{
                      margin: "0",
                      color: "#6c757d",
                      fontSize: "0.9rem",
                    }}
                    className="mt-md-0 mt-2"
                  >
                    {mySubscription.autopay_cancelled
                      ? hasValidDate
                        ? `Access until: ${new Date(endDate).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}`
                        : "Access until: End of current period"
                      : hasValidDate
                      ? `Next Renewal: ${new Date(endDate).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}`
                      : "Next Renewal: To be determined"}
                  </p>
                );
              })()}
            </div>
          )}
          <div className="d-flex align-items-center gap-3 mt-md-0 mt-2">
            <button className="btn Manage_btn px-3 " onClick={onNavigateToInvoice}>
              View Invoices
            </button>
            {mySubscription && !mySubscription.autopay_cancelled && (
              <button
                className="btn Cancel_Subscription px-3"
                onClick={handleCancelSubscription}
              >
                Cancel Subscription
              </button>
            )}
            {mySubscription && mySubscription.autopay_cancelled && (
              <button
                className="btn px-3"
                onClick={handleReactivateSubscription}
                style={{
                  backgroundColor: "#74DF74",
                  color: "#000000",
                  border: "none",
                  borderRadius: "6px",
                  padding: "0.75rem 1.5rem",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                Reactivate Subscription
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="plans-grid">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${
              plan.name.toLowerCase().includes("standard") ? "plan-popular" : ""
            } px-3 py-3`}
          >
            <div className="plan-head">
              <div className="plan-head-row">
                <p
                  className="mb-0 pb-0 "
                  style={{ fontWeight: "600", fontSize: "15px" }}
                >
                  {plan.name.split(" - ")[0]}
                  {mySubscription &&
                    mySubscription.plan?.id === plan.id &&
                    mySubscription.trial_info &&
                    mySubscription.trial_info.is_trial && (
                      <span
                        style={{
                          marginLeft: "8px",
                          fontSize: "12px",
                          backgroundColor: "#E3F2FD",
                          color: "#1976D2",
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontWeight: "500",
                        }}
                      >
                        TRIAL
                      </span>
                    )}
                </p>
                {/* Retention Offer Badge */}
                {retentionPending && mySubscription?.plan?.id === plan.id && (
                  <div className="retention-coupon-badge">
                    {retentionOfferData?.discount_percentage || 50}% Coupon Applied
                  </div>
                )}
                {/* Coupon Badge - Show only on monthly plans when coupon is applied (but not if retention offer is active) */}
                {appliedCoupon && !retentionPending && billingCycle === "monthly" && (
                  <div className="retention-coupon-badge">
                    {appliedCoupon?.discount_type === "fixed" 
                      ? `$${appliedCoupon?.discount_value || 0} Off`
                      : `${appliedCoupon?.discount_percentage || 0}% Coupon Applied`
                    }
                  </div>
                )}
                {!retentionPending && !appliedCoupon && plan.name.toLowerCase().includes("standard") && (
                  <span className="badge-popular d-flex align-items-center gap-1">
                    <svg
                      width="12"
                      height="14"
                      viewBox="0 0 12 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7.43005 1H4.04687C3.94137 1 3.88862 1 3.84205 1.0164C3.80086 1.03089 3.76336 1.05456 3.73223 1.08567C3.69704 1.12086 3.67345 1.16902 3.62627 1.26534L1.15745 6.30532C1.04478 6.53536 0.988447 6.65038 1.00198 6.74386C1.01379 6.82546 1.05803 6.89854 1.12428 6.94582C1.20015 7 1.32612 7 1.57806 7H5.22576L3.46234 13L10.6296 5.41319C10.8714 5.15722 10.9923 5.02924 10.9994 4.91973C11.0055 4.82468 10.967 4.73229 10.8957 4.67082C10.8136 4.6 10.6395 4.6 10.2911 4.6H6.10748L7.43005 1Z"
                        stroke="white"
                        stroke-width="1.3"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    Popular
                  </span>
                )}
              </div>
              <div className="price">
                {/* Show retention offer pricing if user has retention offer for this plan */}
                {retentionPending && mySubscription?.plan?.id === plan.id ? (
                  <div className="retention-pricing-section">
                    <div className="retention-original-price">${billingCycle === "yearly" && plan.monthly_equivalent ? Math.round(plan.monthly_equivalent) : plan.price_usd}</div>
                    <div className="retention-discounted-price">
                      <span className="retention-price-amount">${((billingCycle === "yearly" && plan.monthly_equivalent ? Math.round(plan.monthly_equivalent) : plan.price_usd) * (1 - (retentionOfferData?.discount_percentage || 50) / 100)).toFixed(2)}</span>
                      <span className="retention-price-period">/{billingCycle === "monthly" ? "mo" : "mo"}</span>
                    </div>
                  </div>
                ) : appliedCoupon && billingCycle === "monthly" ? (
                  /* Show coupon discount pricing only for monthly plans when coupon is applied */
                  <div className="retention-pricing-section">
                    <div className="retention-original-price">${plan.price_usd}</div>
                    <div className="retention-discounted-price">
                      <span className="retention-price-amount">
                        ${(() => {
                          const originalPrice = plan.price_usd;
                          let discountedPrice;
                          
                          if (appliedCoupon?.discount_type === "fixed") {
                            // Fixed amount discount
                            discountedPrice = Math.max(0.01, originalPrice - (appliedCoupon?.discount_value || 0));
                          } else {
                            // Percentage discount
                            discountedPrice = originalPrice * (1 - (appliedCoupon?.discount_percentage || 0) / 100);
                          }
                          
                          return discountedPrice.toFixed(2);
                        })()}
                      </span>
                      <span className="retention-price-period">/mo</span>
                    </div>
                  </div>
                ) : (
                  <>
                <span>${billingCycle === "yearly" && plan.monthly_equivalent ? Math.round(plan.monthly_equivalent) : plan.price_usd}</span>/
                {billingCycle === "monthly" ? "mo" : "mo"}
                  </>
                )}
              </div>
              <p className="subtitle">{plan.description}</p>
              <button
                className="get-started mb-4 mt-1"
                onClick={() => {
                  if (mySubscription && mySubscription.plan?.id === plan.id) {
                    // Current plan - show Subscribe if trial, do nothing if paid
                    if (
                      mySubscription.trial_info &&
                      mySubscription.trial_info.is_trial
                    ) {
                      handleSubscribe(plan.id);
                    }
                    // If paid subscription, do nothing (button will be disabled)
                  } else if (
                    mySubscription &&
                    mySubscription.trial_info &&
                    mySubscription.trial_info.is_trial
                  ) {
                    // User has trial - show Subscribe for all other plans
                    handleSubscribe(plan.id);
                  } else if (mySubscription && mySubscription.plan) {
                    // User has paid subscription - show plan change
                    handlePlanChange(plan.id);
                  } else {
                    // No subscription - show trial
                    handleSubscribe(plan.id);
                  }
                }}
                disabled={
                  (mySubscription &&
                    mySubscription.plan?.id === plan.id &&
                    !(
                      mySubscription.trial_info &&
                      mySubscription.trial_info.is_trial
                    )) ||
                  processingPlanId === plan.id ||
                  changingPlan
                }
              >
                {(() => {
                  console.log("mySubscription", mySubscription);
                  if (mySubscription && mySubscription.plan?.id === plan.id) {
                    // Current plan - show status
                    if (
                      mySubscription.trial_info &&
                      mySubscription.trial_info.is_trial
                    ) {
                      return processingPlanId === plan.id
                        ? "Processing..."
                        : "Subscribe to Continue";
                    } else {
                      return "Current Plan";
                    }
                  } else if (
                    mySubscription &&
                    mySubscription.trial_info &&
                    mySubscription.trial_info.is_trial
                  ) {
                    // User has trial - show Subscribe for all other plans
                    return processingPlanId === plan.id
                      ? "Processing..."
                      : "Subscribe";
                  } else if (mySubscription && mySubscription.plan) {
                    console.log("changingPlan",changingPlan)
                    console.log("changingPlanId",changingPlanId)
                    console.log("plan.id",plan.id)
                    // User has paid subscription - show plan change
                    return changingPlan && changingPlanId === plan.id
                      ? "Processing..."
                      : plan.billing_cycle === 'yearly'
                      ? "Upgrade"
                      : plan.price_usd > mySubscription.plan.price_usd
                      ? "Upgrade"
                      : "Downgrade";
                  } else {
                     console.log("H!5")
                    // No subscription - show trial
                    return processingPlanId === plan.id
                      ? "Processing..."
                      : "Start Free Trial";
                  }
                })()}
              </button>
            </div>
            <div className="divider" />
            <div className="plan-body">
              <div className="features-title">FEATURES</div>
              <p className="every-thing mb-0 pb-0">
                {plan.name.toLowerCase().includes("basic")
                  ? "Everything you need to get started..."
                  : plan.name.toLowerCase().includes("standard")
                  ? "Everything in Basic, plus..."
                  : "Everything in Standard, plus..."}
              </p>
              <ul className="feature-list pt-3">
                {/* <li className="d-flex">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="19"
                    height="19"
                    viewBox="0 0 19 19"
                    fill="none"
                    style={{ marginRight: "8px" }}
                  >
                    <circle cx="9.5" cy="9.5" r="9.5" fill="#CAFDCA" />
                    <path
                      d="M14 7L7.8125 13L5 10.2727"
                      stroke="#3ABF62"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {plan.images_limit === -1
                    ? "Unlimited* Images"
                    : `${plan.images_limit} Images per month`}
                </li>
                <li className="d-flex">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="19"
                    height="19"
                    viewBox="0 0 19 19"
                    fill="none"
                    style={{ marginRight: "8px" }}
                  >
                    <circle cx="9.5" cy="9.5" r="9.5" fill="#CAFDCA" />
                    <path
                      d="M14 7L7.8125 13L5 10.2727"
                      stroke="#3ABF62"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {plan.content_words_limit === -1
                    ? "Unlimited* Content Words"
                    : `${plan.content_words_limit.toLocaleString()} Content Words`}
                </li>
                <li className="d-flex">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="19"
                    height="19"
                    viewBox="0 0 19 19"
                    fill="none"
                    style={{ marginRight: "8px" }}
                  >
                    <circle cx="9.5" cy="9.5" r="9.5" fill="#CAFDCA" />
                    <path
                      d="M14 7L7.8125 13L5 10.2727"
                      stroke="#3ABF62"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {plan.serp_searches_limit === -1
                    ? "Unlimited* SERP Searches"
                    : `${plan.serp_searches_limit} SERP Searches`}
                </li>
                <li className="d-flex">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="19"
                    height="19"
                    viewBox="0 0 19 19"
                    fill="none"
                    style={{ marginRight: "8px" }}
                  >
                    <circle cx="9.5" cy="9.5" r="9.5" fill="#CAFDCA" />
                    <path
                      d="M14 7L7.8125 13L5 10.2727"
                      stroke="#3ABF62"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  1 Ayrshare Profile
                </li> */}
                {plan?.features?.map((feature, index) => (
                  <li key={index} className="d-flex">
                   <div> <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="19"
                        height="19"
                        viewBox="0 0 19 19"
                        fill="none"
                        style={{ marginRight: "8px" }}
                      >
                        <circle cx="9.5" cy="9.5" r="9.5" fill="#CAFDCA" />
                        <path
                          d="M14 7L7.8125 13L5 10.2727"
                          stroke="#3ABF62"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                    </svg></div>
                    <div> {feature}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Coupon - hide when retention offer is pending */}

     {/*  {!retentionPending && (!mySubscription ||
        (mySubscription.trial_info && mySubscription.trial_info.is_trial)) && (
          <div className="coupon-row">
            <div className="d-flex justify-center align-items-center gap-2">
              <div className="coupon-input">
                <span className="icon">
                  <svg
                    width="22"
                    height="18"
                    viewBox="0 0 22 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9 5V4M9 9.5V8.5M9 14V13M4.2 1H17.8C18.9201 1 19.4802 1 19.908 1.21799C20.2843 1.40973 20.5903 1.71569 20.782 2.09202C21 2.51984 21 3.0799 21 4.2V5.5C19.067 5.5 17.5 7.067 17.5 9C17.5 10.933 19.067 12.5 21 12.5V13.8C21 14.9201 21 15.4802 20.782 15.908C20.5903 16.2843 20.2843 16.5903 19.908 16.782C19.4802 17 18.9201 17 17.8 17H4.2C3.0799 17 2.51984 17 2.09202 16.782C1.71569 16.5903 1.40973 16.2843 1.21799 15.908C1 15.4802 1 14.9201 1 13.8V12.5C2.933 12.5 4.5 10.933 4.5 9C4.5 7.067 2.933 5.5 1 5.5V4.2C1 3.0799 1 2.51984 1.21799 2.09202C1.40973 1.71569 1.71569 1.40973 2.09202 1.21799C2.51984 1 3.0799 1 4.2 1Z"
                      stroke="#8F8F8F"
                      stroke-width="1.7"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Have a coupon code?"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
              </div>
              <button
                className="btn-apply"
                onClick={handleApplyCoupon}
                disabled={couponLoading}
              >
                {couponLoading ? "Applying..." : "Apply"}
              </button>
            </div>
          </div>
        )} */}

      {/* Add-ons */}
      <div className="addons">
        <h3 className="mb-4">Add-ons & Billing Notes</h3>

        {/* Trial User Warning */}
        {mySubscription &&
          mySubscription.trial_info &&
          mySubscription.trial_info.is_trial && (
            <div
              style={{
                backgroundColor: "#E3F2FD",
                border: "1px solid #2196F3",
                borderRadius: "8px",
                padding: "15px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span style={{ color: "#1976D2", fontSize: "18px" }}>ℹ️</span>
                <div>
                  <strong style={{ color: "#1976D2" }}>
                    Trial Account - Add-ons Not Available
                  </strong>
                  <p
                    style={{
                      color: "#1976D2",
                      margin: "5px 0 0 0",
                      fontSize: "14px",
                    }}
                  >
                    Upgrade to a full subscription to unlock add-on purchases
                    and get additional credits.
                  </p>
                </div>
              </div>
            </div>
          )}

        <div className="addons-grid pt-2">
          <div
            className={`addon-card ${
              mySubscription &&
              mySubscription.trial_info &&
              mySubscription.trial_info.is_trial
                ? "disabled"
                : ""
            }`}
            style={{
              opacity:
                mySubscription &&
                mySubscription.trial_info &&
                mySubscription.trial_info.is_trial
                  ? 0.5
                  : 1,
            }}
          >
            <div className="addon-price text-center">$2</div>
            <ul className="feature-list">
              <li className="d-flex align-items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="19"
                  height="19"
                  viewBox="0 0 19 19"
                  fill="none"
                >
                  <circle cx="9.5" cy="9.5" r="9.5" fill="#CAFDCA" />
                  <path
                    d="M14 7L7.8125 13L5 10.2727"
                    stroke="#3ABF62"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <p className="mb-0">Additional 5,000 words/tokens</p>
              </li>
            </ul>
            <button
              className="buy-token mt-2"
              onClick={() => {
                if (
                  !(
                    mySubscription &&
                    mySubscription.trial_info &&
                    mySubscription.trial_info.is_trial
                  )
                ) {
                  handleBuyAddon("content_words");
                }
              }}
              disabled={
                mySubscription &&
                mySubscription.trial_info &&
                mySubscription.trial_info.is_trial
              }
              style={{
                cursor:
                  mySubscription &&
                  mySubscription.trial_info &&
                  mySubscription.trial_info.is_trial
                    ? "not-allowed"
                    : "pointer",
                backgroundColor:
                  mySubscription &&
                  mySubscription.trial_info &&
                  mySubscription.trial_info.is_trial
                    ? "#ccc"
                    : "",
              }}
            >
              {mySubscription &&
              mySubscription.trial_info &&
              mySubscription.trial_info.is_trial
                ? "Upgrade Required"
                : "Buy More Tokens"}
            </button>
          </div>
          <div
            className={`addon-card ${
              mySubscription &&
              mySubscription.trial_info &&
              mySubscription.trial_info.is_trial
                ? "disabled"
                : ""
            }`}
            style={{
              opacity:
                mySubscription &&
                mySubscription.trial_info &&
                mySubscription.trial_info.is_trial
                  ? 0.5
                  : 1,
            }}
          >
            <div className="addon-price text-center">$4</div>
            <ul className="feature-list">
              <li className="d-flex align-items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="19"
                  height="19"
                  viewBox="0 0 19 19"
                  fill="none"
                >
                  <circle cx="9.5" cy="9.5" r="9.5" fill="#CAFDCA" />
                  <path
                    d="M14 7L7.8125 13L5 10.2727"
                    stroke="#3ABF62"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <p className="mb-0">Additional 50 images</p>
              </li>
            </ul>
            <button
              className="buy-token mt-2"
              onClick={() => {
                if (
                  !(
                    mySubscription &&
                    mySubscription.trial_info &&
                    mySubscription.trial_info.is_trial
                  )
                ) {
                  handleBuyAddon("images");
                }
              }}
              disabled={
                mySubscription &&
                mySubscription.trial_info &&
                mySubscription.trial_info.is_trial
              }
              style={{
                cursor:
                  mySubscription &&
                  mySubscription.trial_info &&
                  mySubscription.trial_info.is_trial
                    ? "not-allowed"
                    : "pointer",
                backgroundColor:
                  mySubscription &&
                  mySubscription.trial_info &&
                  mySubscription.trial_info.is_trial
                    ? "#ccc"
                    : "",
              }}
            >
              {mySubscription &&
              mySubscription.trial_info &&
              mySubscription.trial_info.is_trial
                ? "Upgrade Required"
                : "Buy More Tokens"}
            </button>
          </div>
          <div
            className={`addon-card ${
              mySubscription &&
              mySubscription.trial_info &&
              mySubscription.trial_info.is_trial
                ? "disabled"
                : ""
            }`}
            style={{
              opacity:
                mySubscription &&
                mySubscription.trial_info &&
                mySubscription.trial_info.is_trial
                  ? 0.5
                  : 1,
            }}
          >
            <div className="addon-price text-center">$2</div>
            <ul className="feature-list">
              <li className="d-flex align-items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="19"
                  height="19"
                  viewBox="0 0 19 19"
                  fill="none"
                >
                  <circle cx="9.5" cy="9.5" r="9.5" fill="#CAFDCA" />
                  <path
                    d="M14 7L7.8125 13L5 10.2727"
                    stroke="#3ABF62"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <p className="mb-0">Additional 100 Searches</p>
              </li>
            </ul>
            <button
              className="buy-token mt-2"
              onClick={() => {
                if (
                  !(
                    mySubscription &&
                    mySubscription.trial_info &&
                    mySubscription.trial_info.is_trial
                  )
                ) {
                  handleBuyAddon("serp_searches");
                }
              }}
              disabled={
                mySubscription &&
                mySubscription.trial_info &&
                mySubscription.trial_info.is_trial
              }
              style={{
                cursor:
                  mySubscription &&
                  mySubscription.trial_info &&
                  mySubscription.trial_info.is_trial
                    ? "not-allowed"
                    : "pointer",
                backgroundColor:
                  mySubscription &&
                  mySubscription.trial_info &&
                  mySubscription.trial_info.is_trial
                    ? "#ccc"
                    : "",
              }}
            >
              {mySubscription &&
              mySubscription.trial_info &&
              mySubscription.trial_info.is_trial
                ? "Upgrade Required"
                : "Buy More Tokens"}
            </button>
          </div>
        </div>

        <div className="billing-notes bg-transparent shadow-none border-0">
          <div style={{ color: "#737373", fontWeight: "400" }}>
            <span
              style={{
                display: "inline-flex",
                fontSize: "15px",
                // alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                style={{ fill: "#737373", marginTop: "2px" }}
              >
                <path d="M1 21h22L12 2 1 21z" />
                <rect x="11" y="8" width="2" height="6" fill="#fff" />
                <rect x="11" y="16" width="2" height="2" fill="#fff" />
              </svg>
              Top-ups are billed immediately and reset monthly ❌ Unused credits
              do not roll over (images, words, or searches)
            </span>
          </div>
          <div className="mt-2">
            <a href="mailto:contact@simbli.ai" className="contact-sales">
              Contact Our Sales Team
            </a>
          </div>
        </div>
      </div>

      {/* Manage Plan Modal */}
      {showManagePlanModal && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowManagePlanModal(false)}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              padding: "2rem",
              maxWidth: "400px",
              width: "90%",
              maxHeight: "80vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              style={{
                margin: "0 0 1rem 0",
                fontSize: "1.5rem",
                fontWeight: "600",
              }}
            >
              Manage Plan
            </h2>
            <p style={{ margin: "0 0 1.5rem 0", color: "#6c757d" }}>
              Update your plan or billing details
            </p>

            <div
              className="modal-options"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {/* Only show Change Plan for active paid subscriptions, not trials or autopay cancelled */}
              {mySubscription &&
                mySubscription.plan &&
                !(
                  mySubscription.trial_info &&
                  mySubscription.trial_info.is_trial
                ) &&
                !mySubscription.autopay_cancelled && (
                  <button
                    onClick={() => {
                      setShowManagePlanModal(false);
                      // Scroll to plans section
                      document
                        .querySelector(".plans-grid")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "1rem",
                      border: "1px solid #e9ecef",
                      borderRadius: "8px",
                      backgroundColor: "white",
                      cursor: "pointer",
                      fontSize: "1rem",
                      fontWeight: "500",
                      textAlign: "left",
                      width: "100%",
                    }}
                    onMouseOver={(e) =>
                      (e.target.style.backgroundColor = "#f8f9fa")
                    }
                    onMouseOut={(e) =>
                      (e.target.style.backgroundColor = "white")
                    }
                  >
                    <span>Change Plan</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                )}

              {/* Show Reactivate option for cancelled subscriptions */}
              {mySubscription && mySubscription.autopay_cancelled && (
                <button
                  onClick={() => {
                    setShowManagePlanModal(false);
                    // Scroll to plans section for reactivation
                    document
                      .querySelector(".plans-grid")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem",
                    border: "1px solid #28a745",
                    borderRadius: "8px",
                    backgroundColor: "#f8fff9",
                    cursor: "pointer",
                    fontSize: "1rem",
                    fontWeight: "500",
                    textAlign: "left",
                    width: "100%",
                    color: "#28a745",
                  }}
                  onMouseOver={(e) =>
                    (e.target.style.backgroundColor = "#e8f5e8")
                  }
                  onMouseOut={(e) =>
                    (e.target.style.backgroundColor = "#f8fff9")
                  }
                >
                  <span>Reactivate Subscription</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              )}

              <button
                onClick={() => {
                  setShowManagePlanModal(false);

                  // Navigate after modal closes to avoid interruption (SPA navigation)
                  setTimeout(() => {
                    try {
                      const ts = Date.now();
                      onNavigateToInvoice();
                      // navigate(`/dashboard?tab=invoice&ts=${ts}`, {
                      // replace: false,
                      // });
                      // Also explicitly signal tab change for robustness
                      setTimeout(() => {
                        try {
                          const event = new CustomEvent("changeTab", {
                            detail: { tab: "invoice" },
                          });
                          window.dispatchEvent(event);
                        } catch (_) {}
                      }, 100);
                      // After dashboard picks up the tab, remove the URL param (give ample time)
                      setTimeout(() => {
                        try {
                          const url = new URL(window.location.href);
                          if (url.pathname === "/dashboard") {
                            url.searchParams.delete("tab");
                            url.searchParams.delete("ts");
                            window.history.replaceState({}, "", url.toString());
                          }
                        } catch (_) {}
                      }, 800);
                    } catch (_) {
                      const ts = Date.now();
                      onNavigateToInvoice();
                      // navigate(`/dashboard?tab=invoice&ts=${ts}`, {
                      // replace: false,
                      // });
                    }
                  }, 50);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem",
                  border: "1px solid #e9ecef",
                  borderRadius: "8px",
                  backgroundColor: "white",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: "500",
                  textAlign: "left",
                  width: "100%",
                }}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#f8f9fa")
                }
                onMouseOut={(e) => (e.target.style.backgroundColor = "white")}
              >
                <span>View Invoices</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>

              {/* Only show Cancel Subscription option if autopay is not cancelled */}
              {mySubscription && !mySubscription.autopay_cancelled && (
                <button
                  onClick={() => {
                    setShowManagePlanModal(false);
                    handleCancelSubscription();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem",
                    border: "1px solid #e9ecef",
                    borderRadius: "8px",
                    backgroundColor: "white",
                    cursor: "pointer",
                    fontSize: "1rem",
                    fontWeight: "500",
                    textAlign: "left",
                    width: "100%",
                    color: "#dc3545",
                  }}
                  onMouseOver={(e) =>
                    (e.target.style.backgroundColor = "#f8f9fa")
                  }
                  onMouseOut={(e) => (e.target.style.backgroundColor = "white")}
                >
                  <span>Cancel Subscription</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              )}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "2rem",
              }}
            >
              <button
                onClick={() => setShowManagePlanModal(false)}
                style={{
                  backgroundColor: "#28a745",
                  color: "white",
                  border: "none",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight: "500",
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Cancellation Popup */}
      <CancellationPopup
        isOpen={showCancellationPopup}
        onClose={() => setShowCancellationPopup(false)}
        onContinue={handleCancellationContinue}
        onTalkToSupport={handleCancellationSupport}
        reasons={cancellationReasons}
        selectedReasonId={selectedCancelReasonId}
        onReasonSelect={handleCancellationReasonSelect}
        selectedComment={selectedCancelComment}
        onCommentChange={handleCancellationCommentChange}
      />

      {/* Retention Offer Popup */}
      <RetentionOfferPopup
        isOpen={showRetentionOffer}
        onClose={() => setShowRetentionOffer(false)}
        onAcceptOffer={handleRetentionOfferAccept}
        onContinueCancellation={handleRetentionOfferContinue}
        offerAlreadyApplied={retentionPending}
      />
      {console.log('BillingNewCode - Rendering RetentionOfferPopup with offerAlreadyApplied:', retentionPending)}

      {/* Cancel Confirmation Popup */}
      <CancelConfirmationPopup
        isOpen={showCancelConfirmation}
        onClose={() => setShowCancelConfirmation(false)}
        onKeepPlan={handleKeepPlan}
        onCancelSubscription={handleConfirmCancellation}
        title={cancelConfirmationData?.title || ""}
        message={cancelConfirmationData?.message || ""}
        confirmText={cancelConfirmationData?.confirmText || ""}
        isTrial={cancelConfirmationData?.isTrial || false}
      />

      {/* Retention Success Popup */}
      <RetentionSuccessPopup
        isOpen={showRetentionSuccess}
        onClose={() => setShowRetentionSuccess(false)}
        onGoToDashboard={handleGoToDashboard}
        onExploreFeatures={handleExploreFeatures}
        currentPlan={mySubscription?.plan}
        discountPercentage={50}
        currency={currency}
      />

      {/* Subscription Cancelled Popup */}
      <SubscriptionCancelledPopup
        isOpen={showSubscriptionCancelled}
        onClose={() => setShowSubscriptionCancelled(false)}
        onReactivateSubscription={handleReactivateSubscription}
        onGoToHome={handleGoToHome}
        onContactSupport={handleContactSupport}
      />
    </div>
  );
};

export default BillingNewCode;
