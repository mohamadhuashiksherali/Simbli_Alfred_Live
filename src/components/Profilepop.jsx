import React, { useEffect, useRef, useState } from "react";
import "./Profile.css";
import "./App.css";
import Goggle from "../assets/Google_Favicon.svg";
import { getProfile, updateProfile, VITE_IMAGE_URL, deleteAccountApi, SIMBLI_URL } from "../api/api";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Loading from "../assets/simbli_loader.gif";

const Profilepop = ({ isPopupOpen, setIsPopupOpen, onProfileUpdate }) => {
  // const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("basic-info");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [userName, setUserName] = useState("Sudharshan");
  const [phoneNumber, setPhoneNumber] = useState("+91 98394 45989");
  const [deleteCheckbox, setDeleteCheckbox] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ show: false, message: "", type: "" });
  const [isEditMode, setIsEditMode] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const [touchedFields, setTouchedFields] = useState({});
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Helper function to validate email


  // Helper function to show snackbar
  const showSnackbar = (message, type) => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => {
      setSnackbar({ show: false, message: "", type: "" });
    }, 3000);
  };

  // Form validation function
  const validateForm = (forceValidation = false) => {
    const newErrors = {};

    // Only validate text fields if in edit mode
    if (isEditMode) {
      // Username validation - only show if field has been touched or force validation
      if (forceValidation && (!formData.username || formData.username.trim() === "")) {
        newErrors.username = "Username is required";
      } else if (touchedFields.username && (!formData.username || formData.username.trim() === "")) {
        newErrors.username = "Username is required";
      } else if (touchedFields.username && formData.username && /[^a-zA-Z\s]/.test(formData.username)) {
        newErrors.username = "Username can contain only letters and spaces";
      }

      // Phone number validation - only show if field has been touched or force validation
      if (forceValidation && (!formData.phonenumber || formData.phonenumber.trim() === "")) {
        newErrors.phonenumber = "Phone number is required";
      } else if (touchedFields.phonenumber && (!formData.phonenumber || formData.phonenumber.trim() === "")) {
        newErrors.phonenumber = "Phone number is required";
      } else if (touchedFields.phonenumber && formData.phonenumber && /\D/.test(formData.phonenumber)) {
        newErrors.phonenumber = "Phone number must contain only numbers";
      } else if (formData.phonenumber.length !== 10) {
        newErrors.phonenumber = "Phone number must be exactly 10 digits";
      }
    }

    // Show all errors in snackbar if any
    if (Object.keys(newErrors).length > 0) {
      const allErrors = Object.values(newErrors).join("\n");
      showSnackbar(allErrors, "error");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update profile function
  const handleUpdateProfile = async (e) => {
    e.preventDefault();

    // Mark all fields as touched when trying to submit
    setTouchedFields({
      username: true,
      phonenumber: true
    });

    if (!validateForm(true)) {
      return;
    }

    setIsLoading(true);

    const formDataPayLoad = new FormData();
    // Profile image
    if (file) {
      formDataPayLoad.append("profileImage", file);
    }
    // Optional password update


    // Optional text fields update
    formDataPayLoad.append("username", formData?.username);

    formDataPayLoad.append("phone_number", formData?.phonenumber);
    try {
      const response = await updateProfile(formDataPayLoad);
      if (response?.status === 200 && response?.data) {
        showSnackbar("Profile Updated successfully!", "success");
        getProfileData();
        // Call the callback to refresh profile data in Dashboard
        if (onProfileUpdate) {
          onProfileUpdate();
        }
        setFormData((prev) => ({
          ...prev,
        }));
        setFile(null);
        setPreviewImage(""); // Clear preview image after successful update
        setIsEditMode(false); // Exit edit mode after successful update
      } else {
        // Handle backend error messages
        const errorMessage = response?.data?.message || response?.data?.error || "Update failed. Please try again.";
        showSnackbar(errorMessage, "error");
      }
    } catch (err) {
      // Handle network errors or other exceptions
      const errorMessage = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Update failed. Please try again.";
      showSnackbar(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }

  };

  // const openPopup = () => {
  //   setIsPopupOpen(true);
  // };

  const closePopup = () => {
    setIsPopupOpen(false);
    setActiveTab("basic-info");
    setShowDeleteConfirmation(false);
    setShowChangePassword(false);
    setDeleteCheckbox(false);
    setIsEditMode(false);
    setErrors({});
    setTouchedFields({});
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setShowPasswords({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false
    });
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      closePopup();
    }
  };

  const handleUpdate = (e) => {
    if (isEditMode || file) {
      handleUpdateProfile(e);
    }
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    // Clear errors when toggling edit mode
    setErrors({});
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirmation(true);
  };

  const handleBackFromDelete = () => {
    setShowDeleteConfirmation(false);
    setDeleteCheckbox(false);
  };

  const handleChangePassword = () => {
    // Reset password data when opening the change password view
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setShowPasswords({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false
    });
    setErrors({});
    setTouchedFields({});
    setShowChangePassword(true);
  };

  const handleBackFromChangePassword = () => {
    setShowChangePassword(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setShowPasswords({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false
    });
    setErrors({});
    setTouchedFields({});
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const togglePasswordVisibility = (fieldName) => {
    setShowPasswords(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    // Validate new password for both auth types
    if (!passwordData.newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = "New password must be at least 6 characters";
    }

    // Validate confirm password for both auth types
    if (!passwordData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirm password is required";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const formDataPayload = new FormData();

      // Add password data based on auth type
      if (profileData?.auth_type === "normal") {
        // For normal auth, send current password and new password
        formDataPayload.append("currentPassword", passwordData.currentPassword);
        formDataPayload.append("newPassword", passwordData.newPassword);
      } else {
        // For non-normal auth (Google, etc.), just send the new password to set it
        formDataPayload.append("newPassword", passwordData.newPassword);
      }

      const response = await updateProfile(formDataPayload);

      if (response?.status === 200 && response?.data) {
        const successMessage = profileData?.auth_type === "normal"
          ? "Password changed successfully!"
          : "Password set successfully!";
        showSnackbar(successMessage, "success");

        // Refresh profile data to get updated auth_type
        await getProfileData();

        // Reset password form
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
        setShowPasswords({
          currentPassword: false,
          newPassword: false,
          confirmPassword: false
        });
        setErrors({});
        setShowChangePassword(false);
      } else {
        // Handle backend error messages
        const errorMessage = response?.data?.message || response?.data?.error ||
          (profileData?.auth_type === "normal"
            ? "Failed to change password. Please try again."
            : "Failed to set password. Please try again.");
        showSnackbar(errorMessage, "error");
      }
    } catch (error) {
      console.error("Password change error:", error);
      // Handle network errors or other exceptions
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message ||
        (profileData?.auth_type === "normal"
          ? "Failed to change password. Please try again."
          : "Failed to set password. Please try again.");
      showSnackbar(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCheckbox) {
      showSnackbar("Please confirm by checking the box", "error");
      return;
    }

    setIsLoading(true);
    setIsDeletingAccount(true);

    try {
      const response = await deleteAccountApi();

      if (response?.status === 200) {
        showSnackbar("Account deleted successfully!", "success");

        // Clear user data from localStorage
        localStorage.removeItem("access-token");
        localStorage.removeItem("refresh-token");
        localStorage.removeItem("simbli_publish_success_map")
        localStorage.removeItem("simbli_chat_messages")

        // Close the popup
        setShowDeleteConfirmation(false);
        closePopup();

        // Wait a moment to show success message, then redirect
        setIsDeletingAccount(false);
        window.location.href = `${SIMBLI_URL}/login`;

      } else {
        setIsDeletingAccount(false);
        const errorMessage = response?.data?.message || response?.data?.error || "Failed to delete account. Please try again.";
        showSnackbar(errorMessage, "error");
      }
    } catch (error) {
      console.error("Account deletion error:", error);
      setIsDeletingAccount(false);
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error || error?.message || "Failed to delete account. Please try again.";
      showSnackbar(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Reset delete confirmation state when switching tabs
    setShowDeleteConfirmation(false);
    setShowChangePassword(false);
    setDeleteCheckbox(false);
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    });
    setShowPasswords({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false
    });
    setErrors({});
    setTouchedFields({});
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
                    key={profileData?.profileImage || 'default'}
                    src={getProfileImage()}
                    alt="Profile"
                    className="exact-profile-picture-img"
                    onError={(e) => {
                      // If image fails to load, set a default user icon
                      e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none'%3E%3Ccircle cx='12' cy='8' r='4' stroke='%23CCCCCC' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M20 21C20 17.134 16.418 14 12 14C7.58172 14 4 17.134 4 21' stroke='%23CCCCCC' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";
                    }}
                  />
                </div>
                <button onClick={handlePickNewImage} className="exact-profile-edit-icon-btn">
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
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  ref={fileInputRef}
                  onClick={(e) => (e.target.value = null)}
                  onChange={handleImageChange}
                />
              </div>

              {/* User Information Fields */}
              <form onSubmit={handleUpdate} className="exact-profile-fields-container">
                {/* User Name Field */}
                <div className="exact-profile-field-row">
                  <label className="exact-profile-field-title">User Name <span style={{ color: 'red' }}>*</span></label>
                  <div className="exact-profile-field-input-box">
                    <svg
                      className="exact-profile-field-icon"
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
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
                      name="username"
                      value={formData?.username}
                      onChange={handleInputChange}
                      onBlur={handleFieldBlur}
                      readOnly={!isEditMode}
                      className={`exact-profile-field-input ${errors.username ? 'error' : ''} ${!isEditMode ? 'readonly' : ''}`}
                      placeholder="Enter user name"
                    />
                  </div>
                  {/* {errors.username && (
                    <div className="error-message">{errors.username}</div>
                  )} */}
                </div>

                {/* Phone Number Field */}
                <div className="exact-profile-field-row">
                  <label className="exact-profile-field-title">
                    Phone Number <span style={{ color: 'red' }}>*</span>
                  </label>
                  <div className="exact-profile-field-input-box">
                    <svg
                      className="exact-profile-field-icon"
                      xmlns="http://www.w3.org/2000/svg"
                      width="15"
                      height="15"
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
                      name="phonenumber"
                      value={formData?.phonenumber}
                      onChange={handleInputChange}
                      onBlur={handleFieldBlur}
                      readOnly={!isEditMode}
                      className={`exact-profile-field-input ${errors.phonenumber ? 'error' : ''} ${!isEditMode ? 'readonly' : ''}`}
                      placeholder="Enter phone number"
                    />
                  </div>
                  {/* {errors.phonenumber && (
                      <div className="error-message">{errors.phonenumber}</div>
                    )} */}
                </div>

                {/* Action Buttons */}
                <div className="exact-profile-buttons-row">
                  <button
                    type="button"
                    className="exact-profile-edit-text-btn"
                    onClick={toggleEditMode}
                  >
                    <div className="Edit_Icon">

                      {isEditMode ? "Cancel" :
                        <div className="d-flex align-items-center gap-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="15"
                            height="15"
                            viewBox="0 0 20 19"
                            fill="none"
                          >
                            <path
                              d="M9.84958 17.9709H18.8496M0.849609 17.9709H2.52415C3.01334 17.9709 3.25793 17.9709 3.4881 17.9156C3.69217 17.8666 3.88726 17.7858 4.06621 17.6762C4.26804 17.5525 4.44099 17.3795 4.7869 17.0336L17.3497 4.47092C18.1781 3.6425 18.1781 2.29935 17.3497 1.47092C16.5212 0.642504 15.1781 0.642504 14.3497 1.47092L1.78687 14.0336C1.44097 14.3795 1.26801 14.5525 1.14433 14.7543C1.03467 14.9333 0.953859 15.1283 0.904869 15.3324C0.849609 15.5626 0.849609 15.8072 0.849609 16.2964V17.9709Z"
                              stroke="#8D8D8D"
                              stroke-width="1.7"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                          Edit
                        </div>
                      }
                      {/* <div className="Edit_Icon">{isEditMode ? "Cancel" : "Edit"}</div> */}
                    </div>
                  </button>
                  {(isEditMode || file) && (
                    <button
                      type="submit"
                      className="exact-profile-update-main-btn"
                      disabled={isLoading}
                    >
                      {isLoading ? "Updating..." : "Update"}
                    </button>
                  )}
                </div>
              </form>
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
                <button
                  onClick={handleChangePassword}
                  className="exact-profile-change-password-link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Change Password
                </button>
              </div>
              <div className="exact-profile-google-signin-box">
                {profileData?.auth_type === "normal" ? (
                  // Show mail icon for normal auth
                  <svg
                    className="Goggle_Icon"
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ marginRight: '8px' }}
                  >
                    <path
                      d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polyline
                      points="22,6 12,13 2,6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  // Show Google icon for non-normal auth (Google, etc.)
                  <img src={Goggle} alt="" className="Goggle_Icon" />
                )}
                <span className="exact-profile-google-email-text">
                  {profileData?.email || "Sudharshanm@gmail.com"}
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

  const [profileData, setProfileData] = useState({});
  const [previewImage, setPreviewImage] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    phonenumber: "",

  });
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);
  const cropImageRef = useRef(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageUrl, setRawImageUrl] = useState("");
  const [crop, setCrop] = useState({
    unit: "%",
    width: 80,
    height: 80,
    x: 10,
    y: 10,
    aspect: 1,
  });
  const [completedCrop, setCompletedCrop] = useState(null);

  const handlePickNewImage = () => {
    if (fileInputRef.current) {
      // Clear previous value so picking the same file triggers onChange
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };
  const handleImageChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    const objectUrl = URL.createObjectURL(selectedFile);
    setRawImageUrl(objectUrl);
    // Set initial crop - will be properly calculated when image loads
    setCrop({ unit: "%", width: 80, height: 80, x: 10, y: 10, aspect: 1 });
    setCompletedCrop(null);
    setCropModalOpen(true);
    // Reset input so the same file can be selected again
    try {
      e.target.value = "";
    } catch { }
  };

  const handleCropChange = (newCrop) => {
    // Always ensure aspect ratio is maintained by making width and height equal
    const size = Math.min(newCrop.width || 0, newCrop.height || 0);

    // If size is 0 or invalid, use the current crop size
    const finalSize = size > 0 ? size : Math.min(crop.width || 0, crop.height || 0);

    const squareCrop = {
      ...newCrop,
      width: finalSize,
      height: finalSize,
      aspect: 1
    };

    setCrop(squareCrop);

    // Also update completedCrop for immediate cropping
    setCompletedCrop(squareCrop);
  };

  const handleCropComplete = (completedCrop) => {
    // Convert to pixels for completedCrop if we have the image reference
    if (cropImageRef.current && completedCrop.unit === "%") {
      const img = cropImageRef.current;
      const pixelCrop = {
        unit: "px",
        width: (completedCrop.width / 100) * img.width,
        height: (completedCrop.height / 100) * img.height,
        x: ((completedCrop.x || 0) / 100) * img.width,
        y: ((completedCrop.y || 0) / 100) * img.height,
        aspect: 1
      };
      setCompletedCrop(pixelCrop);
    } else {
      setCompletedCrop(completedCrop);
    }
  };

  const onImageLoaded = (image) => {
    cropImageRef.current = image;
    // Set initial crop when image loads
    const { width, height } = image;
    const size = Math.min(width, height);
    const x = (width - size) / 2;
    const y = (height - size) / 2;

    setCrop({
      unit: "px",
      width: size,
      height: size,
      x: x,
      y: y,
      aspect: 1
    });
  };

  const getCroppedBlob = (image, cropRect) => {
    return new Promise((resolve, reject) => {
      if (!cropRect || !image) {
        resolve(null);
        return;
      }
      const canvas = document.createElement("canvas");
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      const pixelRatio = window.devicePixelRatio || 1;

      canvas.width = Math.floor(cropRect.width * scaleX * pixelRatio);
      canvas.height = Math.floor(cropRect.height * scaleY * pixelRatio);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.imageSmoothingQuality = "high";

      const cropX = cropRect.x * scaleX;
      const cropY = cropRect.y * scaleY;
      const cropW = cropRect.width * scaleX;
      const cropH = cropRect.height * scaleY;

      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropW,
        cropH,
        0,
        0,
        cropW,
        cropH
      );

      canvas.toBlob(
        (blob) => {
          resolve(blob || null);
        },
        "image/jpeg",
        0.92
      );
    });
  };

  const handleCropCancel = () => {
    setCropModalOpen(false);
    if (rawImageUrl) URL.revokeObjectURL(rawImageUrl);
    setRawImageUrl("");
  };

  const handleCropConfirm = async () => {
    const imageEl = cropImageRef.current;
    // Use completedCrop if available, otherwise use current crop
    const cropToUse = completedCrop || crop;

    if (!imageEl || !cropToUse) {
      handleCropCancel();
      return;
    }
    const blob = await getCroppedBlob(imageEl, cropToUse);
    if (!blob) {
      handleCropCancel();
      return;
    }
    const croppedFile = new File([blob], "profile.jpg", { type: blob.type || "image/jpeg" });
    const previewUrl = URL.createObjectURL(blob);
    setFile(croppedFile);
    setPreviewImage(previewUrl);
    setCropModalOpen(false);
    if (rawImageUrl) URL.revokeObjectURL(rawImageUrl);
    setRawImageUrl("");
  };
  const getProfileData = async () => {
    try {
      const response = await getProfile();
      console.log("response", response);
      if (
        response.status === 200 &&
        response?.data &&
        Object.keys(response.data).length > 0
      ) {
        const data = response?.data?.data;
        setProfileData(data);
        setFormData({
          username: data?.username,
          email: data?.email || "",
          // password: "",
          // currentpassword: "",
          // newpassword: "",
          countrycode: data?.countrycode,
          phonenumber: data?.phonenumber,
        });
      } else {
        console.log("No data found for Blog Count.");
        setProfileData({});
      }
    } catch (err) {
      console.error("Error fetching Profile Data:", err);
      // Handle backend error messages
      const errorMessage = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Failed to load profile data.";
      showSnackbar(errorMessage, "error");
      setProfileData({});
    }
  };

  const getProfileImage = () => {
    // First priority: Show cropped preview image
    if (previewImage) {
      console.log("Using preview image:", previewImage);
      return previewImage;
    }

    // Second priority: Show existing profile image
    if (profileData?.profileImage) {
      // If the image comes from Google, use it directly
      if (profileData.profileImage.includes("googleusercontent.com")) {
        console.log("Using Google profile image:", profileData.profileImage);
        return profileData.profileImage;
      }
      // Otherwise prefix with your app constant
      console.log("Using server profile image:", VITE_IMAGE_URL + profileData.profileImage);
      return VITE_IMAGE_URL + profileData.profileImage;
    }

    console.log("Using fallback image");
    // Return a default user icon SVG as fallback
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none'%3E%3Ccircle cx='12' cy='8' r='4' stroke='%23CCCCCC' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M20 21C20 17.134 16.418 14 12 14C7.58172 14 4 17.134 4 21' stroke='%23CCCCCC' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";
  };

  useEffect(() => {
    getProfileData()

  }, [])
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // console.log(`Input Name: ${name}, Value: ${value}`); // Add this

    // Special handling for phone number - clear country code if phone number is cleared

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFieldBlur = (e) => {
    const { name } = e.target;
    setTouchedFields(prev => ({ ...prev, [name]: true }));

    // Validate the specific field that was blurred
    validateField(name);
  };

  const validateField = (fieldName) => {
    const newErrors = { ...errors };

    if (fieldName === 'username') {
      if (!formData.username || formData.username.trim() === "") {
        newErrors.username = "Username is required";
      } else if (/[^a-zA-Z\s]/.test(formData.username)) {
        newErrors.username = "Username can contain only letters and spaces";
      } else {
        delete newErrors.username;
      }
    } else if (fieldName === 'phonenumber') {
      if (!formData.phonenumber || formData.phonenumber.trim() === "") {
        newErrors.phonenumber = "Phone number is required";
      } else if (/\D/.test(formData.phonenumber)) {
        newErrors.phonenumber = "Phone number must contain only numbers";
      } else {
        delete newErrors.phonenumber;
      }
    }

    setErrors(newErrors);
  };

  console.log("rawImageUrl", rawImageUrl)
  console.log("profileData", profileData)
  return (
    <div className="exact-profile-wrapper">
      {/* Profile Button - Top Right */}
      {/* <button className="exact-profile-open-btn" onClick={openPopup}>
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
      </button> */}

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
                    className={`exact-profile-menu-item ${activeTab === tab.id
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
                            stroke={
                              activeTab === tab.id ? "#099940" : "#022C33"
                            }
                            stroke-width="1.8"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="M9.40042 9.90039C11.8857 9.90039 13.9004 7.88567 13.9004 5.40039C13.9004 2.91511 11.8857 0.900391 9.40042 0.900391C6.91511 0.900391 4.90039 2.91511 4.90039 5.40039C4.90039 7.88567 6.91511 9.90039 9.40042 9.90039Z"
                            stroke={
                              activeTab === tab.id ? "#099940" : "#022C33"
                            }
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
                            stroke={
                              activeTab === tab.id ? "#099940" : "#022C33"
                            }
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
                            stroke={
                              activeTab === tab.id ? "#099940" : "#022C33"
                            }
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
                      <p className="acknowledge_Font">
                        Please acknowledge and confirm:
                      </p>

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
                          disabled={!deleteCheckbox || isLoading}
                        >
                          {isLoading ? "Deleting..." : "Yes, Delete my account"}
                        </button>
                        <button
                          className="exact-profile-cancel-action-btn"
                          onClick={handleBackFromDelete}
                          disabled={isLoading}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : showChangePassword ? (
                  <div className="exact-profile-change-password-view">
                    {/* Back Arrow */}
                    <button
                      className="exact-profile-back-button"
                      onClick={handleBackFromChangePassword}
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

                    {/* Change Password Content */}
                    <div className="password-form-container">
                      <h3 className="exact-profile-change-password-title">
                        {profileData?.auth_type === "normal" ? "Change Password" : "Set Password"}
                      </h3>
                      <p className="exact-profile-change-password-subtitle">
                        {profileData?.auth_type === "normal"
                          ? "Enter your current password and choose a new one to update your login credentials."
                          : "Choose a new password to secure your account."
                        }
                      </p>

                      <form onSubmit={handlePasswordSubmit} className="exact-profile-password-form">
                        {/* Current Password Field */}
                        {profileData?.auth_type === "normal" && (<>
                          <div className="password-field-row">
                            <label className="password-field-title">
                              Current Password
                            </label>
                            <div className="password-field-input-box">
                              <svg
                                className="password-field-icon"
                                width="15"
                                height="15"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M14.5996 6.59992C14.5996 6.0881 14.4043 5.57628 14.0138 5.18577C13.6233 4.79524 13.1114 4.59998 12.5996 4.59998M12.5996 12.6C15.9133 12.6 18.5996 9.91368 18.5996 6.59998C18.5996 3.28627 15.9133 0.599976 12.5996 0.599976C9.28591 0.599976 6.59961 3.28627 6.59961 6.59998C6.59961 6.87366 6.61793 7.14306 6.65342 7.40702C6.71179 7.84118 6.74097 8.05828 6.72133 8.19558C6.70086 8.33868 6.67481 8.41568 6.6043 8.54188C6.53661 8.66298 6.41732 8.78228 6.17874 9.02088L1.06824 14.1314C0.895289 14.3043 0.808809 14.3908 0.746969 14.4917C0.692139 14.5812 0.651739 14.6787 0.627239 14.7808C0.599609 14.8959 0.599609 15.0182 0.599609 15.2627V17C0.599609 17.5601 0.599609 17.8401 0.708599 18.054C0.804479 18.2422 0.957459 18.3951 1.14562 18.491C1.35953 18.6 1.63956 18.6 2.19961 18.6H4.59961V16.6H6.59961V14.6H8.59961L10.1787 13.0209C10.4173 12.7823 10.5366 12.663 10.6577 12.5953C10.7839 12.5248 10.8609 12.4987 11.004 12.4783C11.1413 12.4586 11.3584 12.4878 11.7926 12.5462C12.0565 12.5817 12.3259 12.6 12.5996 12.6Z"
                                  stroke="currentColor"
                                  strokeWidth="1.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <input
                                type={showPasswords.currentPassword ? "text" : "password"}
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordInputChange}
                                className="password-field-input"
                                placeholder="Enter current password"
                              />
                              <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => togglePasswordVisibility('currentPassword')}
                              >
                                {showPasswords.currentPassword ? (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                ) : (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </div>
                          {/* New Password Field */}
                          <div className="password-field-row">
                            <label className="password-field-title">
                              New Password <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <div className="password-field-input-box">
                              <svg
                                className="password-field-icon"
                                width="15"
                                height="15"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M14.5996 6.59992C14.5996 6.0881 14.4043 5.57628 14.0138 5.18577C13.6233 4.79524 13.1114 4.59998 12.5996 4.59998M12.5996 12.6C15.9133 12.6 18.5996 9.91368 18.5996 6.59998C18.5996 3.28627 15.9133 0.599976 12.5996 0.599976C9.28591 0.599976 6.59961 3.28627 6.59961 6.59998C6.59961 6.87366 6.61793 7.14306 6.65342 7.40702C6.71179 7.84118 6.74097 8.05828 6.72133 8.19558C6.70086 8.33868 6.67481 8.41568 6.6043 8.54188C6.53661 8.66298 6.41732 8.78228 6.17874 9.02088L1.06824 14.1314C0.895289 14.3043 0.808809 14.3908 0.746969 14.4917C0.692139 14.5812 0.651739 14.6787 0.627239 14.7808C0.599609 14.8959 0.599609 15.0182 0.599609 15.2627V17C0.599609 17.5601 0.599609 17.8401 0.708599 18.054C0.804479 18.2422 0.957459 18.3951 1.14562 18.491C1.35953 18.6 1.63956 18.6 2.19961 18.6H4.59961V16.6H6.59961V14.6H8.59961L10.1787 13.0209C10.4173 12.7823 10.5366 12.663 10.6577 12.5953C10.7839 12.5248 10.8609 12.4987 11.004 12.4783C11.1413 12.4586 11.3584 12.4878 11.7926 12.5462C12.0565 12.5817 12.3259 12.6 12.5996 12.6Z"
                                  stroke="currentColor"
                                  strokeWidth="1.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <input
                                type={showPasswords.newPassword ? "text" : "password"}
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordInputChange}
                                className={`password-field-input ${errors.newPassword ? 'error' : ''}`}
                                placeholder="Enter new password"
                              />
                              <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => togglePasswordVisibility('newPassword')}
                              >
                                {showPasswords.newPassword ? (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                ) : (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </button>
                            </div>
                            {errors.newPassword && (
                              <div className="password-error-message">{errors.newPassword}</div>
                            )}
                          </div>

                          {/* Confirm Password Field */}
                          <div className="password-field-row">
                            <label className="password-field-title">
                              Confirm New Password <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <div className="password-field-input-box">
                              <svg
                                className="password-field-icon"
                                width="15"
                                height="15"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M14.5996 6.59992C14.5996 6.0881 14.4043 5.57628 14.0138 5.18577C13.6233 4.79524 13.1114 4.59998 12.5996 4.59998M12.5996 12.6C15.9133 12.6 18.5996 9.91368 18.5996 6.59998C18.5996 3.28627 15.9133 0.599976 12.5996 0.599976C9.28591 0.599976 6.59961 3.28627 6.59961 6.59998C6.59961 6.87366 6.61793 7.14306 6.65342 7.40702C6.71179 7.84118 6.74097 8.05828 6.72133 8.19558C6.70086 8.33868 6.67481 8.41568 6.6043 8.54188C6.53661 8.66298 6.41732 8.78228 6.17874 9.02088L1.06824 14.1314C0.895289 14.3043 0.808809 14.3908 0.746969 14.4917C0.692139 14.5812 0.651739 14.6787 0.627239 14.7808C0.599609 14.8959 0.599609 15.0182 0.599609 15.2627V17C0.599609 17.5601 0.599609 17.8401 0.708599 18.054C0.804479 18.2422 0.957459 18.3951 1.14562 18.491C1.35953 18.6 1.63956 18.6 2.19961 18.6H4.59961V16.6H6.59961V14.6H8.59961L10.1787 13.0209C10.4173 12.7823 10.5366 12.663 10.6577 12.5953C10.7839 12.5248 10.8609 12.4987 11.004 12.4783C11.1413 12.4586 11.3584 12.4878 11.7926 12.5462C12.0565 12.5817 12.3259 12.6 12.5996 12.6Z"
                                  stroke="currentColor"
                                  strokeWidth="1.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <input
                                type={showPasswords.confirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordInputChange}
                                className={`password-field-input ${errors.confirmPassword ? 'error' : ''}`}
                                placeholder="Confirm new password"
                              />
                              <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => togglePasswordVisibility('confirmPassword')}
                              >
                                {showPasswords.confirmPassword ? (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                ) : (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </button>
                            </div>
                            {errors.confirmPassword && (
                              <div className="password-error-message">{errors.confirmPassword}</div>
                            )}
                          </div>

                        </>)}


                        {profileData?.auth_type !== "normal" && (<>

                          {/* New Password Field */}
                          <div className="password-field-row">
                            <label className="password-field-title">
                              Set Password <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <div className="password-field-input-box">
                              <svg
                                className="password-field-icon"
                                width="15"
                                height="15"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M14.5996 6.59992C14.5996 6.0881 14.4043 5.57628 14.0138 5.18577C13.6233 4.79524 13.1114 4.59998 12.5996 4.59998M12.5996 12.6C15.9133 12.6 18.5996 9.91368 18.5996 6.59998C18.5996 3.28627 15.9133 0.599976 12.5996 0.599976C9.28591 0.599976 6.59961 3.28627 6.59961 6.59998C6.59961 6.87366 6.61793 7.14306 6.65342 7.40702C6.71179 7.84118 6.74097 8.05828 6.72133 8.19558C6.70086 8.33868 6.67481 8.41568 6.6043 8.54188C6.53661 8.66298 6.41732 8.78228 6.17874 9.02088L1.06824 14.1314C0.895289 14.3043 0.808809 14.3908 0.746969 14.4917C0.692139 14.5812 0.651739 14.6787 0.627239 14.7808C0.599609 14.8959 0.599609 15.0182 0.599609 15.2627V17C0.599609 17.5601 0.599609 17.8401 0.708599 18.054C0.804479 18.2422 0.957459 18.3951 1.14562 18.491C1.35953 18.6 1.63956 18.6 2.19961 18.6H4.59961V16.6H6.59961V14.6H8.59961L10.1787 13.0209C10.4173 12.7823 10.5366 12.663 10.6577 12.5953C10.7839 12.5248 10.8609 12.4987 11.004 12.4783C11.1413 12.4586 11.3584 12.4878 11.7926 12.5462C12.0565 12.5817 12.3259 12.6 12.5996 12.6Z"
                                  stroke="currentColor"
                                  strokeWidth="1.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <input
                                type={showPasswords.newPassword ? "text" : "password"}
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordInputChange}
                                className={`password-field-input ${errors.newPassword ? 'error' : ''}`}
                                placeholder="Enter new password"
                              />
                              <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => togglePasswordVisibility('newPassword')}
                              >
                                {showPasswords.newPassword ? (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                ) : (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </button>
                            </div>
                            {errors.newPassword && (
                              <div className="password-error-message">{errors.newPassword}</div>
                            )}
                          </div>

                          {/* Confirm Password Field for non-normal auth */}
                          <div className="password-field-row">
                            <label className="password-field-title">
                              Confirm Password <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <div className="password-field-input-box">
                              <svg
                                className="password-field-icon"
                                width="15"
                                height="15"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M14.5996 6.59992C14.5996 6.0881 14.4043 5.57628 14.0138 5.18577C13.6233 4.79524 13.1114 4.59998 12.5996 4.59998M12.5996 12.6C15.9133 12.6 18.5996 9.91368 18.5996 6.59998C18.5996 3.28627 15.9133 0.599976 12.5996 0.599976C9.28591 0.599976 6.59961 3.28627 6.59961 6.59998C6.59961 6.87366 6.61793 7.14306 6.65342 7.40702C6.71179 7.84118 6.74097 8.05828 6.72133 8.19558C6.70086 8.33868 6.67481 8.41568 6.6043 8.54188C6.53661 8.66298 6.41732 8.78228 6.17874 9.02088L1.06824 14.1314C0.895289 14.3043 0.808809 14.3908 0.746969 14.4917C0.692139 14.5812 0.651739 14.6787 0.627239 14.7808C0.599609 14.8959 0.599609 15.0182 0.599609 15.2627V17C0.599609 17.5601 0.599609 17.8401 0.708599 18.054C0.804479 18.2422 0.957459 18.3951 1.14562 18.491C1.35953 18.6 1.63956 18.6 2.19961 18.6H4.59961V16.6H6.59961V14.6H8.59961L10.1787 13.0209C10.4173 12.7823 10.5366 12.663 10.6577 12.5953C10.7839 12.5248 10.8609 12.4987 11.004 12.4783C11.1413 12.4586 11.3584 12.4878 11.7926 12.5462C12.0565 12.5817 12.3259 12.6 12.5996 12.6Z"
                                  stroke="currentColor"
                                  strokeWidth="1.2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              <input
                                type={showPasswords.confirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordInputChange}
                                className={`password-field-input ${errors.confirmPassword ? 'error' : ''}`}
                                placeholder="Confirm new password"
                              />
                              <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => togglePasswordVisibility('confirmPassword')}
                              >
                                {showPasswords.confirmPassword ? (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                ) : (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </button>
                            </div>
                            {errors.confirmPassword && (
                              <div className="password-error-message">{errors.confirmPassword}</div>
                            )}
                          </div>

                        </>)}

                        {/* Action Buttons */}
                        <div className="exact-profile-password-buttons-row">
                          <button
                            type="button"
                            className="exact-profile-cancel-password-btn"
                            onClick={handleBackFromChangePassword}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="exact-profile-update-main-btn"
                            disabled={isLoading}
                          >
                            {isLoading
                              ? (profileData?.auth_type === "normal" ? "Changing..." : "Setting...")
                              : (profileData?.auth_type === "normal" ? "Change Password" : "Set Password")
                            }
                          </button>
                        </div>
                      </form>
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

      {cropModalOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ background: "rgba(0,0,0,0.6)", zIndex: 1050 }}
        >
          <div
            className="position-absolute top-50 start-50 translate-middle bg-white rounded p-3"
            style={{ width: "min(92vw, 720px)" }}
          >
            <h6 className="mb-3" style={{ color: "#173E44", fontWeight: 600 }}>Crop your Picture</h6>
            <div className="d-flex justify-content-center">
              {rawImageUrl && (
                <ReactCrop
                  crop={crop}
                  onChange={handleCropChange}
                  onComplete={handleCropComplete}
                  aspect={1}
                >
                  <img
                    src={rawImageUrl}
                    alt="crop"
                    onLoad={(e) => onImageLoaded(e.currentTarget)}
                    style={{ maxHeight: "60vh", maxWidth: "100%" }}
                  />
                </ReactCrop>
              )}
            </div>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button type="button" className="btn px-3"
                style={{ backgroundColor: "#EAEAEA", color: "#021E22", border: "none", fontSize: "14px" }} onClick={handleCropCancel}>
                Cancel
              </button>
              <button type="button" className="btn px-3"
                style={{ backgroundColor: "#84E084", color: "#021E22", border: "none", fontSize: "14px" }} onClick={handleCropConfirm}>
                Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snackbar for notifications */}
      {snackbar.show && (
        <div className={`snackbar ${snackbar.type}`}>
          {snackbar.message}
        </div>
      )}

      {/* Full-screen loader during account deletion */}
      {isDeletingAccount && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{
            background: "rgba(0,0,0,0.8)",
            zIndex: 9999,
            backdropFilter: "blur(2px)"
          }}
        >
          <div className="text-center" style={{ color: "#fff" }}>
            {/* <div className="loader"></div> */}
            <img src={Loading} alt="" className="w-24 h-24" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Profilepop;
