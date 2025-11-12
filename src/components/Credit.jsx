import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Swal from "sweetalert2";
import "./Credit.css";
import { BASE_URL } from "../api/api";
import Loading from "../assets/simbli_loader.gif";

const Credit = () => {
  const { user } = useAuth();
  const [mySubscription, setMySubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currency, setCurrency] = useState("INR");
  const [countryCode, setCountryCode] = useState("IN");
  const [addonPricing, setAddonPricing] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

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
    if (user) {
      fetchMySubscription();
    }
  }, [user]);

  const fetchMySubscription = async () => {
    try {
      setLoading(true);
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
        setUsage(data.usage);
      } else {
        setMySubscription(null);
        setUsage(null);
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
      setError("Failed to fetch usage data");
      setMySubscription(null);
      setUsage(null);
    } finally {
      setLoading(false);
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
                const addonTypeMap = {
                  content_words: "Content Words",
                  serp_searches: "Web Searches",
                  images: "Images"
                };
                const displayName = addonTypeMap[addonType] || addonType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
                const successText = verifyData.message || `Successfully purchased ${pricing.credits} ${displayName} credits! They have been added to your account.`;
                await Swal.fire({
                  title: "Add-on Purchased!",
                  text: successText,
                  icon: "success",
                  confirmButtonColor: "#28a745",
                  timer: 4000,
                  timerProgressBar: true,
                });
                fetchMySubscription(); // Refresh subscription data
              } else {
                // Hide loading state before showing error modal
                setPaymentProcessing(false);
                await Swal.fire({
                  title: "Purchase Failed",
                  text: verifyData.detail || "Unknown error",
                  icon: "error",
                  confirmButtonColor: "#dc3545",
                  timer: 4000,
                  timerProgressBar: true,
                });
              }
            } catch (err) {
              // Hide loading state before showing error modal
              setPaymentProcessing(false);
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
          title: "Purchase Failed",
          text: data.detail || "Unknown error",
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
  if (loading) {
    return (
      <div className="credit-dashboard">
        {/* <div className="credit-container">
          <h2 className="credit-title">Credit Usage Details</h2>
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <p>Loading usage data...</p>
          </div>
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
      <div className="credit-dashboard">
        <div className="credit-container">
          <h2 className="credit-title">Credit Usage Details</h2>
          <div style={{ textAlign: "center", padding: "2rem", color: "red" }}>
            <p>Error: {error}</p>
            <button
              onClick={fetchMySubscription}
              style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="credit-dashboard">
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
      <div className="credit-container">
        <h2 className="credit-title">Credit Usage Details</h2>

        <div className="credit-sections">
          {/* Images Section */}
          <div className="credit-section">
            <div className="section-header">
              <span className="section-label">Images</span>
              <span className="info-icon" data-tooltip="Alfred tracks how many Image Credits you've used this month.">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 6.4V10M10 13.6H10.009M19 10C19 14.9705 14.9705 19 10 19C5.02943 19 1 14.9705 1 10C1 5.02943 5.02943 1 10 1C14.9705 1 19 5.02943 19 10Z"
                    stroke="#8C8C8C"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            </div>
            <div className="usage-stats">
              <span className="used">
                {loading
                  ? "Loading..."
                  : usage && mySubscription?.plan
                  ? `${usage.images_used || 0}/${
                      mySubscription.plan.images_limit === -1
                        ? "∞"
                        : mySubscription.plan.images_limit +
                          (usage.addon_credits?.images || 0)
                    } Used`
                  : "No data"}
              </span>
              <span className="remaining">
                {loading
                  ? ""
                  : usage &&
                    mySubscription?.plan &&
                    mySubscription.plan.images_limit !== -1
                  ? `${Math.max(
                      0,
                      mySubscription.plan.images_limit +
                        (usage.addon_credits?.images || 0) -
                        (usage.images_used || 0)
                    )} Remaining`
                  : ""}
              </span>
            </div>
            <li className="d-flex  gap-2">
              <p className="mb-0">Additional 50 images</p>
            </li>
            <div
              className={`d-flex align-items-center gap-2 mt-2 buy-addon-btn ${
                mySubscription?.plan?.is_trial ? "disabled" : ""
              }`}
              style={{
                cursor: mySubscription?.plan?.is_trial
                  ? "not-allowed"
                  : "pointer",
                opacity: mySubscription?.plan?.is_trial ? 0.5 : 1,
                transition: "transform 0.3s ease",
              }}
              onMouseEnter={(e) => {
                if (!mySubscription?.plan?.is_trial) {
                  e.currentTarget.style.transform = "translateY(-3px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!mySubscription?.plan?.is_trial) {
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
              onClick={() => {
                if (!mySubscription?.plan?.is_trial) {
                  handleBuyAddon("images");
                }
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11 7V15M7 11H15M21 11C21 16.5228 16.5228 21 11 21C5.47715 21 1 16.5228 1 11C1 5.47715 5.47715 1 11 1C16.5228 1 21 5.47715 21 11Z"
                  stroke={mySubscription?.plan?.is_trial ? "#999" : "#3264FC"}
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <p
                className="top-up mb-0"
                style={{
                  color: mySubscription?.plan?.is_trial ? "#999" : "#3264FC",
                }}
              >
                {mySubscription?.plan?.is_trial
                  ? "Upgrade to Buy Add-ons"
                  : "Buy Top-Up ($4)"}
              </p>
            </div>
          </div>

          {/* Content Words Section 1 */}
          <div className="credit-section">
            <div className="section-header">
              <span className="section-label">Content Words</span>
              <span className="info-icon" data-tooltip="Alfred keeps count of all the Words created for your Content.">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 6.4V10M10 13.6H10.009M19 10C19 14.9705 14.9705 19 10 19C5.02943 19 1 14.9705 1 10C1 5.02943 5.02943 1 10 1C14.9705 1 19 5.02943 19 10Z"
                    stroke="#8C8C8C"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            </div>
            <div className="usage-stats">
              <span className="used">
                {loading
                  ? "Loading..."
                  : usage && mySubscription?.plan
                  ? `${(usage.content_words_used || 0).toLocaleString()}/${
                      mySubscription.plan.content_words_limit === -1
                        ? "∞"
                        : (
                            mySubscription.plan.content_words_limit +
                            (usage.addon_credits?.content_words || 0)
                          ).toLocaleString()
                    } Used`
                  : "No data"}
              </span>
              <span className="remaining">
                {/* 13,000 Remaining */}
                {loading
                  ? ""
                  : usage &&
                    mySubscription?.plan &&
                    mySubscription.plan.content_words_limit !== -1
                  ? `${Math.max(
                      0,
                      mySubscription.plan.content_words_limit +
                        (usage.addon_credits?.content_words || 0) -
                        (usage.content_words_used || 0)
                    ).toLocaleString()} Remaining`
                  : ""}
              </span>
            </div>
            <li className="d-flex  gap-2">
              <p className="mb-0">Additional 5,000 words/tokens</p>
            </li>
            <div
              className={`d-flex align-items-center gap-2 mt-2 buy-addon-btn ${
                mySubscription?.plan?.is_trial ? "disabled" : ""
              }`}
              style={{
                cursor: mySubscription?.plan?.is_trial
                  ? "not-allowed"
                  : "pointer",
                opacity: mySubscription?.plan?.is_trial ? 0.5 : 1,
                transition: "transform 0.3s ease",
              }}
              onMouseEnter={(e) => {
                if (!mySubscription?.plan?.is_trial) {
                  e.currentTarget.style.transform = "translateY(-3px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!mySubscription?.plan?.is_trial) {
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
              onClick={() => {
                if (!mySubscription?.plan?.is_trial) {
                  handleBuyAddon("content_words");
                }
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11 7V15M7 11H15M21 11C21 16.5228 16.5228 21 11 21C5.47715 21 1 16.5228 1 11C1 5.47715 5.47715 1 11 1C16.5228 1 21 5.47715 21 11Z"
                  stroke={mySubscription?.plan?.is_trial ? "#999" : "#3264FC"}
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <p
                className="top-up mb-0"
                style={{
                  color: mySubscription?.plan?.is_trial ? "#999" : "#3264FC",
                }}
              >
                {mySubscription?.plan?.is_trial
                  ? "Upgrade to Buy Add-ons"
                  : "Buy Top-Up ($2)"}
              </p>
            </div>
          </div>

          {/* SERP Searches Section */}
          <div className="credit-section">
            <div className="section-header">
              <span className="section-label">Web Searches</span>
              <span className="info-icon" data-tooltip="Alfred shows how many AI Web Searches you've used so far.">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 6.4V10M10 13.6H10.009M19 10C19 14.9705 14.9705 19 10 19C5.02943 19 1 14.9705 1 10C1 5.02943 5.02943 1 10 1C14.9705 1 19 5.02943 19 10Z"
                    stroke="#8C8C8C"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            </div>
            <div className="usage-stats">
              <span className="used">
                {loading
                  ? "Loading..."
                  : usage && mySubscription?.plan
                  ? `${usage.serp_searches_used || 0}/${
                      mySubscription.plan.serp_searches_limit === -1
                        ? "∞"
                        : mySubscription.plan.serp_searches_limit +
                          (usage.addon_credits?.serp_searches || 0)
                    } Used`
                  : "No data"}
              </span>
              <span className="remaining">
                {loading
                  ? ""
                  : usage &&
                    mySubscription?.plan &&
                    mySubscription.plan.serp_searches_limit !== -1
                  ? `${Math.max(
                      0,
                      mySubscription.plan.serp_searches_limit +
                        (usage.addon_credits?.serp_searches || 0) -
                        (usage.serp_searches_used || 0)
                    )} Remaining`
                  : ""}
              </span>
            </div>
            <li className="d-flex  gap-2">
              <p className="mb-0">Additional 100 Searches</p>
            </li>
            <div
              className={`d-flex align-items-center gap-2 mt-2 buy-addon-btn ${
                mySubscription?.plan?.is_trial ? "disabled" : ""
              }`}
              style={{
                cursor: mySubscription?.plan?.is_trial
                  ? "not-allowed"
                  : "pointer",
                opacity: mySubscription?.plan?.is_trial ? 0.5 : 1,
                transition: "transform 0.3s ease",
              }}
              onMouseEnter={(e) => {
                if (!mySubscription?.plan?.is_trial) {
                  e.currentTarget.style.transform = "translateY(-3px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!mySubscription?.plan?.is_trial) {
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
              onClick={() => {
                if (!mySubscription?.plan?.is_trial) {
                  handleBuyAddon("serp_searches");
                }
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11 7V15M7 11H15M21 11C21 16.5228 16.5228 21 11 21C5.47715 21 1 16.5228 1 11C1 5.47715 5.47715 1 11 1C16.5228 1 21 5.47715 21 11Z"
                  stroke={mySubscription?.plan?.is_trial ? "#999" : "#3264FC"}
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <p
                className="top-up mb-0"
                style={{
                  color: mySubscription?.plan?.is_trial ? "#999" : "#3264FC",
                }}
              >
                {mySubscription?.plan?.is_trial
                  ? "Upgrade to Buy Add-ons"
                  : "Buy Top-Up ($2)"}
              </p>
            </div>
          </div>
        </div>

        {/* Warning Message */}
        <div className="warning-box">
          <div className="warning-content d-flex align-items-start gap-2">
            <span className="warning-icon">
              <svg
                width="23"
                height="20"
                viewBox="0 0 23 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.2635 7.50414V11.5041M11.2635 15.5041H11.2735M9.87877 2.39586L1.65386 16.6024C1.19765 17.3904 0.969554 17.7844 1.00326 18.1078C1.03267 18.3898 1.18044 18.6461 1.4098 18.8129C1.67275 19.0041 2.12802 19.0041 3.03854 19.0041H19.4883C20.3989 19.0041 20.8541 19.0041 21.1171 18.8129C21.3464 18.6461 21.4942 18.3898 21.5236 18.1078C21.5573 17.7844 21.3292 17.3904 20.873 16.6024L12.6481 2.39586C12.1936 1.61069 11.9663 1.21811 11.6698 1.08626C11.4111 0.971248 11.1158 0.971248 10.8572 1.08626C10.5606 1.21811 10.3333 1.6107 9.87877 2.39586Z"
                  stroke="#FF7700"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
            <div>
              <span className="warning-text">Credits reset monthly</span>
              <div>
                <p className="warning-textt">
                  Unused credits do not roll over. Your credits will refresh on
                  your next billing date.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trial User Information */}
        {mySubscription?.plan?.is_trial && (
          <div
            className="warning-box"
            style={{ backgroundColor: "#E3F2FD", border: "1px solid #2196F3" }}
          >
            <div className="warning-content d-flex align-items-start gap-2">
              <span className="warning-icon">
                <svg
                  width="23"
                  height="20"
                  viewBox="0 0 23 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.2635 7.50414V11.5041M11.2635 15.5041H11.2735M9.87877 2.39586L1.65386 16.6024C1.19765 17.3904 0.969554 17.7844 1.00326 18.1078C1.03267 18.3898 1.18044 18.6461 1.4098 18.8129C1.67275 19.0041 2.12802 19.0041 3.03854 19.0041H19.4883C20.3989 19.0041 20.8541 19.0041 21.1171 18.8129C21.3464 18.6461 21.4942 18.3898 21.5236 18.1078C21.5573 17.7844 21.3292 17.3904 20.873 16.6024L12.6481 2.39586C12.1936 1.61069 11.9663 1.21811 11.6698 1.08626C11.4111 0.971248 11.1158 0.971248 10.8572 1.08626C10.5606 1.21811 10.3333 1.6107 9.87877 2.39586Z"
                    stroke="#2196F3"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
              <div>
                <span className="warning-text" style={{ color: "#1976D2" }}>
                  Trial Account - Limited Features
                </span>
                <div>
                  <p className="warning-textt" style={{ color: "#1976D2" }}>
                    You're currently on a trial account with reduced credits.
                    Upgrade to a full subscription to unlock add-on purchases
                    and get full plan credits.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Credit;
