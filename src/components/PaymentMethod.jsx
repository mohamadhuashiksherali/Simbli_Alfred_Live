import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import Swal from "sweetalert2";
import "./PaymentMethod.css";
import { BASE_URL } from "../api/api";

const PaymentMethod = () => {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [mySubscription, setMySubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingCard, setAddingCard] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
    fetchMySubscription();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const token = localStorage.getItem("access-token");
      const response = await fetch(
        `${BASE_URL}/subscription/payment-methods`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      if (response.ok) {
        setPaymentMethods(data.payment_methods || []);
      } else {
        setError(
          data.detail || data.message || "Failed to fetch payment methods"
        );
      }
    } catch (err) {
      console.error("Error fetching payment methods:", err);
      setError("Error fetching payment methods. Please try again.");
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

      if (response.ok) {
        setMySubscription(data);
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = () => {
    setAddingCard(true);

    // For demo purposes, we'll simulate adding a card
    // In a real implementation, you would integrate with Razorpay's card collection
    Swal.fire({
      title: "Add Payment Method",
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Card Number</label>
            <input type="text" id="cardNumber" placeholder="1234 5678 9012 3456" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Cardholder Name</label>
            <input type="text" id="cardName" placeholder="John Doe" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <div style="display: flex; gap: 10px;">
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">Expiry Month</label>
              <select id="expiryMonth" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <option value="">Month</option>
                ${Array.from(
                  { length: 12 },
                  (_, i) => `<option value="${i + 1}">${i + 1}</option>`
                ).join("")}
              </select>
            </div>
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">Expiry Year</label>
              <select id="expiryYear" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <option value="">Year</option>
                ${Array.from(
                  { length: 10 },
                  (_, i) => `<option value="${2024 + i}">${2024 + i}</option>`
                ).join("")}
              </select>
            </div>
            <div style="flex: 1;">
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">CVV</label>
              <input type="text" id="cvv" placeholder="123" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Add Card",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      preConfirm: () => {
        const cardNumber = document.getElementById("cardNumber").value;
        const cardName = document.getElementById("cardName").value;
        const expiryMonth = document.getElementById("expiryMonth").value;
        const expiryYear = document.getElementById("expiryYear").value;
        const cvv = document.getElementById("cvv").value;

        if (!cardNumber || !cardName || !expiryMonth || !expiryYear || !cvv) {
          Swal.showValidationMessage("Please fill in all fields");
          return false;
        }

        return {
          cardNumber,
          cardName,
          expiryMonth: parseInt(expiryMonth),
          expiryYear: parseInt(expiryYear),
          cvv,
        };
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const token = localStorage.getItem("access-token");
          const response = await fetch(
            `${BASE_URL}/subscription/add-payment-method`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                card_token: "demo_token_" + Date.now(), // In real implementation, this would come from Razorpay
                card_last_four: result.value.cardNumber.slice(-4),
                card_brand: result.value.cardNumber.startsWith("4")
                  ? "visa"
                  : "mastercard",
                card_expiry_month: result.value.expiryMonth,
                card_expiry_year: result.value.expiryYear,
                card_holder_name: result.value.cardName,
              }),
            }
          );

          const data = await response.json();

          if (response.ok) {
            Swal.fire({
              title: "Success!",
              text: "Payment method added successfully",
              icon: "success",
              confirmButtonColor: "#dc3545",
            });
            fetchPaymentMethods();
          } else {
            Swal.fire({
              title: "Error",
              text:
                data.detail || data.message || "Failed to add payment method",
              icon: "error",
              confirmButtonColor: "#dc3545",
            });
          }
        } catch (err) {
          console.error("Error adding payment method:", err);
          Swal.fire({
            title: "Error",
            text: "Error adding payment method. Please try again.",
            icon: "error",
            confirmButtonColor: "#dc3545",
          });
        }
      }
      setAddingCard(false);
    });
  };

  const handleUpdateCard = (methodId) => {
    Swal.fire({
      title: "Update Card",
      text: "This feature will be available soon. For now, you can delete this card and add a new one.",
      icon: "info",
      confirmButtonColor: "#dc3545",
    });
  };

  const handleDeleteCard = async (methodId) => {
    const result = await Swal.fire({
      title: "Delete Payment Method",
      text: "Are you sure you want to delete this payment method?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
    });

    if (result.isConfirmed) {
      try {
        const token = localStorage.getItem("access-token");
        const response = await fetch(
          `${BASE_URL}/subscription/payment-methods/${methodId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          Swal.fire({
            title: "Deleted!",
            text: "Payment method deleted successfully",
            icon: "success",
            confirmButtonColor: "#dc3545",
          });
          fetchPaymentMethods();
        } else {
          Swal.fire({
            title: "Error",
            text:
              data.detail || data.message || "Failed to delete payment method",
            icon: "error",
            confirmButtonColor: "#dc3545",
          });
        }
      } catch (err) {
        console.error("Error deleting payment method:", err);
        Swal.fire({
          title: "Error",
          text: "Error deleting payment method. Please try again.",
          icon: "error",
          confirmButtonColor: "#dc3545",
        });
      }
    }
  };

  const getCardBrandIcon = (brand) => {
    switch (brand?.toLowerCase()) {
      case "visa":
        return (
          <div className="card-brand visa">
            <span>VISA</span>
          </div>
        );
      case "mastercard":
        return (
          <div className="card-brand mastercard">
            <span>MC</span>
          </div>
        );
      default:
        return (
          <div className="card-brand default">
            <span>••••</span>
          </div>
        );
    }
  };

  const getSubscriptionStatus = () => {
    if (!mySubscription) return null;

    if (mySubscription.trial_info && mySubscription.trial_info.is_trial) {
      return {
        status: "Trial Active",
        nextPayment: `Trial ends on ${new Date(
          mySubscription.trial_info.trial_ends_at
        ).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`,
        isActive: true,
      };
    }

    if (mySubscription.status === "active") {
      return {
        status: "Subscription Active",
        nextPayment: `Next payment of ₹${(
          mySubscription.plan.price_inr / 100
        ).toLocaleString()} scheduled for ${new Date(
          mySubscription.current_period_end
        ).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}.`,
        isActive: true,
      };
    }

    return {
      status: "No Active Subscription",
      nextPayment: "Add a payment method to activate your subscription",
      isActive: false,
    };
  };

  if (loading) {
    return (
      <div className="payment-method-container">
        <div className="loading-message">Loading payment methods...</div>
      </div>
    );
  }

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <div className="payment-method-container">
      <h1 className="payment-method-title">Payment Method</h1>

      <div className="payment-method-card">
        {/* Header Banner */}
        <div className="payment-header-banner">
          <div className="banner-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
          </div>
          <span>Manage your payment information</span>
        </div>

        {/* Payment Methods Section */}
        {paymentMethods.length > 0 ? (
          <div className="payment-methods-section">
            {paymentMethods.map((method) => (
              <div key={method.id} className="payment-method-item">
                <div className="payment-method-info">
                  {getCardBrandIcon(method.card_brand)}
                  <div className="card-details">
                    <div className="card-number">
                      {method.card_brand === "visa"
                        ? "Visa"
                        : method.card_brand === "mastercard"
                        ? "Mastercard"
                        : "Card"}{" "}
                      .... {method.card_last_four}
                    </div>
                    <div className="card-expiry">
                      Exp {String(method.card_expiry_month).padStart(2, "0")}/
                      {String(method.card_expiry_year).slice(-2)}
                    </div>
                  </div>
                </div>
                <button
                  className="update-card-btn"
                  onClick={() => handleUpdateCard(method.id)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  Update Card
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-payment-method">
            <div className="no-payment-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="9" x2="15" y2="15"></line>
                <line x1="15" y1="9" x2="9" y2="15"></line>
              </svg>
            </div>
            <div className="no-payment-text">
              <div className="no-payment-title">No Payment method Added</div>
              <div className="no-payment-subtitle">
                Add a card to activate your subscription
              </div>
            </div>
            <button
              className="add-card-btn"
              onClick={handleAddCard}
              disabled={addingCard}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Card
            </button>
          </div>
        )}

        {/* Subscription Status */}
        {subscriptionStatus && (
          <div
            className={`subscription-status ${
              subscriptionStatus.isActive ? "active" : "inactive"
            }`}
          >
            <div className="status-icon">
              {subscriptionStatus.isActive ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              )}
            </div>
            <div className="status-info">
              <div className="status-title">{subscriptionStatus.status}</div>
              <div className="status-details">
                {subscriptionStatus.nextPayment}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethod;
