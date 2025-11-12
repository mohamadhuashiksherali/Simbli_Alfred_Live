import React, { useState, useEffect } from "react";
import { BASE_URL, getSubscriptionInvoicesApi } from "../../api/api";
import Pagination from "../Pagination";
import "./invoice.css";

const InvoiceNew = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // const itemsPerPage = 10;

  useEffect(() => {
    fetchInvoices(1);
  }, []);

  const fetchInvoices = async (page = 1) => {
    try {
      // setLoading(true);
      setError(null);
      const response = await getSubscriptionInvoicesApi(page);
      console.log("response",response)

      const data = response?.data ;
      // const statusOk = data?.status ? data.status === "success" : true;
      const list = data?.invoices || [];

      if (data?.status === "success") {
        setInvoices(Array.isArray(list) ? list : []);

        const apiCurrentPage = data?.pagination?.current_page || 1;
        const apiPageSize = data?.pagination?.limit || 10
        const apiTotalPages = data?.pagination?.total_pages;
        const totalCount = data?.pagination?.total_count;

        let computedTotalPages = 1;
        if (typeof apiTotalPages === "number") {
          computedTotalPages = Math.max(1, apiTotalPages);
        } else if (typeof totalCount === "number" && typeof apiPageSize === "number" && apiPageSize > 0) {
          computedTotalPages = Math.max(1, Math.ceil(totalCount / apiPageSize));
        } else {
          // Fallback: if less than requested page size and not first page, keep at least current page
          computedTotalPages = list.length < itemsPerPage ? apiCurrentPage : apiCurrentPage + 1;
        }

        setCurrentPage(apiCurrentPage);
        setTotalPages(computedTotalPages);
      } else {
        setError("Failed to fetch invoices");
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setError("Error loading invoices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

 const handlePageChange = (page) => {
    if (page !== currentPage) {
      fetchInvoices(page);
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

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case "paid":
        return "paid";
      case "pending":
        return "pending";
      case "failed":
      case "cancelled":
        return "failed";
      default:
        return "pending";
    }
  };

  const handleDownload = async (invoice) => {
    try {
      const token = localStorage.getItem("access-token");
      if (!token) {
        throw new Error("Please log in to download invoices");
      }

      // Determine invoice type and ID from the invoice data
      const invoiceType =
        invoice.type === "subscription" ? "subscription" : "addon";
      const invoiceId = invoice.id;

      console.log(
        "Downloading invoice:",
        invoice.invoice_id,
        "Type:",
        invoiceType,
        "ID:",
        invoiceId
      );

      const response = await fetch(
        `${BASE_URL}/subscription/invoice/${invoiceType}/${invoiceId}/download`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to download invoice: ${response.status}`);
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // Use plan name for filename (match backend behavior)
      const planName = invoice.plan_name || "Subscription";
      // Clean plan name: replace spaces and special chars with underscore, remove multiple underscores, trim
      const safePlanName = planName
        .replace(/[^a-zA-Z0-9]/g, "_")
        .replace(/_+/g, "_")  // Replace multiple underscores with single underscore
        .replace(/^_+|_+$/g, "");  // Remove leading/trailing underscores
      link.download = `invoice_${safePlanName}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log("Invoice downloaded successfully");
    } catch (error) {
      console.error("Error downloading invoice:", error);
      alert(`Error downloading invoice: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="invoice-container">
        <div className="invoice-header">
          <h1 className="invoice-title">Invoice</h1>
        </div>
        <div className="invoice-card">
          <div className="table-responsive">
            <div className="invoice-table">
              <div className="table-header Tabel_Header">
                <div className="header-cell" style={{minWidth:"150px"}}>Date</div>
                <div className="header-cell" style={{minWidth:"170px"}}>Invoice ID</div>
                <div className="header-cell" style={{minWidth:"190px"}}>Plan</div>
                <div className="header-cell" style={{minWidth:"150px"}}>Amount</div>
                <div className="header-cell" style={{minWidth:"150px"}}>Status</div>
                <div className="header-cell" style={{minWidth:"85px"}}>Download</div>
              </div>
              <div className="table-body">
                {/* Skeleton loading rows */}
                {[1, 2, 3].map((index) => (
                  <div key={index} className="table-row Tabel_Row skeleton-row">
                    <div className="table-cell date skeleton-cell" style={{minWidth:"150px"}}>
                      <div className="skeleton-text"></div>
                    </div>
                    <div className="table-cell invoice-id skeleton-cell" style={{minWidth:"170px"}}>
                      <div className="skeleton-text"></div>
                    </div>
                    <div className="table-cell plan skeleton-cell" style={{minWidth:"190px"}}>
                      <div className="skeleton-text"></div>
                    </div>
                    <div className="table-cell amount skeleton-cell" style={{minWidth:"150px"}}>
                      <div className="skeleton-text"></div>
                    </div>
                    <div className="table-cell status skeleton-cell" style={{minWidth:"150px"}}>
                      <div className="skeleton-badge"></div>
                    </div>
                    <div className="table-cell download skeleton-cell" style={{minWidth:"85px"}}>
                      <div className="skeleton-button"></div>
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
      <div className="invoice-container">
        <div className="invoice-header">
          <h1 className="invoice-title">Invoice</h1>
        </div>
        <div className="invoice-card">
          <div style={{ textAlign: "center", padding: "2rem", color: "red" }}>
            <p>{error}</p>
            <button
              onClick={fetchInvoices}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                backgroundColor: "#84E084",
                color: "#222222",
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
    <div className="invoice-container">
      <div className="invoice-header">
        <h1 className="invoice-title">Invoice</h1>
        {/* <button className="view-all-btn">View all transactions</button> */}
      </div>

      <div className="invoice-card">
        <div className="table-responsive">
          <div className="invoice-table">
            <div className="table-header Tabel_Header">
              <div className="header-cell" style={{minWidth:"150px"}}>Date</div>
              <div className="header-cell" style={{minWidth:"170px"}}>Invoice ID</div>
              <div className="header-cell" style={{minWidth:"190px"}}>Plan</div>
              <div className="header-cell" style={{minWidth:"150px"}}>Amount</div>
              <div className="header-cell" style={{minWidth:"150px"}}>Status</div>
              <div className="header-cell" style={{minWidth:"85px"}}>Download</div>
            </div>

            <div className="table-body">
              {invoices.length === 0 ? (
                <div className="table-row ">
                  <div
                    className="table-cell"
                    style={{
                      textAlign: "center",
                      gridColumn: "1 / -1",
                      padding: "2rem",
                    }}
                  >
                    No invoices found
                  </div>
                </div>
              ) : (
                invoices.map((invoice) => (
                  <div
                    key={invoice.id || invoice.invoice_id}
                    className="table-row Tabel_Row"
                  >
                    <div className="table-cell date" style={{minWidth:"150px"}}>
                      {formatDate(invoice.created_at || invoice.date)}
                    </div>
                    <div className="table-cell invoice-id" style={{minWidth:"170px"}}>
                      {invoice.invoice_id ||
                        invoice.invoiceId ||
                        `INV-${invoice.id}`}
                    </div>
                    <div className="table-cell plan" style={{minWidth:"190px"}}>
                      {invoice.plan_name || "N/A"}
                    </div>
                    <div className="table-cell amount" style={{minWidth:"150px"}}>
                      {formatAmount(invoice.amount, invoice.currency_symbol || invoice.currency || "$")}
                    </div>
                    <div className="table-cell status" style={{minWidth:"150px"}}>
                      <span
                        className={`status-badge ${getStatusColor(
                          invoice.status
                        )}`}
                      >
                        {invoice.status || "Pending"}
                      </span>
                    </div>
                    <div className="table-cell download " style={{minWidth:"85px"}}>
                      <button
                        className="download-btn"
                        onClick={() => handleDownload(invoice)}
                        title="Download Invoice"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
                            stroke="#346BFD"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M7 10L12 15L17 10"
                            stroke="#346BFD"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M12 15V3"
                            stroke="#346BFD"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
        {invoices.length > 0 && (
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

export default InvoiceNew;
