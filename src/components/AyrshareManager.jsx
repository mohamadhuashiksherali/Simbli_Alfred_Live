import { useState, useEffect } from "react";
import {
  getAyrshareProfile,
  generateAyrshareJWT,
  getAyrshareConnectedAccounts,
  disconnectAyrshareSocialAccount,
  syncAyrshareConnections,
  analyzeWritingStyle,
} from "../api/api.js";
import { loadProfileFromStorage } from "../utils/ayrshareStorage.js";
import { useAyrshareConnection } from "../contexts/AyrshareConnectionContext";

function  AyrshareManager({ isAnalyzingWritingStyle, setIsAnalyzingWritingStyle, ayrshareConnections, fetchAyrshareConnections }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const {
    platformLoading,
    setPlatformLoadingState,
    clearPlatformLoading,
    clearAllPlatformLoading,
    setPopupWindowRef,
    getPopupWindowRef,
  } = useAyrshareConnection();
  const [recentlyDisconnected, setRecentlyDisconnected] = useState({});
  const [analyzingWritingStyle, setAnalyzingWritingStyle] = useState(false);
  const [connectClosed, setConnectClosed] = useState(false);

  // Function to trigger writing style analysis for LinkedIn
  const triggerWritingStyleAnalysis = async (platform) => {
    if (platform.toLowerCase() !== "linkedin" || !profile?.profile_key) {
      return;
    }

    try {
      setAnalyzingWritingStyle(true);
      console.log("Triggering writing style analysis for LinkedIn...");
      
      // Wait a bit for the connection to be fully established
      setTimeout(async () => {
        try {
          await analyzeWritingStyle(profile.profile_key, "linkedin", 12);
          console.log("Writing style analysis completed successfully");
          setIsAnalyzingWritingStyle(true);
        } catch (error) {
          console.log("Writing style analysis failed:", error);
          // Don't show error to user as this is automatic
        } finally {
          setAnalyzingWritingStyle(false);
        }
      }, 2000); // Wait 2 seconds after connection
      
    } catch (error) {
      console.log("Error triggering writing style analysis:", error);
      setAnalyzingWritingStyle(false);
    }
  };

  // React to popup-closed state to refresh immediately, retry briefly, then sync
  useEffect(() => {
    if (!connectClosed) return;
    (async () => {
      setConnectClosed(false);
      
      // Stop all loading states when popup closes - clear context state
      clearAllPlatformLoading();
      
      await syncAyrshareConnections();
      await loadConnectedAccounts();
      
      // Refresh parent state to get latest data
      if (fetchAyrshareConnections) {
        await fetchAyrshareConnections();
      }
      
      await triggerWritingStyleAnalysis("linkedin");
    })();
  }, [connectClosed, clearAllPlatformLoading, fetchAyrshareConnections]);

  const availablePlatforms = [
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: (
        <svg
          width="61"
          height="61"
          viewBox="0 0 61 61"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="30.5" cy="30.5" r="30.5" fill="#0A66C3" />
          <path
            d="M21.036 17.5962C19.1407 17.5962 17.5976 19.139 17.5962 21.0358C17.5962 22.9325 19.1393 24.4756 21.036 24.4756C22.9319 24.4756 24.4743 22.9325 24.4743 21.0358C24.4743 19.1392 22.9318 17.5962 21.036 17.5962Z"
            fill="white"
          />
          <path
            d="M23.6176 25.8574H18.454C18.2084 25.8574 18.0092 26.0566 18.0092 26.3024V42.9224C18.0092 43.1681 18.2084 43.3673 18.454 43.3673H23.6175C23.8632 43.3673 24.0624 43.168 24.0624 42.9224V26.3024C24.0625 26.0565 23.8633 25.8574 23.6176 25.8574Z"
            fill="white"
          />
          <path
            d="M36.8179 25.6621C34.9283 25.6621 33.2677 26.2375 32.2544 27.1758V26.3027C32.2544 26.0569 32.0552 25.8578 31.8095 25.8578H26.8563C26.6106 25.8578 26.4114 26.0569 26.4114 26.3027V42.9227C26.4114 43.1685 26.6106 43.3676 26.8563 43.3676H32.015C32.2607 43.3676 32.4599 43.1684 32.4599 42.9227V34.7C32.4599 32.3407 32.8939 30.8784 35.0595 30.8784C37.1932 30.881 37.3529 32.4491 37.3529 34.841V42.9227C37.3529 43.1685 37.5521 43.3676 37.7979 43.3676H42.9589C43.2046 43.3676 43.4038 43.1684 43.4038 42.9227V33.8059C43.4037 30.0143 42.6551 25.6621 36.8179 25.6621Z"
            fill="white"
          />
        </svg>
      ),
      description: "Professional Network",
    },
    {
      id: "twitter",
      name: "X",
      icon: (
        <svg
          width="61"
          height="61"
          viewBox="0 0 61 61"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="30.5" cy="30.5" r="30.5" fill="black" />
          <path
            d="M38.8393 18.0121H43.2844L33.573 29.0186L45 44H36.0514L29.0403 34.9145L21.0226 44H16.5776L26.9664 32.213L16 18H25.1752L31.5113 26.3026L38.8393 18.0121ZM37.2797 41.3589H39.7435L23.8422 20.5106H21.1981L37.2797 41.3589Z"
            fill="white"
          />
        </svg>
      ),
      description: "Microblogging Platform",
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: (
        <svg
          width="61"
          height="61"
          viewBox="0 0 61 61"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="30.5"
            cy="30.5"
            r="30.5"
            fill="url(#paint0_linear_494_55)"
          />
          <path
            d="M25.3342 31C25.3342 27.8705 27.8705 25.3329 31 25.3329C34.1295 25.3329 36.6671 27.8705 36.6671 31C36.6671 34.1295 34.1295 36.6671 31 36.6671C27.8705 36.6671 25.3342 34.1295 25.3342 31ZM22.2707 31C22.2707 35.8212 26.1788 39.7293 31 39.7293C35.8212 39.7293 39.7293 35.8212 39.7293 31C39.7293 26.1788 35.8212 22.2707 31 22.2707C26.1788 22.2707 22.2707 26.1788 22.2707 31ZM38.0348 21.9246C38.0348 23.0506 38.948 23.9652 40.0754 23.9652C41.2014 23.9652 42.1159 23.0506 42.1159 21.9246C42.1159 20.7986 41.2027 19.8855 40.0754 19.8855C38.948 19.8855 38.0348 20.7986 38.0348 21.9246ZM24.1313 44.8376C22.4739 44.762 21.5731 44.486 20.9744 44.2526C20.1807 43.9436 19.6149 43.5756 19.019 42.981C18.4244 42.3864 18.055 41.8207 17.7474 41.027C17.514 40.4283 17.238 39.5275 17.1624 37.87C17.08 36.078 17.0636 35.5397 17.0636 31C17.0636 26.4603 17.0814 25.9233 17.1624 24.13C17.238 22.4725 17.5153 21.5731 17.7474 20.973C18.0564 20.1793 18.4244 19.6136 19.019 19.0176C19.6136 18.423 20.1793 18.0536 20.9744 17.746C21.5731 17.5126 22.4739 17.2366 24.1313 17.1611C25.9233 17.0787 26.4616 17.0622 31 17.0622C35.5397 17.0622 36.0767 17.08 37.87 17.1611C39.5275 17.2366 40.4269 17.514 41.027 17.746C41.8207 18.0536 42.3864 18.423 42.9824 19.0176C43.577 19.6122 43.945 20.1793 44.254 20.973C44.4874 21.5717 44.7634 22.4725 44.8389 24.13C44.9213 25.9233 44.9378 26.4603 44.9378 31C44.9378 35.5384 44.9213 36.0767 44.8389 37.87C44.7634 39.5275 44.486 40.4283 44.254 41.027C43.945 41.8207 43.577 42.3864 42.9824 42.981C42.3878 43.5756 41.8207 43.9436 41.027 44.2526C40.4283 44.486 39.5275 44.762 37.87 44.8376C36.078 44.92 35.5397 44.9364 31 44.9364C26.4616 44.9364 25.9233 44.92 24.1313 44.8376ZM23.9913 14.103C22.1814 14.1854 20.9456 14.4724 19.8649 14.8926C18.7471 15.3265 17.7996 15.9087 16.8535 16.8535C15.9087 17.7982 15.3265 18.7457 14.8926 19.8649C14.4724 20.9456 14.1854 22.1814 14.103 23.9913C14.0192 25.8039 14 26.3834 14 31C14 35.6166 14.0192 36.1961 14.103 38.0087C14.1854 39.8186 14.4724 41.0544 14.8926 42.1351C15.3265 43.2529 15.9074 44.2018 16.8535 45.1465C17.7982 46.0913 18.7457 46.6721 19.8649 47.1074C20.9469 47.5276 22.1814 47.8146 23.9913 47.897C25.8052 47.9794 26.3834 48 31 48C35.618 48 36.1961 47.9808 38.0087 47.897C39.8186 47.8146 41.0544 47.5276 42.1351 47.1074C43.2529 46.6721 44.2004 46.0913 45.1465 45.1465C46.0913 44.2018 46.6721 43.2529 47.1074 42.1351C47.5276 41.0544 47.816 39.8186 47.897 38.0087C47.9794 36.1947 47.9986 35.6166 47.9986 31C47.9986 26.3834 47.9794 25.8039 47.897 23.9913C47.8146 22.1814 47.5276 20.9456 47.1074 19.8649C46.6721 18.7471 46.0913 17.7996 45.1465 16.8535C44.2018 15.9087 43.2529 15.3265 42.1365 14.8926C41.0544 14.4724 39.8186 14.184 38.0101 14.103C36.1975 14.0206 35.618 14 31.0014 14C26.3834 14 25.8052 14.0192 23.9913 14.103Z"
            fill="white"
          />
          <defs>
            <linearGradient
              id="paint0_linear_494_55"
              x1="30.5"
              y1="0"
              x2="30.5"
              y2="61"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#F327BC" />
              <stop offset="1" stopColor="#FFE32D" />
            </linearGradient>
          </defs>
        </svg>
      ),
      description: "Photo & Video Sharing",
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: (
        <svg
          width="61"
          height="61"
          viewBox="0 0 61 61"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="30.5" cy="30.5" r="30.5" fill="#2079FF" />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M39 25.6875H32.625V21.4375C32.625 20.8739 32.8489 20.3334 33.2474 19.9349C33.6459 19.5364 34.1864 19.3125 34.75 19.3125H36.875V14H32.625C30.9342 14 29.3127 14.6716 28.1172 15.8672C26.9216 17.0627 26.25 18.6842 26.25 20.375V25.6875H22V31H26.25V48H32.625V31H36.875L39 25.6875Z"
            fill="white"
          />
        </svg>
      ),
      description: "Social Network",
    },
  ];

  useEffect(() => {
    loadProfile();
  }, []);
  
  // Check for any ongoing connections when component mounts or platformLoading changes
  useEffect(() => {
    // Check for any ongoing connections (e.g., after tab switch)
    // Set up interval to check if popups are still open
    // NOTE: This only applies to CONNECT operations (which have popup windows)
    // DISCONNECT operations don't have popup windows, so they're handled separately
    const checkIntervals = {};
    Object.keys(platformLoading).forEach(platformKey => {
      if (platformLoading[platformKey] === true) {
        const popupWindow = getPopupWindowRef(platformKey);
        if (popupWindow && !popupWindow.closed) {
          // Set up interval to check if popup is still open (CONNECT operation)
          checkIntervals[platformKey] = setInterval(() => {
            const currentWindow = getPopupWindowRef(platformKey);
            if (!currentWindow || currentWindow.closed) {
              clearInterval(checkIntervals[platformKey]);
              clearPlatformLoading(platformKey);
              setConnectClosed(true);
            }
          }, 800);
        } else if (popupWindow !== null && popupWindow !== undefined && profile) {
          // Popup reference exists but window is closed - this is a CONNECT operation that completed
          // Only check for connection completion if a popup window was actually opened
          // Disconnect operations never set popup references, so they won't trigger this
          loadConnectedAccounts();
        }
        // If popupWindow is null/undefined, it means no popup was ever created
        // This is likely a DISCONNECT operation, which is handled separately
        // Don't interfere with disconnect operations here
      }
    });
    
    // Cleanup intervals on unmount or when dependencies change
    return () => {
      Object.values(checkIntervals).forEach(interval => clearInterval(interval));
    };
  }, [platformLoading, getPopupWindowRef, clearPlatformLoading, profile]);
  
  // Check for popup closure when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible, check if any popups are closed
        // NOTE: This only applies to CONNECT operations (which have popup windows)
        // DISCONNECT operations don't have popup windows, so they're handled separately
        Object.keys(platformLoading).forEach(platformKey => {
          if (platformLoading[platformKey] === true) {
            const popupWindow = getPopupWindowRef(platformKey);
            // Only check popup closure if a popup window was actually opened (CONNECT operation)
            // Disconnect operations never set popup references
            if (popupWindow !== null && popupWindow !== undefined) {
              try {
                if (popupWindow.closed) {
                  clearPlatformLoading(platformKey);
                  setConnectClosed(true);
                }
              } catch (e) {
                // Popup might be from different origin
                clearPlatformLoading(platformKey);
                setConnectClosed(true);
              }
            }
            // If popupWindow is null/undefined, it's a DISCONNECT operation - don't interfere
          }
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [platformLoading, getPopupWindowRef, clearPlatformLoading]);

  // Use connected accounts from props if available, otherwise load from API
  useEffect(() => {
    if (ayrshareConnections && ayrshareConnections.length > 0) {
      console.log("Using Ayrshare connections from props:", ayrshareConnections);
      // Filter out invalid accounts
      const validAccounts = ayrshareConnections.filter((account) => {
        const hasValidData =
          account.is_active &&
          (account.username || account.user_id || account.display_name);
        return hasValidData;
      });
      setConnectedAccounts(validAccounts);
    } else if (profile) {
      console.log("Loading Ayrshare connected accounts from API...");
      loadConnectedAccounts();
    }
  }, [profile, ayrshareConnections]);

  // Handle redirect from Ayrshare connection
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ayrshareSuccess = urlParams.get("ayrshare_success");
    const ayrshareConnected = urlParams.get("ayrshare_connected");
    const platform = urlParams.get("platform");

    if (
      (ayrshareSuccess === "true" || ayrshareConnected === "true") &&
      platform
    ) {
      // Remove the URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      // Refresh connected accounts
      if (profile) {
        console.log("response.data.accounts 2222222");
        loadConnectedAccounts();
      }

      // Show success message
      setSuccess(
        `${
          platform.charAt(0).toUpperCase() + platform.slice(1)
        } connected successfully!`
      );

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    }
  }, [profile]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // Try to load from localStorage first
      const storedProfile = loadProfileFromStorage();
      if (storedProfile) {
        setProfile(storedProfile);
        console.log("response.data.accounts 3333333");
        await loadConnectedAccounts();
        return;
      }

      // If no stored profile, try to get default profile from API
      const response = await getAyrshareProfile();
      if (response.data) {
        setProfile(response.data);
        console.log("response.data.accounts 4444444");
        await loadConnectedAccounts();
      }
    } catch (err) {
      console.log("Could not load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadConnectedAccounts = async () => {
    if (!profile) return;

    try {
      const response = await getAyrshareConnectedAccounts();
      if (response.data && response.data.accounts) {
        console.log("response.data.accounts", response.data.accounts);

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

        console.log("Valid accounts after filtering:", validAccounts);

        // Debug: Log each account's image data
        validAccounts.forEach((account) => {
          console.log(`Account for ${account.platform}:`, {
            username: account.username,
            user_image: account.user_image,
            platform_image: account.platform_image,
            display_name: account.display_name,
          });
        });

        setConnectedAccounts(validAccounts);
        
        // Check if any loading platforms have now connected
        Object.keys(platformLoading).forEach(platformKey => {
          if (platformLoading[platformKey] === true) {
            // Check if this platform is now connected
            const isNowConnected = validAccounts.some((account) => {
              const isPlatformMatch =
                account.platform.toLowerCase() === platformKey.toLowerCase();
              const hasValidData =
                account.is_active &&
                (account.username || account.user_id || account.display_name);
              return isPlatformMatch && hasValidData;
            });
            
            if (isNowConnected) {
              // Platform is now connected, clear loading state
              clearPlatformLoading(platformKey);
              setPopupWindowRef(platformKey, null);
              setConnectClosed(true);
            }
          }
        });
      }
    } catch (err) {
      console.log("Could not load connected accounts:", err);
    }
  };

  const connectPlatform = async (platform) => {
    if (!profile) {
      setError("No profile found. Please create a profile first.");
      return;
    }

    try {
      setPlatformLoadingState(platform.toLowerCase(), true);
      setError(null);
      setSuccess(null);

      // Generate platform-specific JWT with allowedSocial parameter
      const platformKey = platform.toLowerCase();
      const allowedSocial = [platformKey]; // Only allow the specific platform

      const response = await generateAyrshareJWT(
        profile.profile_key,
        10,
        allowedSocial
      );
      const jwt = response.data.jwt;
      const connectUrl =
        response.data.url || `https://app.ayrshare.com/connect?jwt=${jwt}`;

      // Open connection window
      const connectWindow = window.open(
        connectUrl,
        `AyrsharePopup_${platformKey}_${Date.now()}`,
        "width=800,height=600"
      );

      // Store popup window reference in context - persists across tab switches
      setPopupWindowRef(platformKey, connectWindow);

      // Show instruction to user
      setSuccess(
        `Please complete the connection in the popup window. We'll automatically detect when it's successful!`
      );
      setTimeout(() => setSuccess(null), 5000);

      // Rely on webhook to update backend; we'll sync after the popup closes

      // Periodically check if popup was closed
      const checkClosedInterval = setInterval(() => {
        const currentWindow = getPopupWindowRef(platformKey) || connectWindow;
        if (!currentWindow || currentWindow.closed) {
          clearInterval(checkClosedInterval);
          setPopupWindowRef(platformKey, null);
          clearPlatformLoading(platformKey);
          setConnectClosed(true);
        }
      }, 800);

      // Auto-close popup after 5 minutes if no success detected
      const autoCloseTimeout = setTimeout(() => {
        const currentWindow = getPopupWindowRef(platformKey) || connectWindow;
        if (currentWindow && !currentWindow.closed) {
          console.log("Auto-closing popup after timeout");
          currentWindow.close();
        }
        clearInterval(checkClosedInterval);
        setPopupWindowRef(platformKey, null);
        clearPlatformLoading(platformKey);
        setConnectClosed(true);
      }, 5 * 60 * 1000); // 5 minutes
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to connect ${platform}`);
      clearPlatformLoading(platform.toLowerCase());
    }
    // Don't reset loading in finally - keep it loading while popup is open
    // Loading will be reset when popup closes via the useEffect
  };

  const disconnectPlatform = async (platform) => {
    if (!profile) {
      setError("No profile found.");
      return;
    }

    const platformKey = platform.toLowerCase();
    
    // Check if already disconnecting
    if (platformLoading[platformKey]) {
      return;
    }
    
    setPlatformLoadingState(platformKey, true);
    setError(null);
    setSuccess(null);

    try {
      // Disconnect the platform using Ayrshare API
      await disconnectAyrshareSocialAccount(profile.profile_key, platformKey);

      // Mark platform as recently disconnected to prevent immediate reconnection detection
      setRecentlyDisconnected((prev) => ({
        ...prev,
        [platformKey]: Date.now(),
      }));

      setSuccess(`${platform} disconnected successfully!`);

      // Sync connections and reload from parent state
      try {
        await syncAyrshareConnections();
      } catch (err) {
        console.log("Failed to sync connections:", err);
      }
      
      // Refresh parent state to get latest data
      if (fetchAyrshareConnections) {
        await fetchAyrshareConnections();
      } else {
        await loadConnectedAccounts();
      }
      
      // Wait a bit for state to update, then remove from local state and clear loading
      setTimeout(() => {
        // Remove the account from local state after refresh
        setConnectedAccounts((prevAccounts) =>
          prevAccounts.filter(
            (account) => account.platform.toLowerCase() !== platformKey
          )
        );
        
        // Clear loading state after all operations complete
        clearPlatformLoading(platformKey);
      }, 500);
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        `Failed to disconnect ${platform}`;
      setError(errorMessage);

      // If disconnect failed, sync and reload from parent state, then clear loading
      try {
        await syncAyrshareConnections();
      } catch (err) {
        console.log("Failed to sync connections:", err);
      }
      
      // Refresh parent state to get latest data
      if (fetchAyrshareConnections) {
        await fetchAyrshareConnections();
      } else {
        await loadConnectedAccounts();
      }
      
      // Clear loading state after all operations complete
      clearPlatformLoading(platformKey);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleCancelConnection = (platform) => {
    const platformKey = platform.toLowerCase();
    // Close popup window if it exists
    const popupWindow = getPopupWindowRef(platformKey);
    if (popupWindow && !popupWindow.closed) {
      try {
        popupWindow.close();
      } catch (e) {
        console.log("Error closing popup:", e);
      }
    }
    // Clear loading state and popup reference
    clearPlatformLoading(platformKey);
    setConnectClosed(true);
  };

  const isPlatformConnected = (platformId) => {
    return connectedAccounts.some((account) => {
      const isPlatformMatch =
        account.platform.toLowerCase() === platformId.toLowerCase();
      const hasValidData =
        account.is_active &&
        (account.username || account.user_id || account.display_name);
      return isPlatformMatch && hasValidData;
    });
  };

  const getConnectedAccount = (platformId) => {
    const account = connectedAccounts.find(
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

  return (
      <div className="space-y-6">
        {/* Unified Ayrshare Connected Accounts Section */}
        <div className="border-t border-gray-200 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            {availablePlatforms.map((platform) => {
              const isConnected = isPlatformConnected(platform.id);
              const connectedAccount = getConnectedAccount(platform.id);

              // Check if ANY platform is loading
              const isAnyPlatformLoading = Object.values(platformLoading).some(loading => loading === true);
              const isCurrentPlatformLoading = platformLoading[platform.id];
              const shouldDisableButton = isAnyPlatformLoading && !isCurrentPlatformLoading;

              console.log("connectedAccount", connectedAccount);
              console.log("isConnected", isConnected);
              console.log("platform", platform);

              return (
                <div
                  key={platform.id}
                  className="rounded-xl flex flex-col items-center justify-center p-6 space-y-6 bg-[#F2F8FF]"
                >
                  {/* Platform Icon */}
                  {platform.icon}

                  {/* Platform Name */}
                  <p className="cardslink1 mb-0" >{platform.name}</p>

                  {/* Connection Status and Profile Info */}
                  {isConnected && connectedAccount ? (
                    <>
                      {/* Connected Status */}
                      <div className="flex items-center gap-1 mb-0">
                        <div className="w-2 h-2 bg-[#00A63E] rounded-full"></div>
                        <p className="text-sm text-[#00A63E] mb-0">
                          Connected
                          {/* {platform.id === "linkedin" && analyzingWritingStyle && (
                            <span className="ml-2 text-xs text-blue-600">
                              (Analyzing writing style...)
                            </span>
                          )} */}
                        </p>
                      </div>

                      {/* Profile Image and Info */}
                      <div className="flex flex-col items-center space-y-2 dic-socialpost mb-1">
                        <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-gray-200">
                          {connectedAccount.user_image ? (
                            <img
                              src={connectedAccount.user_image}
                              alt={
                                connectedAccount.platform_name ||
                                connectedAccount.platform
                              }
                              className="profile-icons-arys"
                              onError={(e) => {
                                console.log(
                                  "Profile image failed to load:",
                                  connectedAccount.user_image
                                );
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                              onLoad={() => {
                                console.log(
                                  "Profile image loaded successfully:",
                                  connectedAccount.user_image
                                );
                              }}
                            />
                          ) : connectedAccount.platform_image ? (
                            <img
                              src={connectedAccount.platform_image}
                              alt={
                                connectedAccount.platform_name ||
                                connectedAccount.platform
                              }
                              className="profile-icons-arys w-full h-full object-cover"
                              onError={(e) => {
                                console.log(
                                  "Platform image failed to load:",
                                  connectedAccount.platform_image
                                );
                                e.target.style.display = "none";
                                e.target.nextSibling.style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg"
                            style={{
                              display:
                                connectedAccount.user_image ||
                                connectedAccount.platform_image
                                  ? "none"
                                  : "flex",
                            }}
                          >
                            {(
                              connectedAccount.username ||
                              connectedAccount.platform_name ||
                              connectedAccount.platform
                            )
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        </div>

                        <div className=" w-100 d-flex text-center flex-column align-items-center justify-content-center ">
                           <div className="actives-bnn ">
                          <p className="text-xs mb-0 ">
                            Active
                          </p>
                          </div>
                          <p className="text-sm font-semibold text-[#022C33] mb-0 mt-2">
                          {" "}
                            {connectedAccount.display_name ||
                              connectedAccount.username ||
                              "User"}
                          </p>
                         
                          {/* {connectedAccount.user_id && (
                            <p className="text-xs text-gray-500 mt-1">
                              ID: {connectedAccount.user_id}
                            </p>
                          )} */}
                        </div>
                      </div>

                      {/* Disconnect Button */}
                      <button
                        onClick={() =>
                          disconnectPlatform(
                            connectedAccount.platform_name ||
                              connectedAccount.platform
                          )
                        }
                        disabled={
                          platformLoading[
                            (connectedAccount.platform_name ||
                              connectedAccount.platform
                            )?.toLowerCase()
                          ]
                        }
                        className={`font-inter px-4 py-2 rounded-md btn-com ${
                          platformLoading[
                            (connectedAccount.platform_name ||
                              connectedAccount.platform
                            )?.toLowerCase()
                          ]
                            ? 'bg-[#021E22] text-white cursor-not-allowed'
                            : 'bg-[#021E22] text-white cursor-pointer hover:bg-[#021E22]/90'
                        }`}
                        style={{
                          position: 'relative',
                          zIndex: 1
                        }}
                      >
                        {platformLoading[
                          (connectedAccount.platform_name ||
                            connectedAccount.platform
                          )?.toLowerCase()
                        ] ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span className="px-3 btn-com">Disconnecting...</span>
                          </div>
                        ) : (
                          <span className="px-3 btn-com">Disconnect</span>
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Not Connected Status */}
                    
                      <p className="not-connect mb-0 pt-1 pb-1">
                        Not Connected
                      </p>
                        <div className="dic-socialpost mb-1">
                      <p className="text-sm status-actives px-3  mt-1 mb-0 pb-0">
                        Inactive
                      </p></div>

                      {/* Connect Button */}
                      <button
                        onClick={() => {
                          if (platformLoading[platform.id]) {
                            handleCancelConnection(platform.id);
                          } else {
                            connectPlatform(platform.id);
                          }
                        }}
                        disabled={shouldDisableButton && !platformLoading[platform.id]}
                        className={`font-inter px-4 py-2 rounded-md btn-com ${
                          platformLoading[platform.id]
                            ? 'bg-[#84E084] text-[#021E22] cursor-pointer hover:bg-[#6EC76E]'
                            : shouldDisableButton
                            ? 'bg-[#84E084] text-[#021E22] cursor-not-allowed'
                            : 'bg-[#84E084] text-[#021E22] cursor-pointer hover:bg-[#6EC76E]'
                        }`}
                      >
                        {platformLoading[platform.id] ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#021E22]"></div>
                            <span className="px-3 btn-com">Connecting...</span>
                          </div>
                        ) : (
                          <span className="px-3 btn-com">Connect</span>
                        )}
                      </button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
  );
}

export default AyrshareManager;
