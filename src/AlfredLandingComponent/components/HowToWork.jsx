import React, { useState,useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import Swal from "sweetalert2";
import "./style.css";
import Time from "../assets/images/Time.svg";
import Handbag from "../assets/images/Handbag.svg";
import Connect from "../assets/images/Connect.svg";
import ProfileBtn from "../assets/images/ProfileBtn.svg";
import FaceBook from "../assets/images/FaceBook.svg";
import Google from "../assets/images/Google.svg";
import LinkedIn from "../assets/images/LinkedIn.svg";
import Twitter from "../assets/images/Twitter.svg";
import Booked from "../assets/images/Booked.svg";
import DashMail from "../assets/images/DashMail.svg";
import Rocket from "./rocket";
import { useLocation, useNavigate } from "react-router-dom";
import { BASE_URL, verifySubscriptionAuthenticationApi } from "../../api/api";
import Loadings from "../../assets/simbli_loader.gif";

const HowToWork = ({ onLogin,onSubscribe }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [allPlans, setAllPlans] = useState({ monthly: [], yearly: [] });
  const [activeTab, setActiveTab] = useState("monthly");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const handleLogin = (planId) => {
    if (onLogin) {
      onLogin(planId);
    }
  };
 
 


 
   
  // Billing-related state
  const [mySubscription, setMySubscription] = useState(null);
  const [subscribing, setSubscribing] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState(null);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  console.log("mySubscription",mySubscription)
  // Currency detection state
  const [currency, setCurrency] = useState("INR");
  const [countryCode, setCountryCode] = useState("IN");

  // Payment flow state
  const [orderData, setOrderData] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [autoSubscribeLoading, setAutoSubscribeLoading] = useState(false);

  // Card interaction state
  const [activeCardIndex, setActiveCardIndex] = useState(1); // Default to Standard plan (index 1)
  const [hoveredCardIndex, setHoveredCardIndex] = useState(null);

  // Track if we've already processed the planId from URL to prevent multiple calls
  const processedPlanIdRef = useRef(null);

  // Helper function to remove planId from URL query parameters
  const removePlanIdFromUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete("planId");
    window.history.replaceState({}, "", url.pathname + url.search);
  };

  const fetchSubscriptionPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      const [monthlyRes, yearlyRes] = await Promise.all([
        fetch(
          `${BASE_URL}/subscription/plans?billing_cycle=monthly&country_code=${countryCode}`
        ),
        fetch(
          `${BASE_URL}/subscription/plans?billing_cycle=yearly&country_code=${countryCode}`
        ),
      ]);

      const monthlyData = await monthlyRes.json();
      const yearlyData = await yearlyRes.json();

      const transformPlans = (plans, cycle) =>
        plans.map((plan) => {
          // For yearly plans, display monthly-equivalent (rounded) like billing pages
          const displayAmount =
            cycle === "yearly"
              ? (plan.monthly_equivalent
                ? Math.round(plan.monthly_equivalent)
                : Math.round(plan.price_usd / 12))
              : Math.round(plan.price_usd);

          return {
            planType: plan.name.replace(
              ` - ${cycle.charAt(0).toUpperCase() + cycle.slice(1)}`,
              ""
            ),
            price: `$${displayAmount}`,
            period: cycle === "monthly" ? "month" : "mo",
            description: plan.description,
            buttonName:
              cycle === "monthly" ? "Start Free Trial" : "Start Annual Plan",
            features: plan.features,
            apiData: plan,
          };
        });

      setAllPlans({
        monthly: monthlyData.plans
          ? transformPlans(monthlyData.plans, "monthly")
          : [],
        yearly: yearlyData.plans
          ? transformPlans(yearlyData.plans, "yearly")
          : [],
      });
    } catch (err) {
      setError(err.message);
      console.error("Error fetching subscription plans:", err);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch user's subscription
  const fetchMySubscription = async () => {
    try {
      const token = localStorage.getItem("access-token");
      if (!token) return null;

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
        removePlanIdFromUrl();
        return data.subscription;
      } else {
        setMySubscription(null);
        return null;
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
      setMySubscription(null);
      return null;
    }
  };
  console.log("mySubscription", mySubscription);
  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        if (window.Razorpay) {
          setRazorpayLoaded(true);
          resolve(true);
          return;
        }

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => {
          setRazorpayLoaded(true);
          resolve(true);
        };
        script.onerror = () => {
          console.error("Failed to load Razorpay script");
          resolve(false);
        };
        document.body.appendChild(script);
      });
    };

    loadRazorpayScript();
  }, []);

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

  // Fetch plans on component mount and when country changes
  useEffect(() => {
    fetchSubscriptionPlans();
    if (user) {
      fetchMySubscription();
    }
  }, [user, countryCode]);


  // Auto-subscribe when planId is present in URL params
  // Only trigger for users with NO subscription (no trial, no paid plan)
  useEffect(() => {
    console.log("mySubscription",mySubscription)
    // Extract planId from URL inside the effect to ensure it's reactive
    const params = new URLSearchParams(window.location.search);
    const planIdValue = params.get("planId");
    
    // Comprehensive check for any subscription (trial or paid)
    const hasPlan = mySubscription && mySubscription.plan;
    const hasTrialInfo = mySubscription && mySubscription.trial_info;
    const isTrial = hasTrialInfo && (mySubscription.trial_info.is_trial === true || mySubscription.trial_info.is_trial === "true");
    const hasSubscriptionId = mySubscription && mySubscription.subscription_id;
    const hasAnySubscription = hasPlan || isTrial || hasSubscriptionId;
    
    console.log("🔍 Auto-subscribe effect check:", {
      planIdValue,
      razorpayLoaded,
      windowRazorpay: !!window.Razorpay,
      user: !!user,
      mySubscription: mySubscription,
      hasPlan,
      hasTrialInfo,
      isTrial,
      hasSubscriptionId,
      hasAnySubscription,
      processedPlanId: processedPlanIdRef.current
    });

    // IMPORTANT: Check subscription FIRST - don't show loader if user has subscription
    if (hasAnySubscription && planIdValue) {
      console.log("ℹ️ User has subscription, stopping loader immediately");
      setAutoSubscribeLoading(false);
    } else if (planIdValue && processedPlanIdRef.current !== planIdValue) {
      // Only show loader if user has NO subscription
      const waitingForUser = !user;
      const waitingForRazorpay = !razorpayLoaded || !window.Razorpay;
      
      // Show loader ONLY if waiting for conditions AND user has no subscription
      if ((waitingForUser || waitingForRazorpay || (!hasAnySubscription && user && razorpayLoaded && window.Razorpay)) && !hasAnySubscription) {
        setAutoSubscribeLoading(true);
      } else {
        setAutoSubscribeLoading(false);
      }
    } else if (!planIdValue) {
      // No planId in URL, stop loading
      setAutoSubscribeLoading(false);
    }

    // Only proceed if ALL conditions are met:
    // 1. planId exists in URL
    // 2. Razorpay is loaded (both state and actual window object)
    // 3. User is logged in
    // 4. User has NO subscription (no plan, no trial, no subscription_id)
    // 5. We haven't already processed this planId
    console.log("mySubscription", mySubscription);
    
    if (
      planIdValue && 
      razorpayLoaded && 
      window.Razorpay &&
      user && // User must be logged in
      !hasAnySubscription && // User has NO subscription (no plan, no trial)
      processedPlanIdRef.current !== planIdValue // Haven't processed this planId yet
    ) {
      console.log("✅ All conditions met - User has no subscription, calling handleSubscribe:", planIdValue);
      processedPlanIdRef.current = planIdValue; // Mark as processed
      handleSubscribe(Number(planIdValue), true);
    } else {
      if (planIdValue && !user) {
        console.log("⚠️ planId found but user not logged in, waiting for login...");
      } else if (planIdValue && hasAnySubscription) {
        console.log("ℹ️ planId found but user already has a subscription (trial or paid), skipping auto-subscribe");
        setAutoSubscribeLoading(false); // Stop loading - user has subscription
      } else if (planIdValue && (!razorpayLoaded || !window.Razorpay)) {
        console.log("⚠️ planId found but Razorpay not loaded yet, waiting...");
      } else if (planIdValue && processedPlanIdRef.current === planIdValue) {
        console.log("ℹ️ planId already processed, skipping:", planIdValue);
        setAutoSubscribeLoading(false); // Stop loading - already processed
      }
    }
  }, [location.search, razorpayLoaded, user,mySubscription]); // Track URL changes, razorpay, user, and subscription status

  // RazorPay payment handling functions
  const handleSubscribe = async (planId,cameInLogin) => {
    console.log("cameInLogin",cameInLogin)
    console.log("handleSubscribe called with planId:", planId);
    console.log("🔍 Checking subscription status - mySubscription:", mySubscription);

    if (!user && !cameInLogin) {
      console.log("user not found, calling handleLogin")
      // alert("Please login to start a free trial");
      // return;
      handleLogin(planId);
      return;
    }

    // IMPORTANT: Always fetch subscription FIRST before any loading states
    // This prevents unnecessary loading if user already has a subscription
    let currentSubscription = mySubscription;
    if (user) {
      console.log("🔄 Fetching latest subscription data before proceeding...");
      currentSubscription = await fetchMySubscription();
      // Also update state reference
      if (currentSubscription) {
        setMySubscription(currentSubscription);
      }
    }

    // Check if user already has a subscription (trial or paid) - if yes, don't open Razorpay
    // More comprehensive check to handle different subscription structures
    const hasPlan = currentSubscription && currentSubscription.plan;
    const hasTrialInfo = currentSubscription && currentSubscription.trial_info;
    const isTrial = hasTrialInfo && (currentSubscription.trial_info.is_trial === true || currentSubscription.trial_info.is_trial === "true");
    const hasSubscriptionId = currentSubscription && currentSubscription.subscription_id;
    const hasAnySubscription = hasPlan || isTrial || hasSubscriptionId;
    
    console.log("🔍 Subscription check results:", {
      hasPlan,
      hasTrialInfo,
      isTrial,
      hasSubscriptionId,
      hasAnySubscription,
      currentSubscriptionFull: JSON.stringify(currentSubscription)
    });
    
    // CRITICAL: Check subscription BEFORE setting any loading states
    if (hasAnySubscription) {
      console.log("⚠️ User already has a subscription (trial or paid), preventing Razorpay from opening");
      setAutoSubscribeLoading(false);
      setLoadingPlanId(null);
      return; // Exit early - no loading, no API calls
    }

    // Only set loading states if user has NO subscription
    if (!razorpayLoaded) {
      // alert("Payment system is loading. Please try again in a moment.");
      return;
    }

    // Safe to set loading now - user has no subscription
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
            country_code: countryCode, // Use detected country code
            currency: currency, // Send currency preference (e.g., "USD" for VPN users)
          }),
        }
      );

      const data = await trialResponse.json();

      console.log("Trial response:", data);
      console.log("Response status:", trialResponse.status);

      if (data.status !== "success") {
        console.error("Trial endpoint error:", data);
        setAutoSubscribeLoading(false); // Stop loader on error
        // alert(
        //   "Failed to start free trial: " + (data.detail || "Unknown error")
        // );
        return;
      }

      // PRIORITY 1: Use subscription_id with Razorpay checkout.js (works even when start_at is set)
      // This is more reliable than short_url when start_at is set
      if (data.subscription_id && data.razorpay_key) {
        console.log("✅ Using subscription_id with Razorpay checkout:", data.subscription_id);
        console.log("✅ With start_at set, Razorpay will show 'Subscription starts on [date]'");
        // Open Razorpay checkout for subscription authorization directly (no confirmation)
        const options = {
          key: data.razorpay_key,
          subscription_id: data.subscription_id,
          name: "Alfred Social Media Agent",
          description: `Free Trial - ${data.trial_info?.plan_name || "Plan"}`,
          prefill: {
            name: user?.username || "User",
            email: user?.email || "",
          },
          theme: {
            color: "#17a2b8",
          },
          handler: async function (response) {
            setPaymentProcessing(true)
            console.log("Subscription authorized:", response);
            // Verify and store subscription immediately after authentication
            try {
              const subscriptionId = data.subscription_id;
              console.log("Verifying subscription authentication:", subscriptionId);
              
              const verifyResponse = await verifySubscriptionAuthenticationApi({
                subscription_id: subscriptionId
              });
              
              console.log("Subscription verification response:", verifyResponse.data);
              
              if (verifyResponse.data.status === "success") {
                setPaymentProcessing(false);
                console.log("✅ Subscription stored in database immediately");
                Swal.fire({
                  title: "🎉 Authorization Complete!",
                  text: "Your subscription has been authorized and stored. Trial will start shortly.",
                  icon: "success",
                  timer: 4000,
                  timerProgressBar: true,
                  
                  confirmButtonText: "Great!",
                }).then(() => {
                  fetchMySubscription();
                  navigate("/dashboard");
                });
              } else {
                setPaymentProcessing(false);
                console.warn("⚠️ Subscription verification returned:", verifyResponse.data);
                // Still proceed - webhook will handle it
            Swal.fire({
              title: "🎉 Authorization Complete!",
              text: "Your subscription has been authorized. Trial will start shortly.",
              icon: "success",
                  timer: 4000,
                  timerProgressBar: true,
              confirmButtonText: "Great!",
            }).then(() => {
              fetchMySubscription();
              navigate("/dashboard");
            });
              }
            } catch (verifyErr) {
              setPaymentProcessing(false);
              console.error("Error verifying subscription:", verifyErr);
              // Still proceed - webhook will handle it
              Swal.fire({
                title: "🎉 Authorization Complete!",
                text: "Your subscription has been authorized. Trial will start shortly.",
                icon: "success",
                timer: 4000,
                timerProgressBar: true,
                confirmButtonText: "Great!",
              }).then(() => {
                fetchMySubscription();
                navigate("/dashboard");
              });
            }
          },
          modal: {
            ondismiss: function() {
              console.log("Subscription authorization cancelled");
              Swal.fire({
                title: "Authorization Cancelled",
                text: "You can authorize later to start your trial.",
                icon: "info",
                confirmButtonText: "OK",
              });
            }
          }
        };
        
        // FINAL CHECK: Re-fetch subscription right before opening Razorpay to prevent race conditions
        if (user) {
          const latestSubscription = await fetchMySubscription();
          if (latestSubscription) {
            const hasPlan = latestSubscription.plan;
            const hasTrial = latestSubscription.trial_info && latestSubscription.trial_info.is_trial;
            const hasSubId = latestSubscription.subscription_id;
            if (hasPlan || hasTrial || hasSubId) {
              console.log("🚫 FINAL CHECK: User has subscription, blocking Razorpay from opening");
              setAutoSubscribeLoading(false);
              setLoadingPlanId(null);
              return;
            }
          }
        }
        
        if (window.Razorpay) {
          const rzp = new window.Razorpay(options);
          setAutoSubscribeLoading(false); // Stop loader when Razorpay modal opens
          rzp.open(); // Open directly without confirmation
          removePlanIdFromUrl(); // Remove planId from URL after opening Razorpay
        } else {
          console.error("Razorpay not loaded");
          setAutoSubscribeLoading(false); // Stop loader on error
          Swal.fire({
            title: "Error",
            text: "Payment system not loaded. Please refresh and try again.",
            icon: "error",
          });
        }
        return;
      }
      
      // PRIORITY 2: Fallback to short_url (if subscription_id method not available)
      // Open in popup instead of redirecting
      if (data.short_url) {
        // FINAL CHECK: Re-fetch subscription right before opening popup to prevent race conditions
        if (user) {
          const latestSubscription = await fetchMySubscription();
          if (latestSubscription) {
            const hasPlan = latestSubscription.plan;
            const hasTrial = latestSubscription.trial_info && latestSubscription.trial_info.is_trial;
            const hasSubId = latestSubscription.subscription_id;
            if (hasPlan || hasTrial || hasSubId) {
              console.log("🚫 FINAL CHECK: User has subscription, blocking Razorpay popup from opening");
              setAutoSubscribeLoading(false);
              setLoadingPlanId(null);
              return;
            }
          }
        }
        
        console.log("✅ Using short_url for authorization (opening in popup):", data.short_url);
        // Open short_url in popup window (not redirect)
        const popup = window.open(
          data.short_url,
          'RazorpayAuthorization',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        );
        
        if (!popup) {
          // Popup blocked - show error
          setAutoSubscribeLoading(false); // Stop loader if popup blocked
          Swal.fire({
            title: "Popup Blocked",
            text: "Please allow popups for this site to complete authorization, or click the link below.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Open Authorization Link",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#17a2b8"
          }).then((result) => {
            if (result.isConfirmed) {
              window.open(data.short_url, '_blank');
            }
          });
          return;
        }
        
        setAutoSubscribeLoading(false); // Stop loader when popup opens successfully
        removePlanIdFromUrl(); // Remove planId from URL after opening Razorpay popup
        
        // Check if popup is closed (user completed authorization)
        const checkPopup = setInterval(async () => {
          if (popup.closed) {
            clearInterval(checkPopup);
            console.log("✅ Popup closed - verifying subscription authentication");
            // Verify and store subscription immediately after authentication
            try {
              const subscriptionId = data.subscription_id;
              if (subscriptionId) {
                console.log("Verifying subscription authentication:", subscriptionId);
                
                const verifyResponse = await verifySubscriptionAuthenticationApi({
                  subscription_id: subscriptionId
                });
                
                console.log("Subscription verification response:", verifyResponse.data);
                
                if (verifyResponse.data.status === "success") {
                  console.log("✅ Subscription stored in database immediately");
                } else {
                  console.warn("⚠️ Subscription verification returned:", verifyResponse.data);
                }
              }
            } catch (verifyErr) {
              console.error("Error verifying subscription:", verifyErr);
              // Still proceed - webhook will handle it
            }
            
            // Refresh subscription after a delay to check if authorized
            setTimeout(() => {
              fetchMySubscription();
              navigate("/dashboard");
            }, 2000);
          }
        }, 1000);
        
        return;
      }

      // Fallback to old flow (should not happen for trials, but keeping for compatibility)
      if (data.order) {
        // FINAL CHECK: Re-fetch subscription right before opening old Razorpay modal
        if (user) {
          const latestSubscription = await fetchMySubscription();
          if (latestSubscription) {
            const hasPlan = latestSubscription.plan;
            const hasTrial = latestSubscription.trial_info && latestSubscription.trial_info.is_trial;
            const hasSubId = latestSubscription.subscription_id;
            if (hasPlan || hasTrial || hasSubId) {
              console.log("🚫 FINAL CHECK: User has subscription, blocking old Razorpay modal from opening");
              setAutoSubscribeLoading(false);
              setLoadingPlanId(null);
              return;
            }
          }
        }
        
        console.log("⚠️ No short_url found, using old order flow");
        setOrderData(data);
        setSelectedPlan(planId);
        // Open Razorpay payment modal
        openRazorpayModal(data, planId);
      } else {
        console.error("❌ No short_url or order found in response");
        setAutoSubscribeLoading(false); // Stop loader on error
        Swal.fire({
          title: "Error",
          text: "Failed to start trial: No authorization URL found",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } catch (err) {
      // alert("Error starting free trial: " + err.message);
      console.error("Error starting free trial:", err);
      setAutoSubscribeLoading(false); // Stop loader on error
    } finally {
      setLoadingPlanId(null);
    }
  };

  // Open Razorpay payment modal
  const openRazorpayModal = (orderData, planId) => {
    console.log("openRazorpayModal called with planId:", planId);
    console.log("orderData:", orderData);
    console.log("🔧 Razorpay options - Amount:", orderData.order.amount, "Currency:", orderData.order.currency);
    console.log("🌍 Frontend detected currency:", currency);

    // Force currency override if needed
    let finalCurrency = orderData.order.currency || currency;
    let finalAmount = orderData.order.amount;

    // If user wants USD but Razorpay returned INR, try to force USD
    if (currency === "USD" && orderData.order.currency === "INR") {
      console.log("🔄 Attempting to force USD currency for USA VPN user");
      finalCurrency = "USD";
      // Convert INR amount to USD (approximate)
      finalAmount = Math.max(1, Math.round(orderData.order.amount / 83)); // Rough conversion
      console.log("🔄 Converted amount:", orderData.order.amount, "INR ->", finalAmount, "USD cents");
    }

    console.log("🔧 Final Razorpay options - Amount:", finalAmount, "Currency:", finalCurrency);

    const paymentMethods = {
      card: true,
      upi: true,
      netbanking: false,
      wallet: false
    };

    const options = {
      key: orderData.razorpay_key,
      amount: finalAmount,
      currency: finalCurrency,
      name: "Alfred Social Media Agent",
      description: `Free Trial - ${orderData.trial_info?.plan_name || "Plan"}`,
      order_id: orderData.order.id,
      handler: (response) => handlePaymentSuccess(response, planId),
      prefill: {
        name: user?.username || "",
        email: user?.email || "",
      },
      theme: {
        color: "#17a2b8",
      },
      method: paymentMethods,
      modal: {
        ondismiss: handlePaymentCancel,
      },
    };

    const razorpay = new window.Razorpay(options);
    razorpay.on("payment.failed", handlePaymentError);
    setAutoSubscribeLoading(false); // Stop loader when Razorpay modal opens
    razorpay.open();
    removePlanIdFromUrl(); // Remove planId from URL after opening Razorpay
  };

  const handlePaymentSuccess = async (response, planId) => {
    console.log("Trial payment successful:", response);
    console.log("Plan ID for verification:", planId);
    // Show loading state
    setPaymentProcessing(true);

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
            plan_id: planId,
          }),
        }
      );

      const verifyData = await verifyResponse.json();

      if (verifyData.status === "success") {
        // Check onboarding status after successful trial
        const onboardingResponse = await fetch(
          `${BASE_URL}/onboarding/check`,
           {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

        const onboardingData = await onboardingResponse.json();
        // Hide loading state before showing success modal
        setPaymentProcessing(false);
        Swal.fire({
          title: "🎉 Trial Started!",
          text: "Free trial started successfully! You have 7 days to explore all features. Auto-pay will be enabled after the trial period.",
          icon: "success",
          confirmButtonText: "Great!",
          timer: 4000,
          timerProgressBar: true,
          showConfirmButton: true,
        }).then(() => {
          // Refresh subscription data
          fetchMySubscription();
          // Clear payment state
          setOrderData(null);
          setSelectedPlan(null);
          console.log("onboardingData", onboardingData);
          // Navigate based on onboarding status
          if (!onboardingData.is_completed) {
            console.log(
              "onboardingData.is_completed",
              onboardingData.is_completed
            );
            console.log("Hii");
            // Show onboarding screen
            // window.location.href = "/dashboard";
            navigate("/dashboard");
          } else {
            // Go directly to dashboard
            navigate("/dashboard");
          }
        });
      } else {
        // Hide loading state before showing error modal
        setPaymentProcessing(false);
        Swal.fire({
          title: "Verification Failed",
          timer: 4000,
          timerProgressBar: true,
          text:
            "Trial verification failed: " +
            (verifyData.detail || "Unknown error"),
          icon: "error",
          confirmButtonText: "Try Again",
        });
      }
    } catch (err) {
      console.error("Error verifying trial payment:", err);
      // Hide loading state before showing error modal
      setPaymentProcessing(false);
      Swal.fire({
        title: "Error",
        text: "Error verifying trial payment. Please contact support.",
        timer: 4000,
        timerProgressBar: true,
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const handlePaymentError = (error) => {
    console.error("Payment error:", error);
    Swal.fire({
      title: "Payment Failed",
      timer: 4000,
      timerProgressBar: true,
      text: "Payment failed: " + error.description || "Unknown error",
      icon: "error",
      confirmButtonText: "Try Again",
    });
  };

  const handlePaymentCancel = () => {
    console.log("Payment cancelled");
    setOrderData(null);
    setSelectedPlan(null);
  };

  const proceedToPayment = async () => {
    if (!selectedPlan) {
      Swal.fire({
        title: "No Plan Selected",
        text: "Please select a plan first.",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }

    try {
      // Proceed with subscription creation
      await handleSubscribe(selectedPlan);
    } catch (err) {
      console.error("Error proceeding to payment:", err);
      Swal.fire({
        title: "Error",
        text: "Error proceeding to payment. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const handlePlanChange = async (newPlanId) => {
    // Find the new plan details
    const newPlan = allPlans.find((plan) => plan.apiData?.id === newPlanId);
    const currentPlan = mySubscription?.plan;

    if (!newPlan || !currentPlan) {
      console.error("Plan not found");
      return;
    }

    const isUpgrade = newPlan.apiData.price_usd > currentPlan.price_usd;
    const action = isUpgrade ? "upgrade" : "downgrade";

    // Show SweetAlert confirmation
    const result = await Swal.fire({
      title: `${isUpgrade ? "⬆Upgrade" : "⬇ Downgrade"} Plan?`,
      html: `
        <div style="text-align: left; margin: 20px 0;">
          <p><strong>Current Plan:</strong> ${currentPlan.name} ($${
        currentPlan.price_usd
      }/month)</p>
          <p><strong>New Plan:</strong> ${newPlan.apiData.name} ($${
        newPlan.apiData.price_usd
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
          timer: 4000,
          timerProgressBar: true,
        });
        fetchMySubscription(); // Refresh subscription data
      } else {
        await Swal.fire({
          title: "Error",
          text:
            "Failed to change plan: " +
            (data.detail || data.message || "Unknown error"),
          icon: "error",
          timer: 4000,
          timerProgressBar: true,
          confirmButtonColor: "#dc3545",
        });
      }
    } catch (err) {
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
    }
  };

  const featuresDays = [
    { text: "7 - Day Free Trial" },
    { text: "Cancel Anytime" },
    { text: "No Hidden Fees" },
  ];

  return (
    <>
      {/* Auto-Subscribe Loader - Shows while waiting for conditions and until Razorpay opens */}
      {autoSubscribeLoading && !paymentProcessing && (
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
            zIndex: 9998,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "white",
              padding: "30px",
              borderRadius: "10px",
              textAlign: "center",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
            }}
          >
            <img src={Loadings} className="w-12 h-12" alt="Loading" />
            <h4 style={{ margin: "5px 0 10px", color: "#333" }}>
              Loading...
            </h4>
           
          </div>
        </div>
      )}

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
            <img src={Loadings} className="w-12 h-12"/>
            <h4 style={{ margin: "5px 0 10px", color: "#333" }}>
              Processing Payment...
            </h4>
            <p style={{ margin: 0, color: "#666" }}>
              Please wait while we verify your payment
            </p>
          </div>
        </div>
      )}

      <div className="container-fluid Whole_div pt-5 mt-lg-4">
        <p className="text-center How_Works mb-0">
          How Alfred Works in 3 Simple Steps
        </p>
        <p className="text-center Get_Started">
          Get started in minutes and transform your social media presence with
          AI-powered automation
        </p>
        <div className="row g-3 mt-4 ">
          <div className="col-lg-4">
            <div className="Business_Bg px-4 pe-5 py-4 alfred-bgss">
              <img src={Handbag} className="img-fluid" alt="" />
              <p className="TellUs mb-0 mt-3">Connect your Social Accounts</p>
              <p className="No_prompt mt-2">
                Securely link your LinkedIn, Instagram, X, and Facebook accounts
                in just a few clicks.
              </p>
              <div className="Icons_Bg d-flex align-items-center justify-content-start gap-2 py-3 px-3">
                {/* <img src={Google} className="img-fluid" alt="" /> */}
                <svg
                  width="37"
                  height="37"
                  viewBox="0 0 37 37"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="18.5" cy="18.5" r="18.5" fill="#F3F3F3" />
                  <g clip-path="url(#clip0_0_241)">
                    <path
                      d="M27.1908 9H10.8092C9.81 9 9 9.81 9 10.8092V27.1908C9 28.19 9.81 29 10.8092 29H27.1908C28.19 29 29 28.19 29 27.1908V10.8092C29 9.81 28.19 9 27.1908 9ZM15.1888 26.2693C15.1888 26.5601 14.9531 26.7958 14.6624 26.7958H12.4212C12.1304 26.7958 11.8947 26.5601 11.8947 26.2693V16.8745C11.8947 16.5837 12.1304 16.348 12.4212 16.348H14.6624C14.9531 16.348 15.1888 16.5837 15.1888 16.8745V26.2693ZM13.5418 15.4624C12.3659 15.4624 11.4127 14.5092 11.4127 13.3333C11.4127 12.1574 12.3659 11.2042 13.5418 11.2042C14.7176 11.2042 15.6709 12.1574 15.6709 13.3333C15.6709 14.5092 14.7177 15.4624 13.5418 15.4624ZM26.901 26.3117C26.901 26.5791 26.6843 26.7958 26.417 26.7958H24.012C23.7447 26.7958 23.528 26.5791 23.528 26.3117V21.905C23.528 21.2476 23.7208 19.0243 21.81 19.0243C20.3279 19.0243 20.0272 20.5461 19.9669 21.2291V26.3117C19.9669 26.5791 19.7502 26.7958 19.4828 26.7958H17.1568C16.8895 26.7958 16.6727 26.5791 16.6727 26.3117V16.8321C16.6727 16.5648 16.8895 16.348 17.1568 16.348H19.4828C19.7501 16.348 19.9669 16.5648 19.9669 16.8321V17.6517C20.5164 16.827 21.3332 16.1904 23.0722 16.1904C26.9231 16.1904 26.901 19.7881 26.901 21.7648V26.3117Z"
                      fill="#064CCF"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_0_241">
                      <rect
                        width="20"
                        height="20"
                        fill="white"
                        transform="translate(9 9)"
                      />
                    </clipPath>
                  </defs>
                </svg>

                <svg
                  width="37"
                  height="37"
                  viewBox="0 0 37 37"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="18.5" cy="18.5" r="18.5" fill="#F3F3F3" />
                  <path
                    d="M24.5387 9H27.7589L20.7238 17.0482L29 28H22.5198L17.4443 21.3578L11.6368 28H8.41469L15.9394 19.3915L8 9H14.6447L19.2325 15.0712L24.5387 9ZM23.4086 26.0708H25.1929L13.6751 10.8279H11.7604L23.4086 26.0708Z"
                    fill="black"
                  />
                </svg>
                <svg
                  width="37"
                  height="37"
                  viewBox="0 0 37 37"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="18.5" cy="18.5" r="18.5" fill="#F3F3F3" />
                  <g clip-path="url(#clip0_1497_130)">
                    <path
                      d="M19.0049 8.15234C14.8926 8.15234 13.6899 8.15659 13.4561 8.17598C12.6122 8.24613 12.087 8.37901 11.5149 8.66386C11.074 8.8828 10.7263 9.13659 10.3832 9.49234C9.75818 10.1411 9.3794 10.9393 9.24228 11.8881C9.17562 12.3487 9.15622 12.4426 9.15228 14.7954C9.15077 15.5796 9.15228 16.6117 9.15228 17.9961C9.15228 22.1052 9.15683 23.3067 9.17653 23.5401C9.24471 24.3613 9.37349 24.878 9.64621 25.4431C10.1674 26.5249 11.1628 27.337 12.3355 27.6401C12.7416 27.7446 13.19 27.8022 13.7658 27.8295C14.0097 27.8401 16.496 27.8476 18.9838 27.8476C21.4716 27.8476 23.9594 27.8446 24.1973 27.8325C24.8639 27.8011 25.251 27.7492 25.6791 27.6386C26.8593 27.334 27.8366 26.534 28.3684 25.437C28.6358 24.8855 28.7714 24.3492 28.8327 23.5708C28.8461 23.4011 28.8517 20.6955 28.8517 17.9936C28.8517 15.2911 28.8456 12.5905 28.8323 12.4208C28.7702 11.6299 28.6346 11.0981 28.3585 10.536C28.132 10.0758 27.8805 9.73219 27.5154 9.38083C26.8637 8.7584 26.0668 8.37962 25.1171 8.24265C24.657 8.17613 24.5653 8.15643 22.2108 8.15234H19.0049Z"
                      fill="url(#paint0_radial_1497_130)"
                    />
                    <path
                      d="M19.0049 8.15234C14.8926 8.15234 13.6899 8.15659 13.4561 8.17598C12.6122 8.24613 12.087 8.37901 11.5149 8.66386C11.074 8.8828 10.7263 9.13659 10.3832 9.49234C9.75818 10.1411 9.3794 10.9393 9.24228 11.8881C9.17562 12.3487 9.15622 12.4426 9.15228 14.7954C9.15077 15.5796 9.15228 16.6117 9.15228 17.9961C9.15228 22.1052 9.15683 23.3067 9.17653 23.5401C9.24471 24.3613 9.37349 24.878 9.64621 25.4431C10.1674 26.5249 11.1628 27.337 12.3355 27.6401C12.7416 27.7446 13.19 27.8022 13.7658 27.8295C14.0097 27.8401 16.496 27.8476 18.9838 27.8476C21.4716 27.8476 23.9594 27.8446 24.1973 27.8325C24.8639 27.8011 25.251 27.7492 25.6791 27.6386C26.8593 27.334 27.8366 26.534 28.3684 25.437C28.6358 24.8855 28.7714 24.3492 28.8327 23.5708C28.8461 23.4011 28.8517 20.6955 28.8517 17.9936C28.8517 15.2911 28.8456 12.5905 28.8323 12.4208C28.7702 11.6299 28.6346 11.0981 28.3585 10.536C28.132 10.0758 27.8805 9.73219 27.5154 9.38083C26.8637 8.7584 26.0668 8.37962 25.1171 8.24265C24.657 8.17613 24.5653 8.15643 22.2108 8.15234H19.0049Z"
                      fill="url(#paint1_radial_1497_130)"
                    />
                    <path
                      d="M19.0004 10.7266C17.0253 10.7266 16.7774 10.7352 16.0017 10.7705C15.2275 10.806 14.699 10.9285 14.2366 11.1084C13.7583 11.2941 13.3525 11.5426 12.9483 11.947C12.5438 12.3513 12.2953 12.757 12.1089 13.2352C11.9287 13.6978 11.8059 14.2264 11.7711 15.0004C11.7364 15.7761 11.7273 16.0241 11.7273 17.9993C11.7273 19.9744 11.7361 20.2216 11.7712 20.9973C11.8068 21.7716 11.9294 22.3 12.1091 22.7625C12.295 23.2408 12.5435 23.6466 12.9479 24.0508C13.3519 24.4554 13.7577 24.7044 14.2357 24.8902C14.6984 25.07 15.227 25.1926 16.0011 25.2281C16.7768 25.2634 17.0246 25.272 18.9995 25.272C20.9747 25.272 21.2219 25.2634 21.9976 25.2281C22.7718 25.1926 23.3009 25.07 23.7636 24.8902C24.2418 24.7044 24.6469 24.4554 25.051 24.0508C25.4555 23.6466 25.704 23.2408 25.8903 22.7626C26.0691 22.3 26.1919 21.7714 26.2282 20.9975C26.2631 20.2217 26.2722 19.9744 26.2722 17.9993C26.2722 16.0241 26.2631 15.7763 26.2282 15.0005C26.1919 14.2263 26.0691 13.6978 25.8903 13.2354C25.704 12.757 25.4555 12.3513 25.051 11.947C24.6464 11.5425 24.2419 11.294 23.7631 11.1084C23.2995 10.9285 22.7707 10.806 21.9965 10.7705C21.2208 10.7352 20.9738 10.7266 18.9981 10.7266H19.0004ZM18.348 12.0372C18.5416 12.0369 18.7577 12.0372 19.0004 12.0372C20.9422 12.0372 21.1723 12.0441 21.9391 12.079C22.6482 12.1114 23.033 12.2299 23.2894 12.3294C23.6288 12.4613 23.8707 12.6188 24.1251 12.8734C24.3796 13.1279 24.5372 13.3704 24.6693 13.7097C24.7689 13.9658 24.8875 14.3507 24.9198 15.0597C24.9546 15.8264 24.9622 16.0567 24.9622 17.9976C24.9622 19.9385 24.9546 20.1688 24.9198 20.9355C24.8873 21.6446 24.7689 22.0294 24.6693 22.2855C24.5375 22.6249 24.3796 22.8666 24.1251 23.121C23.8706 23.3755 23.6289 23.5331 23.2894 23.6649C23.0333 23.7649 22.6482 23.8831 21.9391 23.9155C21.1725 23.9504 20.9422 23.9579 19.0004 23.9579C17.0585 23.9579 16.8284 23.9504 16.0617 23.9155C15.3526 23.8828 14.9678 23.7643 14.7113 23.6647C14.3719 23.5329 14.1295 23.3754 13.875 23.1208C13.6204 22.8663 13.4628 22.6244 13.3307 22.2849C13.2312 22.0288 13.1126 21.644 13.0803 20.9349C13.0454 20.1682 13.0385 19.9379 13.0385 17.9958C13.0385 16.0537 13.0454 15.8246 13.0803 15.0579C13.1127 14.3488 13.2312 13.964 13.3307 13.7076C13.4625 13.3682 13.6204 13.1258 13.875 12.8713C14.1295 12.6167 14.3719 12.4591 14.7113 12.327C14.9677 12.227 15.3526 12.1088 16.0617 12.0763C16.7326 12.046 16.9926 12.0369 18.348 12.0354V12.0372ZM22.8824 13.2447C22.4006 13.2447 22.0097 13.6352 22.0097 14.1172C22.0097 14.599 22.4006 14.9899 22.8824 14.9899C23.3642 14.9899 23.7551 14.599 23.7551 14.1172C23.7551 13.6354 23.3642 13.2444 22.8824 13.2444V13.2447ZM19.0004 14.2644C16.9379 14.2644 15.2657 15.9367 15.2657 17.9993C15.2657 20.0619 16.9379 21.7334 19.0004 21.7334C21.0629 21.7334 22.7345 20.0619 22.7345 17.9993C22.7345 15.9367 21.0629 14.2644 19.0004 14.2644ZM19.0004 15.575C20.3392 15.575 21.4246 16.6604 21.4246 17.9993C21.4246 19.3381 20.3392 20.4235 19.0004 20.4235C17.6615 20.4235 16.5762 19.3381 16.5762 17.9993C16.5762 16.6604 17.6615 15.575 19.0004 15.575Z"
                      fill="white"
                    />
                  </g>
                  <defs>
                    <radialGradient
                      id="paint0_radial_1497_130"
                      cx="0"
                      cy="0"
                      r="1"
                      gradientUnits="userSpaceOnUse"
                      gradientTransform="translate(14.3845 29.3646) rotate(-90) scale(19.5195 18.1591)"
                    >
                      <stop stop-color="#FFDD55" />
                      <stop offset="0.1" stop-color="#FFDD55" />
                      <stop offset="0.5" stop-color="#FF543E" />
                      <stop offset="1" stop-color="#C837AB" />
                    </radialGradient>
                    <radialGradient
                      id="paint1_radial_1497_130"
                      cx="0"
                      cy="0"
                      r="1"
                      gradientTransform="matrix(1.71299 8.55558 -35.2742 7.06314 5.85174 9.57116)"
                      gradientUnits="userSpaceOnUse"
                    >
                      <stop stop-color="#3771C8" />
                      <stop offset="0.128" stop-color="#3771C8" />
                      <stop offset="1" stop-color="#6600FF" stop-opacity="0" />
                    </radialGradient>
                    <clipPath id="clip0_1497_130">
                      <rect
                        width="20"
                        height="20"
                        fill="white"
                        transform="translate(9 8)"
                      />
                    </clipPath>
                  </defs>
                </svg>

                {/* <img src={LinkedIn} className="img-fluid" alt="" />
                <img src={Twitter} className="img-fluid" alt="" /> */}
                <img src={FaceBook} className="img-fluid" alt="" />
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="Connect_Bg px-4 pe-5 py-4 alfred-bgss">
              <img src={Connect} className="img-fluid" alt="" />
              <p className="TellUs mb-0 mt-3" style={{ width: "70%" }}>
                Generate Posts & Images with Alfred
              </p>
              <p className="No_prompt mt-2">
                Let AI create engaging content and stunning visuals tailored to
                your brand and audience
              </p>
              <div className="ai-card">
                <div className="d-flex align-items-center">
                  <div className="ai-icon-wrapper">
                    <svg
                      className="ai-icon"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 22.5l-.394-1.933a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423L16.5 15l.394 1.933a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                  <span className="ai-text">AI is Generating...</span>
                </div>
                <div className="progress-container">
                  <div className="progress-bar-custom">
                    <div className="progress-fill"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="Watch_Bg px-4 pe-5 py-4 alfred-bgss">
              <img src={Time} className="img-fluid" alt="" />
              <p className="wacth mb-0 mt-3">Schedule and Publish Instantly</p>
              <p className="Ai_Satrts mt-2">
                Set your schedule or publish immediately across all connected
                platforms with one click
              </p>
              <div className="Email_sendbg py-3 px-3">
                <div className="d-flex align-items-start gap-3">
                  <div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="19"
                      height="19"
                      viewBox="0 0 19 19"
                      fill="none"
                    >
                      <path
                        d="M7.88333 13.3833L14.3458 6.92083L13.0625 5.6375L7.88333 10.8167L5.27083 8.20417L3.9875 9.4875L7.88333 13.3833ZM9.16667 18.3333C7.89861 18.3333 6.70694 18.0927 5.59167 17.6115C4.47639 17.1302 3.50625 16.4771 2.68125 15.6521C1.85625 14.8271 1.20312 13.8569 0.721875 12.7417C0.240625 11.6264 0 10.4347 0 9.16667C0 7.89861 0.240625 6.70694 0.721875 5.59167C1.20312 4.47639 1.85625 3.50625 2.68125 2.68125C3.50625 1.85625 4.47639 1.20312 5.59167 0.721875C6.70694 0.240625 7.89861 0 9.16667 0C10.4347 0 11.6264 0.240625 12.7417 0.721875C13.8569 1.20312 14.8271 1.85625 15.6521 2.68125C16.4771 3.50625 17.1302 4.47639 17.6115 5.59167C18.0927 6.70694 18.3333 7.89861 18.3333 9.16667C18.3333 10.4347 18.0927 11.6264 17.6115 12.7417C17.1302 13.8569 16.4771 14.8271 15.6521 15.6521C14.8271 16.4771 13.8569 17.1302 12.7417 17.6115C11.6264 18.0927 10.4347 18.3333 9.16667 18.3333Z"
                        fill="white"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="Published mb-0">Published Successfully!</p>
                    <p className="Posted mb-0">Posted to 4 platforms</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Rocket
        isNewUser={!mySubscription}
        onComplete={() => {}}
        // onSubscribe={() => {}}
        onSubscribe = {onSubscribe}
      ></Rocket>
      {/* billing */}
      <div id="pricing-plans" className="container-fluid Whole_div mt-5 py-5">
        <div className="d-flex align-items-center justify-content-center ">
          {/* <div>
            <p className="simple text-center mb-0">Plans for every creator</p>
            <p className="Choose text-center">
              Choose the perfect plan to scale your social media presence
            </p>
            <div className="Tick_Bg py-2 px-3">
              <div className="row">
                <div className="col-lg-4">
                  <div className="d-flex align-items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <path
                        d="M8.6 14.6L15.65 7.55L14.25 6.15L8.6 11.8L5.75 8.95L4.35 10.35L8.6 14.6ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20Z"
                        fill="#47B166"
                      />
                    </svg>
                    <p className="FreeTrail mb-0">7 - Day free trial</p>
                  </div>
                </div>
              </div>
            </div>
          </div> */}
          <div className="text-center">
            <h1 className="simple text-center mb-0">Plans for Every Creator</h1>
            <p className="Choose text-center">
              Choose your growth path amplify your brand across every platform
            </p>

            <ul className="features-listDays px-4">
              {featuresDays.map((feature, index) => (
                <li key={index} className="feature-item">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M8.6 14.6L15.65 7.55L14.25 6.15L8.6 11.8L5.75 8.95L4.35 10.35L8.6 14.6ZM10 20C8.61667 20 7.31667 19.7375 6.1 19.2125C4.88333 18.6875 3.825 17.975 2.925 17.075C2.025 16.175 1.3125 15.1167 0.7875 13.9C0.2625 12.6833 0 11.3833 0 10C0 8.61667 0.2625 7.31667 0.7875 6.1C1.3125 4.88333 2.025 3.825 2.925 2.925C3.825 2.025 4.88333 1.3125 6.1 0.7875C7.31667 0.2625 8.61667 0 10 0C11.3833 0 12.6833 0.2625 13.9 0.7875C15.1167 1.3125 16.175 2.025 17.075 2.925C17.975 3.825 18.6875 4.88333 19.2125 6.1C19.7375 7.31667 20 8.61667 20 10C20 11.3833 19.7375 12.6833 19.2125 13.9C18.6875 15.1167 17.975 16.175 17.075 17.075C16.175 17.975 15.1167 18.6875 13.9 19.2125C12.6833 19.7375 11.3833 20 10 20Z"
                      fill="#47B166"
                    />
                  </svg>
                  <span className="feature-text">{feature.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* For Navtabs */}

        <div className="d-flex align-items-center justify-content-center mt-3">
          <ul
            className="nav nav-tabs Nav_billng justify-content-center"
            role="tablist"
            style={{ border: "none" }}
          >
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link btn Nav_Link_Billng ${
                  activeTab === "monthly" ? "active" : ""
                }`}
                onClick={() => setActiveTab("monthly")}
                role="tab"
              >
                Monthly
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link btn Nav_Link_Billng ${
                  activeTab === "yearly" ? "active" : ""
                }`}
                onClick={() => setActiveTab("yearly")}
                role="tab"
              >
                Yearly
              </button>
            </li>
          </ul>
        </div>
        <div className="tab-content">
          <div className="tab-pane fade show active">
            <div className="row mt-5 g-3">
              {loading ? (
                <div className="col-12 text-center">
                  <div className="w-100  d-flex align-items-center justify-content-center text-primary" role="status">
                    {/* <span className="visually-hidden">Loading...</span> */}
                    {/* <div className="loader "></div> */}
                    <img src={Loadings} alt="" className="w-10 h-10" />
                  </div>
                  <p className="mt-2">Loading subscription plans...</p>
                </div>
              ) : error ? (
                <div className="col-12 text-center">
                  <div className="alert alert-warning" role="alert">
                    <p className="mb-0">
                      Unable to load plans from server. Showing default plans.
                    </p>
                    <small className="text-muted">Error: {error}</small>
                    <br />
                    <button
                      className="btn btn-sm btn-outline-primary mt-2"
                      onClick={fetchSubscriptionPlans}
                    >
                      Retry Loading Plans
                    </button>
                  </div>
                </div>
              ) : null}
              {(allPlans[activeTab] || []).map((data, index) => {
                const isActive = activeCardIndex === index;
                const isHovered = hoveredCardIndex === index;
                const shouldShowGrowthStyle = isActive || isHovered;

                return (
                  <div
                    key={index}
                    className={
                      shouldShowGrowthStyle
                        ? "col-lg-4 Growth_Whole"
                        : "col-lg-4"
                    }
                  >
                    <div
                      className={
                        shouldShowGrowthStyle
                          ? "pricing-card-Growth"
                          : "pricing-card-wrapper"
                      }
                      onClick={() => setActiveCardIndex(index)}
                      onMouseEnter={() => setHoveredCardIndex(index)}
                      onMouseLeave={() => setHoveredCardIndex(null)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="Billing1">
                        <div className="d-flex justify-content-center align-items-center">
                          <div>
                            <div className="d-flex justify-content-center align-items-center">
                              <div className="Starter py-1 px-4">
                                <p className="mb-0">
                                  {data?.planType}
                                  {mySubscription &&
                                    mySubscription.plan?.id ===
                                      data.apiData?.id &&
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
                              </div>
                            </div>
                            {/* <p className="Money"> */}
                            <p
                              className={
                                shouldShowGrowthStyle
                                  ? "MoneyGrowth text-center"
                                  : "Money text-center"
                              }
                            >
                              <>
                                <span
                                  className={
                                    shouldShowGrowthStyle
                                      ? "MoneyGrowthDollor"
                                      : "Dollor"
                                  }
                                >
                                  {data?.price}
                                </span>{" "}
                                /{data.period}
                              </>
                            </p>
                            <p
                              className={
                                shouldShowGrowthStyle
                                  ? "text-white text-center Perfect_Growth px-lg-1"
                                  : "Perfect text-center px-lg-1"
                              }
                            >
                              {data.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="card-body-section">
                        <button
                          className={
                            shouldShowGrowthStyle
                              ? "Btn_Growth btn w-100"
                              : "btn btn-trial w-100"
                          }
                          onClick={() => {
                            console.log(
                              "Button clicked for plan:",
                              data.apiData?.id
                            );
                            console.log("Plan data:", data.apiData);

                            if (data.apiData) {
                              if (
                                mySubscription &&
                                mySubscription.plan?.id === data.apiData.id
                              ) {
                                // Current plan - navigate to billing if trial, do nothing if paid
                                if (
                                  mySubscription.trial_info &&
                                  mySubscription.trial_info.is_trial
                                ) {
                                  console.log(
                                    "Trial user on current plan, navigating to billing:",
                                    data.apiData.id
                                  );
                                  navigate("/dashboard?tab=billing");
                                }
                                // If paid subscription, do nothing (button will be disabled)
                              } else if (
                                mySubscription &&
                                mySubscription.trial_info &&
                                mySubscription.trial_info.is_trial
                              ) {
                                // User has trial - navigate to billing screen instead of opening Razorpay
                                console.log(
                                  "Trial user clicking plan, navigating to billing:",
                                  data.apiData.id
                                );
                                navigate("/dashboard?tab=billing");
                              } else if (
                                mySubscription &&
                                mySubscription.plan
                              ) {
                                // User has paid subscription - navigate to billing screen
                                navigate("/dashboard?tab=billing");
                              } else {
                                // No subscription - show trial
                                console.log(
                                  "Calling handleSubscribe with planId:",
                                  data.apiData.id
                                );
                                handleSubscribe(data.apiData.id,false);
                              }
                            } else {
                              console.error("No plan data found:", data);
                            }
                          }}
                          disabled={
                            (mySubscription &&
                              mySubscription.plan?.id === data.apiData?.id &&
                              !(
                                mySubscription.trial_info &&
                                mySubscription.trial_info.is_trial
                              )) ||
                            processingPlanId === data.apiData?.id ||
                            loadingPlanId === data.apiData?.id ||
                            !razorpayLoaded
                          }
                        >
                          {(() => {
                            if (
                              mySubscription &&
                              mySubscription.plan?.id === data.apiData?.id
                            ) {
                              // Current plan - show status
                              if (
                                mySubscription.trial_info &&
                                mySubscription.trial_info.is_trial
                              ) {
                                return loadingPlanId === data.apiData?.id
                                  ? "Starting Trial..."
                                  : processingPlanId === data.apiData?.id
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
                              return loadingPlanId === data.apiData?.id
                                ? "Starting Trial..."
                                : processingPlanId === data.apiData?.id
                                ? "Processing..."
                                : "Subscribe";
                            } else if (mySubscription && mySubscription.plan) {
                              // User has paid subscription - show plan change
                              return data.apiData?.price_usd >
                                mySubscription.plan.price_usd
                                ? "Upgrade"
                                : "Downgrade";
                            } else {
                              // No subscription - show trial
                              return loadingPlanId === data.apiData?.id
                                ? "Starting Trial..."
                                : processingPlanId === data.apiData?.id
                                ? "Processing..."
                                : !razorpayLoaded
                                ? "Loading Payment..."
                                : "Start Free Trial";
                            }
                          })()}
                        </button>

                        <ul className="features-list">
                          {data.features.map((feature, index) => (
                            <li
                              key={index}
                              className={
                                shouldShowGrowthStyle
                                  ? "text-white Feature_White"
                                  : "feature-item"
                              }
                            >
                              {shouldShowGrowthStyle ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="22"
                                  height="13"
                                  viewBox="0 0 22 13"
                                  fill="none"
                                >
                                  <path
                                    d="M4.79169 12.9261C4.52584 12.9261 4.27106 12.8116 4.09752 12.6085L0.22787 8.17764C-0.108139 7.79362 -0.0675226 7.21022 0.316488 6.87421C0.700499 6.5382 1.2839 6.57882 1.61991 6.96283L4.79169 10.5962L13.768 0.316488C14.104 -0.0675228 14.6874 -0.108139 15.0714 0.22787C15.4554 0.56388 15.496 1.14728 15.16 1.53129L5.48956 12.6085C5.31232 12.8079 5.05755 12.9261 4.79169 12.9261Z"
                                    fill="white"
                                  />
                                  <path
                                    d="M10.065 13.0005C10.0466 13.0005 10.0318 13.0005 10.0133 13.0005C9.7438 12.9857 9.49272 12.8528 9.33025 12.6386L8.80224 11.9445C8.49208 11.5383 8.57331 10.9586 8.97578 10.6521C9.32287 10.3863 9.79919 10.4084 10.1241 10.6743L19.9422 0.365049C20.293 -0.00419261 20.8764 -0.0189626 21.2457 0.331817C21.6149 0.682596 21.6297 1.266 21.2789 1.63524L10.7334 12.7162C10.5598 12.9008 10.3198 13.0005 10.065 13.0005Z"
                                    fill="white"
                                  />
                                </svg>
                              ) : data.planType === "Basic" ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="22"
                                  height="13"
                                  viewBox="0 0 22 13"
                                  fill="none"
                                >
                                  <path
                                    d="M5.25947 12.9261C4.99361 12.9261 4.73884 12.8116 4.56529 12.6085L0.695644 8.17764C0.359634 7.79362 0.400251 7.21022 0.784262 6.87421C1.16827 6.5382 1.75167 6.57882 2.08768 6.96283L5.25947 10.5962L14.2357 0.316488C14.5717 -0.0675228 15.1551 -0.108139 15.5391 0.22787C15.9232 0.56388 15.9638 1.14728 15.6278 1.53129L5.95733 12.6085C5.7801 12.8079 5.52532 12.9261 5.25947 12.9261Z"
                                    fill="#37955E"
                                  />
                                  <path
                                    d="M10.5318 13.0005C10.5134 13.0005 10.4986 13.0005 10.4801 13.0005C10.2106 12.9857 9.95952 12.8528 9.79705 12.6386L9.26903 11.9445C8.95887 11.5383 9.0401 10.9586 9.44258 10.6521C9.78966 10.3863 10.266 10.4084 10.5909 10.6743L20.409 0.365049C20.7598 -0.00419261 21.3432 -0.0189626 21.7125 0.331817C22.0817 0.682596 22.0965 1.266 21.7457 1.63524L11.2002 12.7162C11.0266 12.9008 10.7866 13.0005 10.5318 13.0005Z"
                                    fill="#37955E"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="22"
                                  height="13"
                                  viewBox="0 0 22 13"
                                  fill="none"
                                >
                                  <path
                                    d="M4.79194 12.9261C4.52608 12.9261 4.27131 12.8116 4.09776 12.6085L0.228114 8.17764C-0.107895 7.79362 -0.0672785 7.21022 0.316732 6.87421C0.700743 6.5382 1.28414 6.57882 1.62015 6.96283L4.79194 10.5962L13.7682 0.316488C14.1042 -0.0675228 14.6876 -0.108139 15.0716 0.22787C15.4556 0.56388 15.4962 1.14728 15.1602 1.53129L5.4898 12.6085C5.31257 12.8079 5.05779 12.9261 4.79194 12.9261Z"
                                    fill="#303030"
                                  />
                                  <path
                                    d="M10.0646 13.0005C10.0461 13.0005 10.0313 13.0005 10.0129 13.0005C9.74331 12.9857 9.49223 12.8528 9.32976 12.6386L8.80175 11.9445C8.49159 11.5383 8.57282 10.9586 8.97529 10.6521C9.32238 10.3863 9.7987 10.4084 10.1236 10.6743L19.9418 0.365049C20.2925 -0.00419261 20.8759 -0.0189626 21.2452 0.331817C21.6144 0.682596 21.6292 1.266 21.2784 1.63524L10.7329 12.7162C10.5593 12.9008 10.3193 13.0005 10.0646 13.0005Z"
                                    fill="#303030"
                                  />
                                </svg>
                              )}

                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {data.planType === "Standard" ? (
                        <div className="most_popular ">
                          <div className="Most text-center py-2">
                            <p className="Popular mb-0">Most Popular</p>
                          </div>
                        </div>
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* <div className="Creadit_Bg px-lg-5 px-2 py-lg-5 py-4 mt-lg-5 mt-3">
          <div className="row g-3">
            <div className="col-lg-4">
              <div className="d-flex flex-column align-items-center justify-content-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="57"
                  height="57"
                  viewBox="0 0 57 57"
                  fill="none"
                >
                  <circle cx="28.5" cy="28.5" r="28.5" fill="#4DBC6A" />
                  <path
                    d="M15.5424 36.7372V25.0585V25.7853V18.5182V36.7372ZM15.5424 22.7811H40.2205V19.4527C40.2205 19.2189 40.1216 19.0047 39.924 18.8101C39.7263 18.6155 39.5087 18.5182 39.2711 18.5182H16.4917C16.2542 18.5182 16.0366 18.6155 15.8389 18.8101C15.6412 19.0047 15.5424 19.2189 15.5424 19.4527V22.7811ZM26.7512 38.2554H16.4917C15.7817 38.2554 15.1889 38.0213 14.7134 37.5532C14.2378 37.0851 14 36.5016 14 35.8027V19.4527C14 18.7538 14.2378 18.1703 14.7134 17.7022C15.1889 17.2341 15.7817 17 16.4917 17H39.2711C39.9811 17 40.5739 17.2341 41.0495 17.7022C41.5251 18.1703 41.7629 18.7538 41.7629 19.4527V26.5444C40.9819 26.0677 40.1419 25.7008 39.243 25.4437C38.3443 25.1869 37.4025 25.0585 36.4177 25.0585C35.526 25.0585 34.6683 25.1747 33.8447 25.4073C33.0213 25.6398 32.2595 25.9712 31.5592 26.4013H15.5424V35.8027C15.5424 36.0365 15.6412 36.2507 15.8389 36.4453C16.0366 36.6399 16.2542 36.7372 16.4917 36.7372H26.3599C26.4172 37.0155 26.4735 37.2764 26.5288 37.5198C26.5843 37.763 26.6584 38.0082 26.7512 38.2554ZM35.6465 41L35.4807 39.6567C34.9941 39.5497 34.5368 39.3878 34.1088 39.1709C33.6808 38.9538 33.2957 38.6565 32.9535 38.2789L31.666 38.7868L30.8359 37.5487L31.8974 36.673C31.7275 36.1495 31.6425 35.6258 31.6425 35.102C31.6425 34.5785 31.7275 34.0549 31.8974 33.5314L30.8359 32.6554L31.666 31.4176L32.9535 31.9255C33.2759 31.5479 33.6561 31.2506 34.0941 31.0335C34.5319 30.8164 34.9941 30.6543 35.4807 30.5473L35.6465 29.2044H37.1889L37.3551 30.5473C37.8417 30.6543 38.3039 30.8164 38.7417 31.0335C39.1798 31.2506 39.56 31.5479 39.8823 31.9255L41.1698 31.4176L42 32.6554L40.9385 33.5314C41.1084 34.0549 41.1933 34.5785 41.1933 35.102C41.1933 35.6258 41.1084 36.1495 40.9385 36.673L42 37.5487L41.1698 38.7868L39.8823 38.2789C39.5402 38.6565 39.1551 38.9538 38.7271 39.1709C38.2991 39.3878 37.8417 39.5497 37.3551 39.6567L37.1889 41H35.6465ZM36.4177 38.3723C37.3452 38.3723 38.1308 38.0555 38.7745 37.4219C39.4182 36.7883 39.74 36.015 39.74 35.102C39.74 34.1893 39.4182 33.4161 38.7745 32.7825C38.1308 32.1489 37.3452 31.8321 36.4177 31.8321C35.4905 31.8321 34.7051 32.1489 34.0614 32.7825C33.4177 33.4161 33.0958 34.1893 33.0958 35.102C33.0958 36.015 33.4177 36.7883 34.0614 37.4219C34.7051 38.0555 35.4905 38.3723 36.4177 38.3723Z"
                    fill="white"
                  />
                </svg>
                <p className="No_Credit mb-0 text-center">
                  No Credit and Required
                </p>
                <p className="StartYour mb-0 text-center">
                  Start your free trial instantly without any payment info
                </p>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="d-flex flex-column align-items-center justify-content-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="57"
                  height="57"
                  viewBox="0 0 57 57"
                  fill="none"
                >
                  <circle cx="28.5" cy="28.5" r="28.5" fill="#012C33" />
                  <path
                    d="M25.7933 33.2067V26.6778H32.3222V33.2067H25.7933ZM29.0578 43C26.5233 43 24.2318 42.3484 22.1835 41.0452C20.1354 39.7419 18.5095 37.9041 17.3058 35.5319V40.3884H16V33.3575H23.0062V34.6633H18.3504C19.3598 36.8311 20.8149 38.5449 22.7159 39.8048C24.6169 41.0644 26.7309 41.6942 29.0578 41.6942C31.6443 41.6942 33.9675 40.9216 36.0274 39.3765C38.0872 37.8313 39.4973 35.8224 40.2574 33.3496L41.5482 33.6108C40.7362 36.42 39.1793 38.6871 36.8774 40.4123C34.5756 42.1374 31.969 43 29.0578 43ZM16.0653 28.6364C16.2344 27.2789 16.5407 26.0606 16.9842 24.9816C17.428 23.9026 18.0784 22.8056 18.9354 21.6907L19.8922 22.5972C19.1958 23.5063 18.6551 24.4207 18.2701 25.3407C17.8851 26.2606 17.5879 27.3592 17.3786 28.6364H16.0653ZM21.7203 20.7943L20.8138 19.8375C21.8669 19.0139 22.9776 18.3624 24.1461 17.8827C25.3146 17.4031 26.5165 17.1088 27.752 17V18.3058C26.6924 18.4146 25.6494 18.6824 24.623 19.1092C23.5969 19.5361 22.6293 20.0979 21.7203 20.7943ZM36.3525 20.7943C35.5608 20.1314 34.617 19.5739 33.5213 19.1219C32.4255 18.6699 31.3729 18.3978 30.3636 18.3058V17C31.604 17.1138 32.8098 17.4135 33.9809 17.899C35.152 18.3843 36.2531 19.0389 37.2842 19.8626L36.3525 20.7943ZM40.6942 28.6364C40.5519 27.426 40.2673 26.3231 39.8406 25.3279C39.4136 24.3327 38.8519 23.4308 38.1555 22.6224L39.0871 21.6907C39.9276 22.6885 40.5905 23.7729 41.0758 24.9437C41.5614 26.1148 41.8694 27.3457 42 28.6364H40.6942Z"
                    fill="white"
                  />
                </svg>
                <p className="No_Credit mb-0 text-center">Cancel Anytime</p>
                <p className="StartYour mb-0 text-center">
                  No long-term contracts or cancellation fees
                </p>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="d-flex flex-column align-items-center justify-content-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="57"
                  height="57"
                  viewBox="0 0 57 57"
                  fill="none"
                >
                  <circle cx="28.5" cy="28.5" r="28.5" fill="#4DBC6A" />
                  <path
                    d="M28.1282 42V40.375H38.7861C39.0547 40.375 39.2871 40.2917 39.4833 40.1252C39.6796 39.9583 39.7778 39.7395 39.7778 39.4687V28.2748C39.7778 25.2312 38.6681 22.689 36.4488 20.6483C34.2292 18.6079 31.5796 17.5876 28.5 17.5876C25.4204 17.5876 22.7708 18.6079 20.5512 20.6483C18.3319 22.689 17.2222 25.2312 17.2222 28.2748V37.5H16.4167C15.7577 37.5 15.1902 37.2754 14.7141 36.8264C14.238 36.3776 14 35.8209 14 35.1563V32.0936C14 31.6083 14.1564 31.1776 14.4692 30.8017C14.7823 30.4255 15.163 30.1198 15.6111 29.8844L15.6389 27.8877C15.6886 26.1917 16.0692 24.6209 16.7808 23.1752C17.4924 21.7292 18.4291 20.4708 19.591 19.3999C20.7528 18.329 22.1027 17.4947 23.6405 16.897C25.1783 16.299 26.7981 16 28.5 16C30.2019 16 31.8202 16.299 33.3551 16.897C34.8897 17.4947 36.2395 18.3275 37.4046 19.3954C38.5694 20.4631 39.5062 21.7197 40.2148 23.1654C40.9231 24.6114 41.3052 26.1823 41.3611 27.8779L41.3889 29.8344C41.8164 30.0365 42.1918 30.3084 42.5151 30.6502C42.8384 30.9917 43 31.402 43 31.8811V35.4001C43 35.8792 42.8384 36.2896 42.5151 36.6314C42.1918 36.9729 41.8164 37.2447 41.3889 37.4468V39.4687C41.3889 40.175 41.1354 40.7734 40.6284 41.2639C40.1212 41.7546 39.5071 42 38.7861 42H28.1282ZM24.2861 31.5001C23.9537 31.5001 23.6641 31.386 23.4173 31.158C23.1706 30.9297 23.0472 30.6479 23.0472 30.3126C23.0472 29.977 23.1706 29.6901 23.4173 29.4517C23.6641 29.2131 23.9537 29.0938 24.2861 29.0938C24.6188 29.0938 24.9086 29.2131 25.1553 29.4517C25.4021 29.6901 25.5255 29.977 25.5255 30.3126C25.5255 30.6479 25.4021 30.9297 25.1553 31.158C24.9086 31.386 24.6188 31.5001 24.2861 31.5001ZM32.7139 31.5001C32.3812 31.5001 32.0914 31.386 31.8447 31.158C31.5979 30.9297 31.4745 30.6479 31.4745 30.3126C31.4745 29.977 31.5979 29.6901 31.8447 29.4517C32.0914 29.2131 32.3812 29.0938 32.7139 29.0938C33.0463 29.0938 33.3359 29.2131 33.5827 29.4517C33.8294 29.6901 33.9528 29.977 33.9528 30.3126C33.9528 30.6479 33.8294 30.9297 33.5827 31.158C33.3359 31.386 33.0463 31.5001 32.7139 31.5001ZM19.9889 28.9187C19.8423 26.4853 20.619 24.4114 22.319 22.697C24.019 20.9824 26.1062 20.1251 28.5806 20.1251C30.6605 20.1251 32.5035 20.7547 34.1095 22.0141C35.7155 23.2735 36.6961 24.9282 37.0514 26.9781C34.9177 26.951 32.9374 26.402 31.1104 25.3312C29.2834 24.2603 27.8813 22.7707 26.9042 20.8624C26.5159 22.7374 25.7078 24.3807 24.4799 25.7922C23.2519 27.2036 21.7549 28.2457 19.9889 28.9187Z"
                    fill="white"
                  />
                </svg>
                <p className="No_Credit mb-0 text-center">Expert Support</p>
                <p className="StartYour mb-0 text-center">
                  Get help from our sales automation experts
                </p>
              </div>
            </div>
          </div>
        </div> */}
        {/* <div>
          <p className=" mt-3 Questions text-center">
            Questions about pricing?{" "}
            <a href="" className="Contact_Decoration">
              <span className="Contant_ref">Contact our sales team</span>
            </a>
          </p>
        </div> */}
      </div>
    </>
  );
};

export default HowToWork;
