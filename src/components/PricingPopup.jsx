import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Swal from "sweetalert2";
import {
  getMySubscriptionApi,
  startTrialApi,
  convertTrialToPaidApi,
  verifyTrialPaymentApi,
  verifyConversionPaymentApi,
  BASE_URL,
} from "../api/api";
import "./PricingPopup.css";
import Loading from "../assets/simbli_loader.gif"
const PricingPopup = ({
  isOpen,
  onClose,
  credits = 50,
  maxCredits = 100,
  availablePlans = [],
  onNavigateToBilling,
  plan,
}) => {
  const { user } = useAuth();
  const [mySubscription, setMySubscription] = useState(null);
  const [currency, setCurrency] = useState("INR");
  const [countryCode, setCountryCode] = useState("IN");
  const [addonPricing, setAddonPricing] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  // const [loadingPlanId, setLoadingPlanId] = useState(null);
  // const [processingPlanId, setProcessingPlanId] = useState(null);

  // Auto-detect user's currency and country
  useEffect(() => {
    const detectUserLocation = async () => {
      try {
        const response = await fetch("https://ipapi.co/json/");
        const data = await response.json();
        if (data.currency && data.country_code) {
          setCurrency(data.currency);
          setCountryCode(data.country_code);
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
          `${BASE_URL}/subscription/addon-pricing?currency=${currency}&country_code=${countryCode}`,
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

  // Fetch user's subscription on component mount
  useEffect(() => {
    if (isOpen && user) {
      fetchMySubscription();
    }
  }, [isOpen, user]);

  const fetchMySubscription = async () => {
    try {
      const response = await getMySubscriptionApi();
      if (response.data.status === "success") {
        setMySubscription(response.data.subscription);
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
    }
  };

  // const handleSubscribe = async (planId) => {
  //   if (!user) {
  //     Swal.fire({
  //       title: 'Login Required',
  //       text: 'Please login to start a subscription',
  //       icon: 'warning',
  //       confirmButtonColor: '#28a745'
  //     });
  //     return;
  //   }

  //   // Check if this is a trial-to-paid conversion
  //   const isTrialConversion = mySubscription && mySubscription.trial_info && mySubscription.trial_info.is_trial;

  //   setProcessingPlanId(planId);
  //   try {
  //     // Use different endpoint based on whether this is trial conversion or new trial
  //     const response = isTrialConversion ?
  //       await convertTrialToPaidApi(planId, 'INR', null) :
  //       await startTrialApi(planId, 'INR', null);

  //     if (response.data.status === 'success') {
  //       // Open Razorpay payment popup
  //       const options = {
  //         key: response.data.razorpay_key,
  //         amount: response.data.order.amount,
  //         currency: response.data.order.currency,
  //         name: 'Alfred Social Media Agent',
  //         description: isTrialConversion ?
  //           `Subscribe to ${response.data.conversion_info?.plan_name || 'Plan'}` :
  //           `Free Trial - ${response.data.trial_info?.plan_name || 'Plan'}`,
  //         order_id: response.data.order.id,
  //         handler: async function (paymentResponse) {
  //           // Verify payment
  //           try {
  //             const verifyResponse = isTrialConversion ?
  //               await verifyConversionPaymentApi({
  //                 razorpay_payment_id: paymentResponse.razorpay_payment_id,
  //                 razorpay_order_id: paymentResponse.razorpay_order_id,
  //                 razorpay_signature: paymentResponse.razorpay_signature,
  //                 plan_id: planId,
  //                 coupon_id: null,
  //                 original_amount: response.data.conversion_info?.original_amount || null,
  //                 discount_amount: response.data.conversion_info?.discount_amount || 0
  //               }) :
  //               await verifyTrialPaymentApi({
  //                 razorpay_payment_id: paymentResponse.razorpay_payment_id,
  //                 razorpay_order_id: paymentResponse.razorpay_order_id,
  //                 razorpay_signature: paymentResponse.razorpay_signature,
  //                 plan_id: planId,
  //                 coupon_id: null
  //               });

  //             if (verifyResponse.data.status === 'success') {
  //               if (isTrialConversion) {
  //                 await Swal.fire({
  //                   title: 'Subscription Activated!',
  //                   text: `Your trial has been converted to a paid subscription! You now have full access to all features.`,
  //                   icon: 'success',
  //                   confirmButtonColor: '#28a745'
  //                 });
  //               } else {
  //                 await Swal.fire({
  //                   title: 'Trial Started!',
  //                   text: `Free trial started successfully! You have 7 days to explore all features. Auto-pay will be enabled after the trial period.`,
  //                   icon: 'success',
  //                   confirmButtonColor: '#28a745'
  //                 });
  //               }
  //               fetchMySubscription(); // Refresh subscription data
  //               onClose(); // Close the popup
  //             } else {
  //               await Swal.fire({
  //                 title: isTrialConversion ? 'Conversion Failed' : 'Trial Verification Failed',
  //                 text: verifyResponse.data.detail || verifyResponse.data.message || 'Unknown error',
  //                 icon: 'error',
  //                 confirmButtonColor: '#dc3545'
  //               });
  //             }
  //           } catch (err) {
  //             console.error('Error verifying payment:', err);
  //             await Swal.fire({
  //               title: 'Error',
  //               text: 'Error verifying payment. Please contact support.',
  //               icon: 'error',
  //               confirmButtonColor: '#dc3545'
  //             });
  //           }
  //         },
  //         prefill: {
  //           name: user.name || '',
  //           email: user.email || '',
  //           contact: user.phone || ''
  //         },
  //         theme: {
  //           color: '#28a745'
  //         }
  //       };

  //       const razorpay = new window.Razorpay(options);
  //       razorpay.open();
  //     } else {
  //       // Handle API errors
  //       let errorMessage = 'Unknown error';
  //       if (response.data.detail) {
  //         if (Array.isArray(response.data.detail)) {
  //           errorMessage = response.data.detail.map(err => err.msg || err).join(', ');
  //         } else {
  //           errorMessage = response.data.detail;
  //         }
  //       } else if (response.data.message) {
  //         errorMessage = response.data.message;
  //       }

  //       await Swal.fire({
  //         title: 'Subscription Error',
  //         text: errorMessage,
  //         icon: 'error',
  //         confirmButtonColor: '#dc3545'
  //       });
  //     }
  //   } catch (err) {
  //     console.error('Error subscribing:', err);
  //     await Swal.fire({
  //       title: 'Error',
  //       text: 'Error processing subscription. Please try again.',
  //       icon: 'error',
  //       confirmButtonColor: '#dc3545'
  //     });
  //   } finally {
  //     setProcessingPlanId(null);
  //   }
  // };

  const handleBuyAddon = async (addonType) => {
    if (!user) {
      alert("Please login to purchase add-ons");
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
            currency: currency, // Use detected currency
            price_usd: pricing.usd_cents, // Use USD amount in cents
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
          description: `Add-on: ${addonType} - ${pricing.credits} credits`,
          order_id: data.order.id,
          handler: async function (response) {
            // Show loading state
            setPaymentProcessing(true);
            
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
              // Close popup 
                onClose();
                await Swal.fire({
                  title: "Add-on Purchased!",
                  text: `Successfully purchased ${pricing.credits} ${addonType} credits! They have been added to your account.`,
                  icon: "success",
                  confirmButtonColor: "#28a745",
                  timer: 4000,
                  timerProgressBar: true,
                });
                await fetchMySubscription(); // Refresh subscription data
              } else {
                // Hide loading state before showing error modal
                setPaymentProcessing(false);
                await Swal.fire({
                  title: "Purchase Failed",
                  timer: 4000,
                  timerProgressBar: true,
                  text: verifyData.detail || "Unknown error",
                  icon: "error",
                  confirmButtonColor: "#dc3545",
                });
              }
            } catch (err) {
              // Hide loading state before showing error modal
              setPaymentProcessing(false);
              console.error("Error verifying add-on payment:", err);
              await Swal.fire({
                title: "Error",
                timer: 4000,
                timerProgressBar: true,
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
          timer: 4000,
          timerProgressBar: true,
          text: data.detail || "Unknown error",
          icon: "error",
          confirmButtonColor: "#dc3545",
        });
      }
    } catch (err) {
      await Swal.fire({
        title: "Error",
        timer: 4000,
        timerProgressBar: true,
        text: "Error creating add-on order",
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
      console.error("Error buying add-on:", err);
    }
  };

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="pricing-popup-overlay" onClick={handleOverlayClick}>
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

      <div className="pricing-popup-container">
        {/* Close Button */}
        <button onClick={onClose} className="pricing-popup-close-btn">
          ×
        </button>

        {/* Title */}
        <h2 className="pricing-popup-title">
          Unlock Your Social Media Potential with Alfred
        </h2>

        {/* Description */}
        <p className="pricing-popup-description">
          You've utilized your current credits. Elevate your strategy by
          purchasing more credits or upgrading your subscription.
        </p>

        {/* Pricing Plans */}
        {/*   <div className="pricing-plans-grid">
          {availablePlans.length > 0 ? (
            availablePlans.map((plan, index) => (
              <div 
                key={plan.id} 
                className={index === 1 ? "pricing-plan-card-popular" : "pricing-plan-card"}
              >
                // Popular Badge for Standard Plan 
                {index === 1 && (
                  <div className="pricing-popular-badge d-flex">
                    <span className="d-flex align-items-center justify-content-center">
                      <svg
                        className="me-1 svg-ic"
                        width="11"
                        height="11"
                        viewBox="0 0 12 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7.43005 1H4.04687C3.94137 1 3.88862 1 3.84205 1.0164C3.80086 1.03089 3.76336 1.05456 3.73223 1.08567C3.69704 1.12086 3.67345 1.16902 3.62627 1.26534L1.15745 6.30532C1.04478 6.53536 0.988447 6.65038 1.00198 6.74386C1.01379 6.82546 1.05803 6.89854 1.12428 6.94582C1.20015 7 1.32612 7 1.57806 7H5.22576L3.46234 13L10.6296 5.41319C10.8714 5.15722 10.9923 5.02924 10.9994 4.91973C11.0055 4.82468 10.967 4.73229 10.8957 4.67082C10.8136 4.6 10.6395 4.6 10.2911 4.6H6.10748L7.43005 1Z"
                          stroke="white"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Popular
                    </span>
                  </div>
                )}
                <div className="pricing-plan-name">{plan.name}</div>
                <div className="pricing-plan-price">
                  ${plan.price_usd}<span className="pricing-plan-price-suffix">/mo</span>
                </div>
                <div className="pricing-plan-desc">
                  {plan.is_unlimited 
                    ? "Unlimited access to all features"
                    : `${plan.content_words_limit.toLocaleString()} words, ${plan.images_limit} images, ${plan.serp_searches_limit} searches`
                  }
                </div>
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
              </div>
            ))
          ) : (
            // Fallback to default plans if API doesn't return plans
            <>
              // Basic Plan 
              <div className="pricing-plan-card">
                <div className="pricing-plan-name">Basic Plan</div>
                <div className="pricing-plan-price">
                  $29<span className="pricing-plan-price-suffix">/mo</span>
                </div>
                <div className="pricing-plan-desc">
                  For solo agents and freelancers managing a few clients.
                </div>
                <button
                  className="pricing-plan-btn"
                  onClick={() => onNavigateToBilling ? onNavigateToBilling() : alert("Basic Plan selected!")}
                >
                  Buy Credits
                </button>
              </div>

              // Standard Plan - Popular 
              <div className="pricing-plan-card-popular">
                <div className="pricing-popular-badge d-flex">
                  <span className="d-flex align-items-center justify-content-center">
                    <svg
                      className="me-1 svg-ic"
                      width="11"
                      height="11"
                      viewBox="0 0 12 14"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7.43005 1H4.04687C3.94137 1 3.88862 1 3.84205 1.0164C3.80086 1.03089 3.76336 1.05456 3.73223 1.08567C3.69704 1.12086 3.67345 1.16902 3.62627 1.26534L1.15745 6.30532C1.04478 6.53536 0.988447 6.65038 1.00198 6.74386C1.01379 6.82546 1.05803 6.89854 1.12428 6.94582C1.20015 7 1.32612 7 1.57806 7H5.22576L3.46234 13L10.6296 5.41319C10.8714 5.15722 10.9923 5.02924 10.9994 4.91973C11.0055 4.82468 10.967 4.73229 10.8957 4.67082C10.8136 4.6 10.6395 4.6 10.2911 4.6H6.10748L7.43005 1Z"
                        stroke="white"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Popular
                  </span>
                </div>
                <div className="pricing-plan-name">Standard Plan</div>
                <div className="pricing-plan-price">
                  $49<span className="pricing-plan-price-suffix">/mo</span>
                </div>
                <div className="pricing-plan-desc">
                  For growing agencies with content-heavy workflows.
                </div>
                <button
                  className="pricing-plan-btn"
                  onClick={() => onNavigateToBilling ? onNavigateToBilling() : alert("Standard Plan selected!")}
                >
                  Buy Credits
                </button>
              </div>

              // Pro Plan 
              <div className="pricing-plan-card">
                <div className="pricing-plan-name">Pro Plan (Unlimited*)</div>
                <div className="pricing-plan-price">
                  $79<span className="pricing-plan-price-suffix">/mo</span>
                </div>
                <div className="pricing-plan-desc">
                  For large agencies that need unlimited scale.
                </div>
                <button
                  className="pricing-plan-btn"
                  onClick={() => onNavigateToBilling ? onNavigateToBilling() : alert("Pro Plan selected!")}
                >
                  Buy Credits
                </button>
              </div>
            </>
          )} 
        </div>*/}

        {!plan?.is_trial ? (
          <>
            {" "}
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
                  <li className="d-flex align-items-center gap-2 justify-center">
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
                  <li className="d-flex align-items-center gap-2 justify-center">
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
                  <li className="d-flex align-items-center gap-2 justify-center">
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
            <div className="pricing-more-details-section">
              <h3 className="pricing-more-details-title">
                {" "}
                Need More Information?
              </h3>
              <p>Explore our full subscription details and benefits.</p>
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
            </div>
          </>
        ) : (
          <>
            <div className="pricing-more-details-section2 ">
              {/* <h3 className="pricing-more-details-title">
                {" "}
                Need More Information?
              </h3> 
              <p>Explore our full subscription details and benefits.</p>*/}
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
            </div>
          </>
        )}

        {/* For More Details Section */}
      </div>
    </div>
  );
};

export default PricingPopup;
