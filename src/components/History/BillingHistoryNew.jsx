import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getBillingHistoryApi } from "../../api/api";
import Pagination from "../Pagination";
import "./History.css";

const BillingHistoryNew = ({ subscriptionData }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Debug subscription data
  console.log('BillingHistoryNew - subscriptionData:', subscriptionData);
  console.log('BillingHistoryNew - plan name:', subscriptionData?.plan_name);

  useEffect(() => {
    if (user) {
      fetchBillingHistory(1);
    }
  }, [user]);

  const fetchBillingHistory = async (page = 1) => {
    try {
      // setLoading(true);
      setError(null);
      const response = await getBillingHistoryApi(page);
      const data = response?.data;
      const list = data?.billing_history || [];

      if (data?.status === "success") {
        setTransactions(Array.isArray(list) ? list : []);

        const apiCurrentPage = data?.pagination?.current_page || page || 1;
        const apiPageSize = data?.pagination?.limit || 10;
        const apiTotalPages = data?.pagination?.total_pages;
        const totalCount = data?.pagination?.total_count;

        let computedTotalPages = 1;
        if (typeof apiTotalPages === "number") {
          computedTotalPages = Math.max(1, apiTotalPages);
        } else if (typeof totalCount === "number" && typeof apiPageSize === "number" && apiPageSize > 0) {
          computedTotalPages = Math.max(1, Math.ceil(totalCount / apiPageSize));
        } else {
          computedTotalPages = list.length < apiPageSize ? apiCurrentPage : apiCurrentPage + 1;
        }

        setCurrentPage(apiCurrentPage);
        setTotalPages(computedTotalPages);
      } else {
        setError("Failed to fetch billing history");
      }
    } catch (err) {
      console.error("Error fetching billing history:", err);
      setError("Error loading billing history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    if (page !== currentPage) {
      fetchBillingHistory(page);
    }
  };

  const getPaymentMethodIcon = (paymentMethod, status) => {
    if (paymentMethod === "Subscription charged") {
      if (status === "Paid") {
        return (
          <svg
            width="31"
            height="31"
            viewBox="0 0 31 31"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="15.4601" cy="15.4601" r="15.4601" fill="#22C55E" />
            <path
              d="M17.4694 9.74131H19.9023L20.7923 8.35742H11.6542L10.7642 9.74131H12.307C13.9091 9.74131 15.3926 9.86165 15.9859 11.2455H11.6542L10.7642 12.6294H16.164V12.6896C16.164 13.7125 15.3332 15.2769 12.6037 15.2769H11.2389V16.6006L16.5793 23.3997H19.0122L13.4344 16.3599C15.7486 16.2396 17.8848 14.9159 18.1815 12.6294H19.9023L20.7923 11.2455H18.1221C18.0628 10.704 17.8254 10.1625 17.4694 9.74131Z"
              fill="white"
            />
          </svg>
        );
      } else {
        return (
          <svg
            width="31"
            height="31"
            viewBox="0 0 31 31"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="15.4601" cy="15.4601" r="15.4601" fill="#EF4444" />
            <path
              d="M6 22L15.5 6L25 22H6ZM8.42269 20.6286H22.5773L15.5 8.74286L8.42269 20.6286ZM15.5 19.5385C15.7145 19.5385 15.8943 19.4677 16.0395 19.3262C16.1846 19.1846 16.2572 19.0092 16.2572 18.8C16.2572 18.5908 16.1846 18.4154 16.0395 18.2738C15.8943 18.1323 15.7145 18.0615 15.5 18.0615C15.2855 18.0615 15.1057 18.1323 14.9605 18.2738C14.8154 18.4154 14.7428 18.5908 14.7428 18.8C14.7428 19.0092 14.8154 19.1846 14.9605 19.3262C15.1057 19.4677 15.2855 19.5385 15.5 19.5385ZM14.797 17.1472H16.203V12.5758H14.797V17.1472Z"
              fill="white"
            />
          </svg>
        );
      }
    } else if (paymentMethod === "Top-up purchased") {
      return (
        <svg
          width="31"
          height="33"
          viewBox="0 0 31 33"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="15.4601" cy="16.7297" r="15.4601" fill="#FCAF21" />
          <path
            d="M14.2443 22.7571V11.0384H16.233V22.7571H14.2443ZM9.37926 17.892V15.9034H21.098V17.892H9.37926Z"
            fill="white"
          />
        </svg>
      );
    } else if (paymentMethod === "Payment failed") {
      return (
        <svg
          width="31"
          height="31"
          viewBox="0 0 31 31"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="15.4601" cy="15.4601" r="15.4601" fill="#EF4444" />
          <path
            d="M6 22L15.5 6L25 22H6ZM8.42269 20.6286H22.5773L15.5 8.74286L8.42269 20.6286ZM15.5 19.5385C15.7145 19.5385 15.8943 19.4677 16.0395 19.3262C16.1846 19.1846 16.2572 19.0092 16.2572 18.8C16.2572 18.5908 16.1846 18.4154 16.0395 18.2738C15.8943 18.1323 15.7145 18.0615 15.5 18.0615C15.2855 18.0615 15.1057 18.1323 14.9605 18.2738C14.8154 18.4154 14.7428 18.5908 14.7428 18.8C14.7428 19.0092 14.8154 19.1846 14.9605 19.3262C15.1057 19.4677 15.2855 19.5385 15.5 19.5385ZM14.797 17.1472H16.203V12.5758H14.797V17.1472Z"
            fill="white"
          />
        </svg>
      );
    } else if (paymentMethod === "Refund issued") {
      return (
        <svg
          width="31"
          height="31"
          viewBox="0 0 31 31"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="15.4601" cy="15.4601" r="15.4601" fill="#3B82F6" />
          <path
            d="M16 26C14.7511 26 13.581 25.7621 12.4897 25.2863C11.3983 24.8105 10.4466 24.1638 9.63488 23.3462C8.82312 22.5287 8.18103 21.5702 7.70862 20.4709C7.23621 19.3718 7 18.1933 7 16.9355H8.58824C8.58824 19.015 9.30735 20.779 10.7456 22.2276C12.1838 23.6761 13.9353 24.4004 16 24.4004C18.0647 24.4004 19.8162 23.6761 21.2544 22.2276C22.6926 20.779 23.4118 19.015 23.4118 16.9355C23.4118 14.856 22.6926 13.092 21.2544 11.6435C19.8162 10.1949 18.0647 9.47065 16 9.47065H15.7189L17.4008 11.1646L16.2851 12.3212L12.6607 8.66072L16.3055 5L17.4212 6.15652L15.7189 7.87104H16C17.2489 7.87104 18.419 8.10894 19.5103 8.58474C20.6017 9.06053 21.5534 9.70722 22.3651 10.5248C23.1769 11.3424 23.819 12.3008 24.2914 13.4001C24.7638 14.4992 25 15.6777 25 16.9355C25 18.1933 24.7638 19.3718 24.2914 20.4709C23.819 21.5702 23.1769 22.5287 22.3651 23.3462C21.5534 24.1638 20.6017 24.8105 19.5103 25.2863C18.419 25.7621 17.2489 26 16 26Z"
            fill="white"
          />
        </svg>
      );
    }

    // Default icon
    return (
      <svg
        width="31"
        height="31"
        viewBox="0 0 31 31"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="15.4601" cy="15.4601" r="15.4601" fill="#6B7280" />
        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
      </svg>
    );
  };

  const getIconColor = (paymentMethod, status) => {
    if (paymentMethod === "Subscription charged") {
      return status === "Paid" ? "green" : "red";
    } else if (paymentMethod === "Top-up purchased") {
      return "orange";
    } else if (paymentMethod === "Payment failed") {
      return "red";
    } else if (paymentMethod === "Refund issued") {
      return "blue";
    }
    return "gray";
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case "paid":
        return "paid";
      case "pending":
        return "pending";
      case "failed":
        return "failed";
      case "refunded":
        return "refunded";
      default:
        return "pending";
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (err) {
      return dateString;
    }
  };

  const formatAmount = (amount, currency) => {
    console.log("formatAmount called with:", { amount, currency });
    if (typeof amount === "number") {
      return `${currency} ${amount.toLocaleString()}`;
    }
    return amount;
  };

  if (loading) {
    return (
      <div className="billing-history-container">
        <div className="billing-history-header">
          <h1 className="billing-history-title">Billing History</h1>
        </div>
        <div className="billing-history-card">
          <div className="table-responsive">
            <div className="transactions-table">
              <div className="table-header history">
                <div className="header-cell" style={{minWidth:"170px"}}>Payment Method</div>
                <div className="header-cell" style={{minWidth:"170px"}}>Plan</div>
                <div className="header-cell" style={{minWidth:"170px"}}>Date</div>
                <div className="header-cell" style={{minWidth:"170px"}}>Amount</div>
                <div className="header-cell" style={{minWidth:"170px"}}>Status</div>
              </div>
              <div className="table-body">
                {/* Skeleton loading rows */}
                {[1, 2, 3].map((index) => (
                  <div key={index} className="table-row historyrow skeleton-row">
                    <div className="table-cell payment-method skeleton-cell" style={{minWidth:"170px"}}>
                      <div className="skeleton-icon"></div>
                      <div className="skeleton-text"></div>
                    </div>
                    <div className="table-cell plan skeleton-cell" style={{minWidth:"170px"}}>
                      <div className="skeleton-text"></div>
                    </div>
                    <div className="table-cell date skeleton-cell" style={{minWidth:"170px"}}>
                      <div className="skeleton-text"></div>
                    </div>
                    <div className="table-cell amount skeleton-cell" style={{minWidth:"170px"}}>
                      <div className="skeleton-text"></div>
                    </div>
                    <div className="table-cell status skeleton-cell" style={{minWidth:"170px"}}>
                      <div className="skeleton-badge"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="billing-history-container">
        <div className="billing-history-header">
          <h1 className="billing-history-title">Billing History</h1>
        </div>
        <div className="billing-history-card">
          <div style={{ textAlign: "center", padding: "2rem", color: "red" }}>
            <p>{error}</p>
            <button
              onClick={fetchBillingHistory}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                backgroundColor: "#346BFD",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="billing-history-container">
      <div className="billing-history-header">
        <h1 className="billing-history-title">Billing History</h1>
        {/* <button className="view-all-btn">View all transactions</button> */}
      </div>

      <div className="billing-history-card">
        <div className="table-responsive">
          <div className="transactions-table">
            <div className="table-header history">
              <div className="header-cell" style={{minWidth:"170px"}}>Payment Method</div>
              <div className="header-cell" style={{minWidth:"170px"}}>Plan</div>
              <div className="header-cell" style={{minWidth:"170px"}}>Date</div>
              <div className="header-cell" style={{minWidth:"170px"}}>Amount</div>
              <div className="header-cell" style={{minWidth:"170px"}}>Status</div>
            </div>

            <div className="table-body">
              {transactions.length === 0 ? (
                <div className="table-row historyrow">
                  <div
                    className="table-cell"
                    style={{
                      textAlign: "center",
                      gridColumn: "1 / -1",
                      padding: "2rem",
                    }}
                  >
                    No billing history found
                  </div>
                </div>
              ) : (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="table-row historyrow">
                    <div className="table-cell payment-method" style={{minWidth:"170px"}}>
                      <div
                        className={`payment-icon ${getIconColor(
                          transaction.payment_method,
                          transaction.status
                        )}`}
                      >
                        {getPaymentMethodIcon(
                          transaction.payment_method,
                          transaction.status
                        )}
                      </div>
                      <span className="payment-text">
                        {transaction.payment_method}
                      </span>
                    </div>
                     <div className="table-cell plan" style={{minWidth:"170px"}}>
                       {transaction?.description || 'N/A'}
                     </div>
                    <div className="table-cell date" style={{minWidth:"170px"}}>
                      {formatDate(transaction.date)}
                    </div>
                    <div className="table-cell amount" style={{minWidth:"170px"}}>
                       {formatAmount(transaction.amount, transaction.currency_symbol || transaction.currency || "$")}
                    </div>
                    <div className="table-cell status" style={{minWidth:"170px"}}>
                      <span
                        className={`status-badge ${getStatusColor(
                          transaction.status
                        )}`}
                      >
                        {transaction.status?.toUpperCase() || "PENDING"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {transactions.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          forceShow={true}
        />
      )}
    </div>
  );
};

export default BillingHistoryNew;
