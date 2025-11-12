import React, { useState } from "react";
import "./Profile.css";
import Goggle from "../assets/Google_Favicon.svg"
const Profilepop = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("basic-info");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [userName, setUserName] = useState("Sudharshan");
  const [phoneNumber, setPhoneNumber] = useState("+91 98394 45989");
  const [deleteCheckbox, setDeleteCheckbox] = useState(false);

  const openPopup = () => {
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    setActiveTab("basic-info");
    setShowDeleteConfirmation(false);
    setDeleteCheckbox(false);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      closePopup();
    }
  };

  const handleUpdate = () => {
    alert("Profile updated successfully!");
    closePopup();
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirmation(true);
  };

  const handleBackFromDelete = () => {
    setShowDeleteConfirmation(false);
    setDeleteCheckbox(false);
  };

  const handleConfirmDelete = () => {
    if (deleteCheckbox) {
      alert("Account deletion confirmed!");
      setShowDeleteConfirmation(false);
      closePopup();
    } else {
      alert("Please confirm by checking the box");
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Reset delete confirmation state when switching tabs
    setShowDeleteConfirmation(false);
    setDeleteCheckbox(false);
  };

  const tabs = [
    { id: "basic-info", label: "Basic Info", icon: "person" },
    // { id: "email-notifications", label: "Email Notifications", icon: "envelope" },
    { id: "signin-security", label: "Sign-in & Security", icon: "lock" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "basic-info":
        return (
          <div className="Profile_Background">
            <div className="exact-profile-content-section">
              {/* Profile Picture */}
              <div className="exact-profile-picture-wrapper">
                <div className="exact-profile-picture-frame">
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face"
                    alt="Profile"
                    className="exact-profile-picture-img"
                  />
                </div>
                <button className="exact-profile-edit-icon-btn">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                  >
                    <path
                      d="M1.11109 13.9982C1.14912 13.6559 1.16814 13.4848 1.21992 13.3249C1.26586 13.1829 1.33078 13.0479 1.4129 12.9233C1.50546 12.7829 1.62723 12.6612 1.87075 12.4177L12.8028 1.48557C13.7172 0.571215 15.1996 0.571215 16.114 1.48557C17.0284 2.39993 17.0284 3.8824 16.114 4.79676L5.18192 15.7289C4.93839 15.9724 4.81663 16.0941 4.67627 16.1867C4.55174 16.2689 4.41668 16.3338 4.27476 16.3797C4.11479 16.4314 3.94365 16.4505 3.60137 16.4886L0.799805 16.7998L1.11109 13.9982Z"
                      stroke="white"
                      stroke-width="1.6"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
              </div>

              {/* User Information Fields */}
              <div className="exact-profile-fields-container">
                {/* User Name Field */}
                <div className="exact-profile-field-row">
                  <label className="exact-profile-field-title">User Name</label>
                  <div className="exact-profile-field-input-box">
                    <svg
                      className="exact-profile-field-icon"
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="19"
                      viewBox="0 0 20 19"
                      fill="none"
                    >
                      <path
                        d="M0.900391 17.9004C3.23618 15.423 6.40741 13.9004 9.90039 13.9004C13.3934 13.9004 16.5646 15.423 18.9004 17.9004M14.4004 5.40039C14.4004 7.88567 12.3857 9.90039 9.90039 9.90039C7.41511 9.90039 5.40039 7.88567 5.40039 5.40039C5.40039 2.91511 7.41511 0.900391 9.90039 0.900391C12.3857 0.900391 14.4004 2.91511 14.4004 5.40039Z"
                        stroke="black"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="exact-profile-field-input"
                      placeholder="Enter user name"
                    />
                  </div>
                </div>

                {/* Phone Number Field */}
                <div className="exact-profile-field-row">
                  <label className="exact-profile-field-title">
                    Phone Number
                  </label>
                  <div className="exact-profile-field-input-box">
                    <svg
                      className="exact-profile-field-icon"
                      xmlns="http://www.w3.org/2000/svg"
                      width="21"
                      height="21"
                      viewBox="0 0 21 21"
                      fill="none"
                    >
                      <path
                        d="M6.35098 7.19905C7.04697 8.6487 7.9958 10.0073 9.1973 11.2089C10.3989 12.4105 11.7576 13.3593 13.2072 14.0553C13.3319 14.1151 13.3942 14.1451 13.4731 14.1681C13.7535 14.2498 14.0977 14.1911 14.3351 14.0211C14.402 13.9732 14.4591 13.9161 14.5734 13.8018C14.923 13.4521 15.0978 13.2773 15.2736 13.1631C15.9365 12.7321 16.7911 12.7321 17.454 13.1631C17.6298 13.2773 17.8046 13.4521 18.1542 13.8018L18.349 13.9966C18.8805 14.5281 19.1462 14.7938 19.2905 15.0792C19.5776 15.6467 19.5776 16.317 19.2905 16.8846C19.1462 17.1699 18.8805 17.4357 18.349 17.9671L18.1914 18.1247C17.6618 18.6544 17.397 18.9192 17.0369 19.1214C16.6374 19.3458 16.0169 19.5072 15.5587 19.5058C15.1458 19.5046 14.8635 19.4245 14.2991 19.2643C11.2657 18.4033 8.4033 16.7789 6.01536 14.3909C3.62738 12.0029 2.00291 9.1405 1.14194 6.10714C0.981729 5.54269 0.901619 5.26047 0.900399 4.84752C0.899029 4.3893 1.06039 3.76881 1.28481 3.3693C1.48706 3.00927 1.75187 2.74446 2.2815 2.21483L2.43913 2.0572C2.97057 1.52576 3.2363 1.26003 3.52168 1.11569C4.08924 0.828623 4.7595 0.828623 5.32706 1.11569C5.61244 1.26003 5.87817 1.52576 6.40961 2.0572L6.60448 2.25207C6.95408 2.60167 7.12889 2.77648 7.24317 2.95225C7.67417 3.61515 7.67417 4.46973 7.24317 5.13262C7.12889 5.30839 6.95408 5.4832 6.60448 5.8328C6.49017 5.94712 6.43301 6.00427 6.38517 6.07108C6.21516 6.30851 6.15646 6.65277 6.23818 6.93313C6.26118 7.01202 6.29111 7.07436 6.35098 7.19905Z"
                        stroke="black"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="exact-profile-field-input"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="exact-profile-buttons-row">
                  <button className="exact-profile-edit-text-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="19" viewBox="0 0 20 19" fill="none">
<path d="M9.84958 17.9709H18.8496M0.849609 17.9709H2.52415C3.01334 17.9709 3.25793 17.9709 3.4881 17.9156C3.69217 17.8666 3.88726 17.7858 4.06621 17.6762C4.26804 17.5525 4.44099 17.3795 4.7869 17.0336L17.3497 4.47092C18.1781 3.6425 18.1781 2.29935 17.3497 1.47092C16.5212 0.642504 15.1781 0.642504 14.3497 1.47092L1.78687 14.0336C1.44097 14.3795 1.26801 14.5525 1.14433 14.7543C1.03467 14.9333 0.953859 15.1283 0.904869 15.3324C0.849609 15.5626 0.849609 15.8072 0.849609 16.2964V17.9709Z" stroke="#8D8D8D" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
                    <div className="Edit_Icon">Edit</div>
                  </button>
                  <button
                    className="exact-profile-update-main-btn"
                    onClick={handleUpdate}
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case "email-notifications":
        return (
          <div className="exact-profile-content-section">
            <h4 className="exact-profile-placeholder-title">
              Email Notifications
            </h4>
            <p className="exact-profile-placeholder-text">
              Manage your email notification preferences here.
            </p>
          </div>
        );
      case "signin-security":
        return (
         

          <div className="exact-profile-security-section">
            <h4 className="exact-profile-auth-heading">Authentication</h4>
            <div className="exact-profile-field-row">
              <div className="Authentication_pass">
                <label className="exact-profile-field-title">
                Sign-in Method
              </label>
              <a href="#" className="exact-profile-change-password-link">
                  Change Password
                  
                </a>
              </div>
              <div className="exact-profile-google-signin-box">
                {/* <div className="exact-profile-google-g-icon">G</div> */}
                <img src={Goggle} alt="" className="Goggle_Icon"/>
                <span className="exact-profile-google-email-text">
                  Sudharshanm@gmail.com
                </span>
                
              </div>
            </div>
            <button
              className="exact-profile-delete-my-account-btn"
              onClick={handleDeleteAccount}
            >
              Delete my account
            </button>
          </div>
         
        );
      default:
        return null;
    }
  };

  return (
    <div className="exact-profile-wrapper">
      {/* Profile Button - Top Right */}
      <button className="exact-profile-open-btn" onClick={openPopup}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Profile
      </button>

      {/* Popup Modal */}
      {isPopupOpen && (
        <div
          className="exact-profile-overlay-backdrop"
          onClick={handleOverlayClick}
        >
          <div className="exact-profile-popup-box">
            {/* Close Button */}
            <button
              className="exact-profile-close-icon"
              onClick={closePopup}
              aria-label="Close"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 17 17"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16 1L1 16M1 1L16 16"
                  stroke="#545454"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Popup Content with Tabs */}
            <div className="exact-profile-layout-grid">
              {/* Left Navigation Tabs */}
              <div className="exact-profile-sidebar-menu">
                <h3 className="exact-profile-main-title">Profile</h3>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`exact-profile-menu-item ${
                      activeTab === tab.id
                        ? "exact-profile-menu-item-selected"
                        : ""
                    }`}
                    onClick={() => handleTabChange(tab.id)}
                  >
                    <div className="exact-profile-menu-icon">
                      {tab.icon === "person" && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="20"
                          viewBox="0 0 19 20"
                          fill="none"
                        >
                          <path
                            d="M9.25769 12.9004C6.08759 12.9004 3.26846 14.431 1.47366 16.8064C1.08737 17.3176 0.894221 17.5732 0.900541 17.9187C0.905421 18.1856 1.07302 18.5223 1.28303 18.6871C1.55485 18.9004 1.93153 18.9004 2.68489 18.9004H15.8304C16.5838 18.9004 16.9605 18.9004 17.2323 18.6871C17.4423 18.5223 17.6099 18.1856 17.6148 17.9187C17.6211 17.5732 17.428 17.3176 17.0417 16.8064C15.2469 14.431 12.4277 12.9004 9.25769 12.9004Z"
                            stroke={activeTab === tab.id ? "#099940" : "#022C33"}
                            stroke-width="1.8"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M9.40042 9.90039C11.8857 9.90039 13.9004 7.88567 13.9004 5.40039C13.9004 2.91511 11.8857 0.900391 9.40042 0.900391C6.91511 0.900391 4.90039 2.91511 4.90039 5.40039C4.90039 7.88567 6.91511 9.90039 9.40042 9.90039Z"
                            stroke={activeTab === tab.id ? "#099940" : "#022C33"}
                            stroke-width="1.8"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      )}
                      {tab.icon === "envelope" && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="22"
                          viewBox="0 0 20 22"
                          fill="none"
                        >
                          <path
                            d="M15.5254 8.67817V6.45595C15.5254 3.3877 13.007 0.900391 9.90039 0.900391C6.79379 0.900391 4.27539 3.3877 4.27539 6.45595V8.67817M9.90039 13.6782V15.9004M6.30039 20.9004H13.5004C15.3906 20.9004 16.3356 20.9004 17.0576 20.5371C17.6927 20.2175 18.209 19.7076 18.5325 19.0804C18.9004 18.3673 18.9004 17.4339 18.9004 15.5671V14.0115C18.9004 12.1446 18.9004 11.2113 18.5325 10.4982C18.209 9.87095 17.6927 9.36106 17.0576 9.0415C16.3356 8.67817 15.3906 8.67817 13.5004 8.67817H6.30039C4.41021 8.67817 3.46512 8.67817 2.74317 9.0415C2.10812 9.36106 1.59182 9.87095 1.26824 10.4982C0.900391 11.2113 0.900391 12.1446 0.900391 14.0115V15.5671C0.900391 17.4339 0.900391 18.3673 1.26824 19.0804C1.59182 19.7076 2.10812 20.2175 2.74317 20.5371C3.46512 20.9004 4.41021 20.9004 6.30039 20.9004Z"
                            stroke={activeTab === tab.id ? "#099940" : "#022C33"}
                            stroke-width="1.8"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      )}
                      {tab.icon === "lock" && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="22"
                          viewBox="0 0 20 22"
                          fill="none"
                        >
                          <path
                            d="M15.5254 8.67817V6.45595C15.5254 3.3877 13.007 0.900391 9.90039 0.900391C6.79379 0.900391 4.27539 3.3877 4.27539 6.45595V8.67817M9.90039 13.6782V15.9004M6.30039 20.9004H13.5004C15.3906 20.9004 16.3356 20.9004 17.0576 20.5371C17.6927 20.2175 18.209 19.7076 18.5325 19.0804C18.9004 18.3673 18.9004 17.4339 18.9004 15.5671V14.0115C18.9004 12.1446 18.9004 11.2113 18.5325 10.4982C18.209 9.87095 17.6927 9.36106 17.0576 9.0415C16.3356 8.67817 15.3906 8.67817 13.5004 8.67817H6.30039C4.41021 8.67817 3.46512 8.67817 2.74317 9.0415C2.10812 9.36106 1.59182 9.87095 1.26824 10.4982C0.900391 11.2113 0.900391 12.1446 0.900391 14.0115V15.5671C0.900391 17.4339 0.900391 18.3673 1.26824 19.0804C1.59182 19.7076 2.10812 20.2175 2.74317 20.5371C3.46512 20.9004 4.41021 20.9004 6.30039 20.9004Z"
                            stroke={activeTab === tab.id ? "#099940" : "#022C33"}
                            stroke-width="1.8"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="exact-profile-menu-text">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Right Content Area */}
              <div className="exact-profile-main-content">
                {showDeleteConfirmation ? (
                  <div className="exact-profile-delete-view">
                    {/* Back Arrow */}
                    <button
                      className="exact-profile-back-button"
                      onClick={handleBackFromDelete}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M19 12H5M12 19L5 12L12 5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>

                    {/* Delete Confirmation Content */}
                    <div className="exact-profile-delete-panel">
                      <h3 className="exact-profile-delete-title">
                        Delete your Simbli Account?
                      </h3>
                      <p className="exact-profile-delete-subtitle">
                        Deleting your account is permanent and cannot be undone.
                        Are you sure you'd like to continue?
                      </p>
                      <p className="acknowledge_Font">Please acknowledge and confirm:</p>

                      <div className="exact-profile-checkbox-container">
                        <label className="exact-profile-checkbox-label">
                          <input
                            type="checkbox"
                            className="exact-profile-checkbox-tick"
                            checked={deleteCheckbox}
                            onChange={(e) =>
                              setDeleteCheckbox(e.target.checked)
                            }
                          />
                          <span className="exact-profile-checkbox-description">
                            I understand that deleting my account is permanent,
                            and have reviewed what will happen to my workspaces.
                          </span>
                        </label>
                      </div>

                      <div className="exact-profile-delete-button-group">
                        <button
                          className="exact-profile-confirm-delete-btn"
                          onClick={handleConfirmDelete}
                          disabled={!deleteCheckbox}
                        >
                          Yes, Delete my account
                        </button>
                        <button
                          className="exact-profile-cancel-action-btn"
                          onClick={handleBackFromDelete}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>{renderTabContent()}</>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profilepop;
