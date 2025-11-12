import { useState, useEffect } from "react";
import axios from "axios";
import soc1 from "../../assets/soc1.png";
import soc2 from "../../assets/soc2.png";
import soc3 from "../../assets/soc3.png";
import soc4 from "../../assets/soc4.png";
import soc5 from "../../assets/soc5.png";
import soc6 from "../../assets/soc6.png";
// import "bootstrap/dist/css/bootstrap.min.css";
import logo from "../../assets/simbli-light.png";
import "../App.css";
import "./split.css";
import linkedinIcon from "../../assets/sel1.png";
import twitterIcon from "../../assets/sel2.png";
import instagramIcon from "../../assets/sel4.png";
import facebookIcon from "../../assets/sel3.png";
import {
  getAyrshareProfile,
  createAyrshareProfile,
  generateAyrshareJWT,
  getAyrshareConnectedAccounts,
  syncAyrshareConnections,
  registerAyrshareWebhook,
  registerAyrshareSocialWebhook,
  analyzeWritingStyle,
} from "../../api/api.js";
import { loadProfileFromStorage } from "../../utils/ayrshareStorage.js";

const Split = ({
  currentStep = 1,
  onOnboardingUpdate,
  isOnboardingCompleted = false,
}) => {
  const [selectedPlatform, setSelectedPlatform] = useState("linkedin");
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [popupWindow, setPopupWindow] = useState(null);
  const [connectWindow, setConnectWindow] = useState(false);
  const [skipAllLoading, setSkipAllLoading] = useState(false);

  // Ayrshare integration state
  const [ayrshareProfile, setAyrshareProfile] = useState(null);
  const [ayrshareConnections, setAyrshareConnections] = useState([]);
  const [ayrshareLoading, setAyrshareLoading] = useState(false);
  const [ayrshareError, setAyrshareError] = useState(null);
  const [ayrshareSuccess, setAyrshareSuccess] = useState(null);
  const [platformLoading, setPlatformLoading] = useState({});
  const [recentlyDisconnected, setRecentlyDisconnected] = useState({});
  const [connectClosed, setConnectClosed] = useState(false);

  // Set initial platform based on current step
  useEffect(() => {
    if (currentStep === 1) {
      setSelectedPlatform("linkedin");
    } else if (currentStep === 2) {
      setSelectedPlatform("twitter");
    } else if (currentStep === 3) {
      setSelectedPlatform("facebook");
    } else if (currentStep === 4) {
      setSelectedPlatform("instagram");
    }
  }, [currentStep]);

  useEffect(() => {
    if (ayrshareProfile) {
      registerAyrshareWebhook();
      registerAyrshareSocialWebhook();
    }
  }, [ayrshareProfile]);

  // Fetch connection status on component mount
  useEffect(() => {
    // Clear Ayrshare localStorage on component mount
    localStorage.removeItem("ayrshare_profile");
    localStorage.removeItem("simbli_chat_messages");
    localStorage.removeItem("simbli_publish_success_map");
    console.log("Cleared Ayrshare localStorage on component mount");

    fetchConnectionStatus();
    loadAyrshareProfile();
  }, []);
  useEffect(() => {
    fetchConnectionStatus();
  }, [loading]);
  useEffect(() => {
    if (ayrshareProfile) {
      loadAyrshareConnections();
    }
  }, [ayrshareProfile, platformLoading]);

  // Check for OAuth success/error from URL params
  useEffect(() => {
    const handleOAuthReturn = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const linkedinConnected = urlParams.get("linkedin_connected");
      const linkedinError = urlParams.get("linkedin_error");
      const xConnected = urlParams.get("x_connected") === "true";
      const xError = urlParams.get("x_error") === "true";
      const errorMessage = urlParams.get("error_message");

      console.log("[Onboarding][OAuth] URL Params", {
        linkedinConnected,
        linkedinError,
        xConnected,
        xError,
        errorMessage,
      });

      if (linkedinConnected === "true") {
        // LinkedIn connection successful, fetch profile and update onboarding step
        await handleConnectionSuccess("linkedin");
        // Clean up URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
        // Refresh the page after successful connection
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else if (xConnected) {
        // X connection successful, fetch profile and update onboarding step
        await handleConnectionSuccess("twitter");
        // Clean up URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
        // Refresh the page after successful connection
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }

      if (linkedinError === "true" || xError) {
        console.error("OAuth error:", errorMessage);
        // Clean up URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      }
    };

    handleOAuthReturn();
  }, []);

  // Listen for messages from popup window
  useEffect(() => {
    const handleMessage = async (event) => {
      // Check if message is from our popup
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "OAUTH_SUCCESS") {
        const { platform } = event.data;
        console.log(`OAuth success for ${platform}`);

        // Close popup with a small delay to ensure message is processed
        if (popupWindow) {
          setTimeout(() => {
            popupWindow.close();
            setPopupWindow(null);
          }, 100);
        }

        // Stop loading
        setLoading(false);

        // Handle connection success
        await handleConnectionSuccess(platform);

        // Refresh the page after successful connection
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else if (event.data.type === "OAUTH_ERROR") {
        const { platform, error } = event.data;
        console.error(`OAuth error for ${platform}:`, error);

        // Close popup with a small delay to ensure message is processed
        if (popupWindow) {
          setTimeout(() => {
            popupWindow.close();
            setPopupWindow(null);
          }, 100);
        }

        // Stop loading
        setLoading(false);

        // Show error message
        alert(`Failed to connect to ${platform}: ${error}`);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [popupWindow]);

  // Cleanup popup on component unmount
  useEffect(() => {
    return () => {
      if (popupWindow && !popupWindow.closed) {
        popupWindow.close();
      }
    };
  }, [popupWindow]);

  const fetchConnectionStatus = async () => {
    try {
      const response = await axios.get("/auth/social-connections");
      const connections = response.data || [];

      const status = {};
      connections.forEach((conn) => {
        const platform = conn.platform?.toLowerCase();
        if (platform === "linkedin" || platform === "twitter") {
          status[platform] = {
            is_connected: conn.is_connected,
            profile_info: conn.profile_info || {},
          };
        }
      });

      setConnectionStatus(status);
    } catch (error) {
      console.error("Failed to fetch connection status:", error);
    }
  };
useEffect(()=>{
  console.log(`ayrshareConnections.platform`)
  if(ayrshareConnections.find((account) => account.platform === "linkedin") ){
    console.log("analyzing writing style for linkedin")
    analyzeWritingStyle("", "linkedin", 12);
  }
},[ayrshareConnections])

  // Ayrshare functions
  const loadAyrshareProfile = async () => {
    try {
      setAyrshareLoading(true);
      // Try to load from localStorage first
      // const storedProfile = loadProfileFromStorage();
      // if (storedProfile) {
      //   setAyrshareProfile(storedProfile);
      //   await loadAyrshareConnections();
      //   return;
      // }

      // Try to get profile from API (this will check database first)
      try {
        console.log("11111111111Getting Ayrshare profile from API...");
        const response = await getAyrshareProfile();
        console.log("11111111111111111Getting Ayrshare profile from API... ", {
          response,
        });
        if (response.data) {
          setAyrshareProfile(response.data);
          // Store in localStorage for future use
          localStorage.setItem(
            "ayrshare_profile",
            JSON.stringify({
              profile_key: response.data.profile_key,
              title: response.data.title,
              created_at: new Date().toISOString(),
            })
          );
          await loadAyrshareConnections();
        }
      } catch (profileError) {
        console.log(
          "11111111111111111No Ayrshare profile found, creating one..."
        );
        // If no profile exists, create one
        console.log("No Ayrshare profile found, creating one...");
        await createUserAyrshareProfile();
      }
    } catch (err) {
      console.log("Could not load Ayrshare profile:", err);
    } finally {
      setAyrshareLoading(false);
    }
  };
console.log("ayrshareConnections",ayrshareConnections)
  const createUserAyrshareProfile = async () => {
    try {
      setAyrshareLoading(true);
      setAyrshareError(null);

      // Get user email for profile title
      const token = localStorage.getItem("access-token");
      if (!token) {
        throw new Error("No authentication token found");
      }
      console.log("11111111111111111Creating Ayrshare profile... ", { token });
      // Get user profile data to use email as title
      const profileResponse = await axios.get("/api/v1/get-profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userEmail = profileResponse.data?.email || `user_${Date.now()}`;

      // Create Ayrshare profile
      const response = await createAyrshareProfile(userEmail);

      if (response.data && response.data.profile_key) {
        await registerAyrshareWebhook();
        // Store profile in localStorage
        localStorage.setItem(
          "ayrshare_profile",
          JSON.stringify({
            profile_key: response.data.profile_key,
            title: response.data.title,
            created_at: new Date().toISOString(),
          })
        );

        setAyrshareProfile({
          profile_key: response.data.profile_key,
          title: response.data.title,
        });

        // setAyrshareSuccess("Ayrshare profile created successfully!");
        // setTimeout(() => setAyrshareSuccess(null), 3000);
        // Load connections after profile creation
        await loadAyrshareConnections();
      }
    } catch (err) {
      console.error("11111111111Error creating Ayrshare profile:", err);
      setAyrshareError(
        err.response?.data?.detail || "Failed to create Ayrshare profile"
      );
    } finally {
      setAyrshareLoading(false);
    }
  };

  const loadAyrshareConnections = async () => {
    if (!ayrshareProfile) return;

    try {
      const response = await getAyrshareConnectedAccounts();
      if (response.data && response.data.accounts) {
        // Filter out invalid accounts (empty usernames, user_ids, display_names)
        const validAccounts = response.data.accounts.filter((account) => {
          const hasValidData =
            account.is_active &&
            (account.username || account.user_id || account.display_name);

          if (!hasValidData) {
            console.log(
              `Filtering out invalid account for ${account.platform}:`,
              account
            );
          }

          return hasValidData;
        });

        setAyrshareConnections(validAccounts);
      }
    } catch (err) {
      console.log("Could not load Ayrshare connections:", err);
    }
  };

  const connectAyrsharePlatform = async (platform) => {
    if (!ayrshareProfile) {
      setAyrshareError(
        "No Ayrshare profile found. Please create a profile first."
      );
      return;
    }

    try {
      setPlatformLoading((prev) => ({ ...prev, [platform]: true }));
      setAyrshareError(null);
      setAyrshareSuccess(null);

      // Generate platform-specific JWT with allowedSocial parameter
      const platformKey = platform.toLowerCase();
      const allowedSocial = [platformKey]; // Only allow the specific platform

      const response = await generateAyrshareJWT(1, 10, allowedSocial);
      const jwt = response.data.jwt;
      const connectUrl =
        response.data.url || `https://app.ayrshare.com/connect?jwt=${jwt}`;

      // Open connection window
      const connectWindow = window.open(
        connectUrl,
        "_blank",
        "width=800,height=600"
      );

      // Show instruction to user
      // setAyrshareSuccess(
      //   `Please complete the connection in the popup window. We'll automatically detect when it's successful!`
      // );
      // setTimeout(() => setAyrshareSuccess(null), 5000);

      // Rely on webhook to update the backend; after user finishes, we'll sync
      // Optionally, perform a single delayed sync shortly after open to catch quick callbacks

      // Check if window was closed manually
      const checkClosedInterval = setInterval(() => {
        if (!connectWindow || connectWindow.closed) {
          clearInterval(checkClosedInterval);
          setConnectClosed(true);
        }
      }, 800);

      // Auto-close popup after 5 minutes if no success detected
      const autoCloseTimeout = setTimeout(() => {
        if (!connectWindow.closed) {
          console.log("Auto-closing popup after timeout");
          connectWindow.close();
        }
        clearInterval(checkClosedInterval);
        setConnectClosed(true);
      }, 5 * 60 * 1000); // 5 minutes
    } catch (err) {
      setAyrshareError(
        err.response?.data?.detail || `Failed to connect ${platform}`
      );
      setPlatformLoading((prev) => ({ ...prev, [platform]: false }));
    }
    // Don't reset loading in finally - keep it loading while popup is open
    // Loading will be reset when popup closes via the useEffect
  };

  const isAyrsharePlatformConnected = (platformId) => {
    return ayrshareConnections.some((account) => {
      const isPlatformMatch =
        account.platform.toLowerCase() === platformId.toLowerCase();
      const hasValidData =
        account.is_active &&
        (account.username || account.user_id || account.display_name);
      return isPlatformMatch && hasValidData;
    });
  };

  const getAyrshareConnectedAccount = (platformId) => {
    const account = ayrshareConnections.find(
      (account) => account.platform.toLowerCase() === platformId.toLowerCase()
    );

    // Only return account if it has valid data
    if (
      account &&
      account.is_active &&
      (account.username || account.user_id || account.display_name)
    ) {
      return account;
    }

    return null;
  };

  // React to popup-closed state to refresh immediately, retry briefly, then sync
  useEffect(() => {
    if (!connectClosed) return;
    (async () => {
      // Reset flag early to avoid duplicate runs
      setConnectClosed(false);

     await syncAyrshareConnections();
     await loadAyrshareConnections();
     
     // Clear all platform loading states
     setPlatformLoading({});
    })();
  }, [connectClosed]);

  const handleConnectionSuccess = async (platform) => {
    // Fetch updated connection status first
    await fetchConnectionStatus();

    // Get the latest connection status
    const response = await axios.get("/auth/social-connections");
    const connections = response.data || [];
    let profileInfo = {};

    // Find the profile info for the connected platform
    connections.forEach((conn) => {
      const connPlatform = conn.platform?.toLowerCase();
      if (connPlatform === platform) {
        profileInfo = conn.profile_info || {};
      }
    });

    // Update onboarding step with success
    const stepNumber = platform === "linkedin" ? 1 : 2;
    await updateOnboardingStep(stepNumber, {
      [`${platform}_connected`]: true,
      [`${platform}_profile`]: profileInfo,
    });
  };

  const updateOnboardingStep = async (stepNumber, stepData = {}) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access-token");

      const response = await axios.put(
        "/onboarding/step",
        {
          step_number: stepNumber,
          step_data: stepData,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update parent component with new onboarding data
      if (onOnboardingUpdate) {
        onOnboardingUpdate(response.data);
      }
    } catch (error) {
      console.error("Error updating onboarding step:", error);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async (skipOnboarding = false) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("access-token");

      const response = await axios.post(
        "/onboarding/complete",
        {
          skip_onboarding: skipOnboarding,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update parent component with new onboarding data
      if (onOnboardingUpdate) {
        onOnboardingUpdate(response.data);
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
    } finally {
      setLoading(false);
    }
  };

  // Dedicated handler for Skip All to avoid toggling global `loading`
  const completeOnboardingSkipAll = async (skipOnboarding = true) => {
    try {
      setSkipAllLoading(true);
      const token = localStorage.getItem("access-token");

      const response = await axios.post(
        "/onboarding/complete",
        {
          skip_onboarding: skipOnboarding,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (onOnboardingUpdate) {
        onOnboardingUpdate(response.data);
      }
    } catch (error) {
      console.error("Error completing onboarding:", error);
    } finally {
      setSkipAllLoading(false);
    }
  };

  const handleOnboard = async (platform) => {
    console.log(`Onboarding with ${platform}`);

    // Check if Ayrshare is available and try to use it first
    if (ayrshareProfile && isAyrsharePlatformConnected(selectedPlatform)) {
      console.log(`${selectedPlatform} is already connected via Ayrshare`);
      await handleConnectionSuccess(selectedPlatform);
      return;
    }

    // Try Ayrshare connection first if profile is available
    if (ayrshareProfile) {
      console.log(`Attempting Ayrshare connection for ${selectedPlatform}`);
      await connectAyrsharePlatform(selectedPlatform);
      return;
    }

    // Fallback to original OAuth method
    const token = localStorage.getItem("access-token");
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      setLoading(true);

      if (selectedPlatform === "linkedin") {
        const response = await axios.get("/auth/linkedin/connect", {
          headers: authHeaders,
        });

        // Open LinkedIn OAuth in popup window
        const popup = window.open(
          response.data.auth_url,
          "linkedin-auth",
          "width=600,height=700,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no"
        );

        console.log("Popup:", popup);

        if (popup) {
          setPopupWindow(popup);

          // Check if popup is closed manually
          const checkClosed = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkClosed);
              setPopupWindow(null);
              setLoading(false);
            }
          }, 1000);
        } else {
          // Popup blocked, fallback to redirect
          console.warn("Popup blocked, falling back to redirect");
          window.location.href = response.data.auth_url;
        }
      } else if (selectedPlatform === "twitter") {
        const response = await axios.get("/auth/x/connect", {
          headers: authHeaders,
        });

        // Open X OAuth in popup window
        const popup = window.open(
          response.data.auth_url,
          "x-auth",
          "width=600,height=700,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no"
        );

        if (popup) {
          setPopupWindow(popup);

          // Check if popup is closed manually
          const checkClosed = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkClosed);
              setPopupWindow(null);
              setLoading(false);
            }
          }, 1000);
        } else {
          // Popup blocked, fallback to redirect
          console.warn("Popup blocked, falling back to redirect");
          window.location.href = response.data.auth_url;
        }
      }
    } catch (error) {
      console.error(
        `${selectedPlatform} connection failed:`,
        error?.response?.status,
        error?.response?.data || error?.message
      );
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    console.log("Skipping current step");

    // Map platform names to step numbers
    const platformToStep = {
      linkedin: 1,
      twitter: 2,
      facebook: 3,
      instagram: 4,
    };

    const stepNumber = platformToStep[selectedPlatform];
    if (stepNumber) {
      // Mark current step as skipped with false value
      await updateOnboardingStep(stepNumber, {
        [`${selectedPlatform}_connected`]: false,
      });

      // Move to next platform or complete onboarding
      handleConnectToNext();
    }
  };

  const handleSkipAll = async () => {
    console.log("Skipping entire onboarding");
    await completeOnboardingSkipAll(true);
  };

  const handleConnectToNext = () => {
    console.log("Navigating to next step or dashboard");

    // Find current platform index
    const currentIndex = platforms.findIndex((p) => p.id === selectedPlatform);
    const nextIndex = currentIndex + 1;

    // If there's a next platform, move to it
    if (nextIndex < platforms.length) {
      const nextPlatform = platforms[nextIndex];
      setSelectedPlatform(nextPlatform.id);
    } else {
      // If this is the last platform, complete onboarding
      completeOnboarding(false);
    }
  };

  const platforms = [
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: linkedinIcon,
      color: "#0077B5",
      available: true,
    },
    {
      id: "twitter",
      name: "X",
      icon: twitterIcon,
      color: "#000000",
      available: true,
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: facebookIcon,
      color: "#1877F2",
      available: true,
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: instagramIcon,
      color:
        "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
      available: true,
    },
  ];

  const selectedPlatformData = platforms.find((p) => p.id === selectedPlatform);

  const isPlatformActive = (platformId) => {
    const currentIndex = platforms.findIndex((p) => p.id === selectedPlatform);
    const platformIndex = platforms.findIndex((p) => p.id === platformId);
    return platformIndex <= currentIndex;
  };

  const isConnectionLineActive = (platformId) => {
    const currentIndex = platforms.findIndex((p) => p.id === selectedPlatform);
    const platformIndex = platforms.findIndex((p) => p.id === platformId);
    return platformIndex < currentIndex;
  };

  const getDisplayName = (platform) => {
    // Check Ayrshare connection first
    const ayrshareAccount = getAyrshareConnectedAccount(platform);
    if (ayrshareAccount) {
      return ayrshareAccount.display_name || ayrshareAccount.username || "User";
    }

    // Fallback to regular connection status
    const profile = connectionStatus[platform]?.profile_info;
    if (!profile) return null;

    if (platform === "linkedin") {
      return profile.localizedFirstName && profile.localizedLastName
        ? `${profile.localizedFirstName} ${profile.localizedLastName}`
        : profile.name || "LinkedIn User";
    } else if (platform === "twitter") {
      return profile.name || profile.username || "Twitter User";
    } else if (platform === "facebook") {
      return profile.name || profile.username || "Facebook User";
    } else if (platform === "instagram") {
      return profile.name || profile.username || "Instagram User";
    }
    return null;
  };

  const getProfileImage = (platform) => {
    // Check Ayrshare connection first
    const ayrshareAccount = getAyrshareConnectedAccount(platform);
    if (ayrshareAccount) {
      return (
        ayrshareAccount.user_image || ayrshareAccount.platform_image || null
      );
    }

    // Fallback to regular connection status
    const profile = connectionStatus[platform]?.profile_info;
    if (!profile) {
      console.log(`No profile info for ${platform}`);
      return null;
    }

    console.log(`Profile info for ${platform}:`, profile);

    // Check multiple possible field names for profile image
    const imageUrl =
      profile.profile_image_url ||
      profile.profilePictureUrl ||
      profile.picture ||
      profile.profilePicture ||
      null;

    console.log(`Profile image URL for ${platform}:`, imageUrl);
    return imageUrl;
  };

  const isConnected = (platform) => {
    // Check Ayrshare connection first
    if (isAyrsharePlatformConnected(platform)) {
      return true;
    }
    // Fallback to regular connection status
    return connectionStatus[platform]?.is_connected || false;
  };

  return (
    <>
      <style>
        {`
                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }
                
                @media (max-width: 768px) {
    .Login-hero {
        height: 100vh;
        padding-bottom: 25px;
    }
}

.connected-profile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 15px;
    margin-top: 20px;
}

.profile-info {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.profile-image {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 0.3);
}

.profile-initials {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
    font-size: 14px;
    border: 2px solid rgba(255, 255, 255, 0.3);
}

.profile-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.profile-name {
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin: 0;
}

.profile-status {
    font-size: 12px;
    color: #28a745;
    margin: 0;
    font-weight: 500;
}

.central-card-btn.connected {
    background: #28a745;
    color: white;
    cursor: not-allowed;
    opacity: 0.8;
}
.skip-all-btn {
    background: transparent;
    color: #012C33;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: transform 0.2s ease, background-color 0.2s ease;
    text-decoration: underline;
    text-underline-offset: 4px;
}

/* Zoom effect on hover (but not when disabled) */
.skip-all-btn:hover:not(:disabled) {
    transform: scale(1.05); /* Zoom in slightly */
 
}

/* Disabled state */
.skip-all-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none; /* No scaling on disabled */
}
                `}
      </style>
      <div className="container-fluid px-4 px-lg-0 Login-hero overflow-hidden">
        {/* Header with logo and social icons */}
        <div className="container top-nv d-flex justify-content-between align-items-center pt-4 px-2 px-lg-0">
          <img src={logo} className="logo" alt="Simbli" />
          <div className="d-flex gap-md-3 gap-2">
            {/* Youtube */}
            <a
              href="https://www.youtube.com/@Simbli-ai"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={soc1} className="nv-icon-soc" alt="social" />
            </a>
            {/* Twitter */}
            <a
              href="https://x.com/Simbli_ai"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={soc2} className="nv-icon-soc" alt="social" />
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/simbli.ai/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={soc3} className="nv-icon-soc" alt="social" />
            </a>
            {/* Facebook */}
            <a
              href="https://www.facebook.com/SimbliAi/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={soc4} className="nv-icon-soc" alt="social" />
            </a>
            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/company/simbliai"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={soc5} className="nv-icon-soc" alt="social" />
            </a>

            {/* Reddit */}
            <a
              href="https://www.reddit.com/user/Simbli_ai/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src={soc6} className="nv-icon-soc" alt="social" />
            </a>
          </div>
        </div>

        <div className="container d-flex flex-column align-items-center justify-content-center pt-lg-2 pt-5 mt-lg-0 mt-5 p-0">
          <div className=" py-4 px-lg-5 px-3 col-lg-6">
            {/* Main title and subtitle */}
            <div className="text-left mb-4 ms-lg-4">
              <h1 className="split-title mb-2">Onboarding</h1>
              <p className="split-subtitle mb-4">Continue with Your Network</p>
            </div>

            {/* Success/Error Messages */}
            {ayrshareSuccess && (
              <div className="alert alert-success mt-3" role="alert">
                {ayrshareSuccess}
              </div>
            )}
            {ayrshareError && (
              <div className="alert alert-danger mt-3" role="alert">
                {ayrshareError}
              </div>
            )}

            {/* Social Network Selection Row */}
            <div className="social-selection-container mb-4 ms-lg-4">
              <div className="social-selection-line">
                {platforms.map((platform, index) => (
                  <div key={platform.id} className="social-selection-item">
                    <div
                      className={`social-selection-icon ${
                        isPlatformActive(platform.id) ? "active" : ""
                      }`}
                      onClick={() => setSelectedPlatform(platform.id)}
                      data-platform={platform.id}
                      style={{
                        cursor: "pointer",
                      }}
                    >
                      <img src={platform.icon} alt={platform.name} />
                    </div>
                    {index < platforms.length - 1 && (
                      <div
                        className={`connection-line ${
                          isConnectionLineActive(platform.id) ? "active" : ""
                        }`}
                      ></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Central Card */}
            <div className="central-card-container">
              <div key={selectedPlatform} className="central-card">
                <div
                  className="central-card-icon"
                  style={{ background: selectedPlatformData.color }}
                >
                  <img
                    src={selectedPlatformData.icon}
                    alt={selectedPlatformData.name}
                  />
                </div>
                <h3 className="central-card-title">
                  {selectedPlatformData.name}
                </h3>

                {/* Show connected profile info */}
                {isConnected(selectedPlatform) ? (
                  <div className="connected-profile">
                    <div className="profile-info">
                      {getProfileImage(selectedPlatform) ? (
                        <img
                          src={getProfileImage(selectedPlatform)}
                          alt="Profile"
                          className="profile-image"
                          onError={(e) => {
                            console.log(
                              "Profile image failed to load:",
                              getProfileImage(selectedPlatform)
                            );
                            e.target.style.display = "none";
                            e.target.nextSibling.style.display = "flex";
                          }}
                          onLoad={(e) => {
                            console.log(
                              "Profile image loaded successfully:",
                              getProfileImage(selectedPlatform)
                            );
                          }}
                        />
                      ) : null}
                      <div
                        className="profile-initials"
                        style={{
                          display: getProfileImage(selectedPlatform)
                            ? "none"
                            : "flex",
                        }}
                      >
                        {getDisplayName(selectedPlatform)
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase() || "U"}
                      </div>
                      <div className="profile-details">
                        <p className="profile-name">
                          {getDisplayName(selectedPlatform)}
                        </p>
                      </div>
                    </div>
                    <button
                      className="central-card-btn"
                      onClick={handleConnectToNext}
                      disabled={connectWindow || loading}
                    >
                      {loading ? "Loading..." : "Next"}
                    </button>
                  </div>
                ) : (
                  <button
                    className="central-card-btn"
                    onClick={() => handleOnboard(selectedPlatformData.name)}
                    disabled={connectWindow || loading || platformLoading[selectedPlatform]}
                    style={{
                      opacity: platformLoading[selectedPlatform] ? 1 : undefined,
                      backgroundColor: platformLoading[selectedPlatform] ? '#84E084' : undefined,
                      color: platformLoading[selectedPlatform] ? '#021E22' : undefined,
                      cursor: platformLoading[selectedPlatform] ? 'not-allowed' : undefined,
                      minHeight: '48px',
                      padding: loading || platformLoading[selectedPlatform] ? '10px 32px' : '10px 32px',
                      width: loading || platformLoading[selectedPlatform] ? 'auto' : '40%',
                      transition: 'width 0.3s ease',
                    }}
                  >
                    {loading || platformLoading[selectedPlatform] ? (
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        <div 
                          style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid #021E22',
                            borderTop: '2px solid transparent',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            display: 'inline-block'
                          }}
                        ></div>
                        <span>Connecting...</span>
                      </div>
                    ) : (
                      "Connect"
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Skip Options */}
            <div className="skip-container me-lg-4 d-flex gap-3">
              {/* <button
                className="skip-btn"
                onClick={handleSkip}
                disabled={loading}
              >
                {loading ? "Skipping..." : "Skip This >>"}
              </button> */}
              <button
                className="skip-all-btn ms-lg-5 d-flex align-items-center justify-content-center"
                onClick={handleSkipAll}
                disabled={connectWindow || skipAllLoading}
              >
                {skipAllLoading ? "Skipping..." : "Skip All"} <svg className="ms-1" width="12" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M1 11L6 6L1 1M8 11L13 6L8 1" stroke="#012C33" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

              </button>
            </div>
          </div>
        </div>
      </div>{" "}
    </>
  );
};

export default Split;
