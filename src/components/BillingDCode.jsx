import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Swal from "sweetalert2";
import "./Billing.css";
import { BASE_URL } from "../api/api";

const BillingDCode = () => {
  const { user } = useAuth();
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

  const prices = useMemo(
    () => ({
      monthly: { basic: 29, standard: 49, pro: 79, suffix: "/mo" },
      annual: { basic: 290, standard: 490, pro: 790, suffix: "/yr" },
    }),
    []
  );
  const current = prices[billingCycle];

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
      // alert("Please login to start a free trial");
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
                  text:
                    verifyData.detail || verifyData.message || "Unknown error",
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
          text: `You saved ${data.coupon.discount_percentage}% on your subscription!`,
          icon: "success",
          confirmButtonColor: "#28a745",
        });
      } else {
        await Swal.fire({
          title: "Invalid Coupon",
          text: data.detail || "This coupon code is not valid",
          icon: "error",
          confirmButtonColor: "#dc3545",
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
          text:
            "Failed to change plan: " +
            (data.detail || data.message || "Unknown error"),
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
    }
  };

  const handleBuyAddon = async (addonType, amount, credits) => {
    if (!user) {
      // alert("Please login to purchase add-ons");
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
          description: `Add-on: ${addonType} - ${credits} credits`,
          order_id: data.order.id,
          handler: async function (response) {
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
                fetchMySubscription();
              } else {
                await Swal.fire({
                  title: "Purchase Failed",
                  text:
                    verifyData.detail || verifyData.message || "Unknown error",
                  icon: "error",
                  confirmButtonColor: "#dc3545",
                });
              }
            } catch (err) {
              await Swal.fire({
                title: "Purchase Failed",
                text: "Error verifying payment. Please contact support.",
                icon: "error",
                confirmButtonColor: "#dc3545",
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
        });
      }
    } catch (err) {
      await Swal.fire({
        title: "Purchase Failed",
        text: "Error initiating purchase. Please try again.",
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
      console.error("Error buying addon:", err);
    }
  };

  if (loading) {
    return (
      <div className="billing-page">
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p>Loading subscription plans...</p>
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

  const showSweetAlert = () => {
    // SweetAlert2 code
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
    script.onload = () => {
      window.Swal.fire({
        title: '<span class="swal2_title_Cancel">Cancel Subscription?</span>',
        html: '<div class="Cancel_Remain">Your Subscription will remain active until Oct 30, 2025. Are you sure you want to cancel?</div>',
        // icon: 'warning',
        // iconColor: '#28a745',
        iconHtml:
          '<svg xmlns="http://www.w3.org/2000/svg" width="86" height="86" viewBox="0 0 86 86" fill="none"><circle cx="43" cy="43" r="43" fill="#CFF3DE"/><path d="M43.5001 36.7278V45.1703M43.5001 53.6128H43.5201M40.7343 25.9461L24.306 55.9309C23.3948 57.5941 22.9392 58.4257 23.0065 59.1083C23.0653 59.7034 23.3604 60.2444 23.8185 60.5965C24.3437 61 25.2531 61 27.0718 61H59.9282C61.747 61 62.6562 61 63.1815 60.5965C63.6395 60.2444 63.9348 59.7034 63.9935 59.1083C64.0608 58.4257 63.6052 57.5941 62.694 55.9309L46.2657 25.9461C45.3579 24.2889 44.9039 23.4603 44.3117 23.1821C43.7949 22.9393 43.2051 22.9393 42.6886 23.1821C42.0962 23.4603 41.6421 24.289 40.7343 25.9461Z" stroke="#3ABF62" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        showCancelButton: true,
        confirmButtonColor: "#28a745",
        cancelButtonColor: "#d33",
        confirmButtonText: "Keep My Plan",
        cancelButtonText: "Cancel Now",
        reverseButtons: true,
        customClass: {
          popup: "swal2-popup-custom",
          title: "swal2-title",
          htmlContainer: "swal2-html-container",
          confirmButton: "swal2-confirm",
          cancelButton: "swal2-cancel",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          console.log("Keeping plan");
          window.Swal.fire({
            title: "Great!",
            text: "Your subscription remains active.",
            icon: "success",
            confirmButtonColor: "#28a745",
          });
        } else if (result.dismiss === window.Swal.DismissReason.cancel) {
          console.log("Subscription cancelled");
          window.Swal.fire({
            title:
              '<span class="swal2_title_Cancel">Subscription Cancelled</span>',
            html: '<div class="Cancel_Remain">Your Subscription has been successfully cancelled and will remain active untile Oct 30, 2025.</div>',
            iconHtml:
              '<svg xmlns="http://www.w3.org/2000/svg" width="86" height="86" viewBox="0 0 86 86" fill="none"><circle cx="43" cy="43" r="43" fill="#CFF3DE"/><path d="M62 40.7171V42.5111C61.9977 46.7161 60.636 50.8078 58.1181 54.1757C55.6005 57.5437 52.0614 60.0075 48.029 61.1998C43.9964 62.392 39.6867 62.2489 35.7422 60.7916C31.7978 59.3344 28.4301 56.6411 26.1414 53.1135C23.8527 49.5859 22.7656 45.4129 23.0423 41.2169C23.3189 37.0211 24.9446 33.027 27.6766 29.8305C30.4087 26.6339 34.1009 24.4062 38.2026 23.4795C42.3042 22.5527 46.5956 22.9767 50.4365 24.6882M62 26.9L42.5 46.4195L36.65 40.5695" stroke="#53C753" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
            text: "Your subscription has been cancelled.",
            icon: "error",
            confirmButtonText: "Done",
            confirmButtonColor: "#d33",
          });
        }
      });
    };

    // Check if SweetAlert2 is already loaded
    if (!window.Swal) {
      document.head.appendChild(script);
    } else {
      script.onload();
    }
  };
  // const showManageplan = () => {

  //   if (window.Swal) {
  //     window.Swal.fire({
  //       title: '<span class="swal2_title_Cancel style="display:block; text-align:left;">Cancel Subscription?</span>',
  //     });
  //     return;
  //   }

  //   const script = document.createElement("script");
  //   script.src = "https://cdn.jsdelivr.net/npm/sweetalert2@11";
  //   script.onload = () => {
  //     window.Swal.fire({
  //       title: '<span class="swal2_title_Cancel">Cancel Subscription?</span>',
  //     });
  //   };
  //   document.head.appendChild(script);
  // };
  const showManageplan = () => {
    if (window.Swal) {
      window.Swal.fire({
        showConfirmButton: false,
        html: `
      <div style="text-align:left; font-family:Inter, sans-serif;">
        <p class="swal2_title_Cancel mb-0" >Manage Plan</p>
        <p style="color:#424242; font-size:15px; margin-bottom:15px; padding-bottom:8px; border-bottom:1px solid #E5E7EB;">
          Update your plan or billing details
        </p>

        <div style="display:flex; flex-direction:column; gap:0; font-size:15px;">
          <div style="display:flex; justify-content:space-between; align-items:center; cursor:pointer; padding:8px 0; border-bottom:1px solid #E5E7EB;">
            <span class="Change_Plan_popup">Change Plan</span>
            <span style="color:#9CA3AF;">
              <svg xmlns="http://www.w3.org/2000/svg" width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M1 13L7 7L1 1" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; cursor:pointer; padding:8px 0; border-bottom:1px solid #E5E7EB;">
            <span class="Change_Plan_popup">Update Payment Method</span>
            <span style="color:#9CA3AF;">
              <svg xmlns="http://www.w3.org/2000/svg" width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M1 13L7 7L1 1" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; cursor:pointer; padding:8px 0; border-bottom:1px solid #E5E7EB;">
            <span class="Change_Plan_popup">View Invoices</span>
            <span style="color:#9CA3AF;">
              <svg xmlns="http://www.w3.org/2000/svg" width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M1 13L7 7L1 1" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </div>
          <div style="color:#DB2222; cursor:pointer; padding:8px 0;"  onClick={showSweetAlert}>Cancel Subscription</div>
        </div>

        <div style="text-align:right; margin-top:20px;">
          <button id="done-btn" style="
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

  return (
    <div className="billing-page">
      <div className="billing-header Billing_Header">
        <h1>Choose the plan that’s right for you</h1>
        <p className="mb-0">
          Whether you’re just starting out or scaling your business, we’ve got a
          plan to fit your needs.
        </p>
        {/* <div className="billing-toggle navtabs">
          <button 
            className={`tab ${billingCycle === 'monthly' ? 'active' : ''}`}
            onClick={() => setBillingCycle('monthly')}
          >
            Monthly Billing
          </button>
        </div> */}
      </div>
      <div className="Mange_Plan p-3 mb-4">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <p className="mb-0 Current_plan">
              Current Plan: Standard Plan - $49/mo
            </p>
            <p className="mb-0 Next_Renewal">Next Renewal: Oct 30, 2025</p>
          </div>
          <div className="d-flex align-items-center gap-3">
            <button className="btn Manage_btn px-3 " onClick={showManageplan}>
              Manage Plan
            </button>
            <button
              className="btn Cancel_Subscription px-3"
              onClick={showSweetAlert}
            >
              Cancel Subscription
            </button>
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
                  style={{ fontWeight: "600", fontSize: "16px" }}
                >
                  {plan.name}
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
                {plan.name.toLowerCase().includes("standard") && (
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
                <span>${plan.price_usd}</span>
                {current.suffix}
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
                    // User has paid subscription - show plan change
                    return changingPlan
                      ? "Processing..."
                      : plan.price_usd > mySubscription.plan.price_usd
                      ? "Upgrade"
                      : "Downgrade";
                  } else {
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
                </li>
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Coupon - Only show for trial users or users without paid subscriptions */}
      {(!mySubscription ||
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
      )}

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
            <div className="addon-price">$1</div>
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
                  handleBuyAddon("content_words", 10000, 5000);
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
            <div className="addon-price">$4</div>
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
                  handleBuyAddon("images", 40000, 50);
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
            <div className="addon-price">$2</div>
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
                  handleBuyAddon("serp_searches", 20000, 100);
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
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                style={{ fill: "#737373" }}
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
            <a href="#" className="contact-sales">
              Contact Our Sales Team
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingDCode;
