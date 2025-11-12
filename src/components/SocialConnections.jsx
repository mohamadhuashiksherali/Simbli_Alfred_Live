import React, { useState, useEffect } from "react";
import { Link2, CheckCircle, AlertCircle, X, RefreshCw } from "lucide-react";
import axios from "axios";
import AyrshareManager from "./AyrshareManager";
import { getAyrshareConnectedAccounts } from "../api/api.js";

const SocialConnections = ({ isOpen, onClose }) => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popupWindow, setPopupWindow] = useState(null);
  const [ayrshareConnections, setAyrshareConnections] = useState([]);

  const platformConfig = {
    linkedin: {
      name: "LinkedIn",
      icon: "💼",
      color: "bg-blue-600",
      description: "Share professional content and build your network",
    },
    twitter: {
      name: "X",
      icon: "𝕏",
      color: "bg-black",
      description: "Share quick updates and engage with your audience",
    },
    instagram: {
      name: "Instagram",
      icon: "📸",
      color: "bg-pink-600",
      description: "Share visual content and stories",
    },
    facebook: {
      name: "Facebook",
      icon: "👥",
      color: "bg-blue-700",
      description: "Connect with friends and share updates",
    },
    ayrshare: {
      name: "Ayrshare (Multi-Platform)",
      icon: "🚀",
      color: "bg-purple-600",
      description: "Post to multiple platforms simultaneously with advanced scheduling",
    },
  };

  useEffect(() => {
    if (isOpen) {
      fetchConnections();
      fetchAyrshareConnections();
    }
  }, [isOpen]);

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

        // Refresh connections
        await fetchConnections();

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

  useEffect(() => {
    // Check for LinkedIn and X connection success/error from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const linkedinConnected = urlParams.get("linkedin_connected");
    const linkedinError = urlParams.get("linkedin_error");
    const xConnected = urlParams.get("x_connected") === "true";
    const xError = urlParams.get("x_error") === "true";
    const facebookConnected = urlParams.get("facebook_connected");
    const facebookError = urlParams.get("facebook_error");
    const errorMessage = urlParams.get("error_message");

    // Logging to verify OAuth state in modal
    console.log("[OAuth][Modal] URL Params", {
      linkedinConnected,
      linkedinError,
      xConnected,
      xError,
      facebookConnected,
      facebookError,
      errorMessage,
    });

    if (
      linkedinConnected === "true" ||
      xConnected ||
      facebookConnected === "true"
    ) {
      fetchConnections(); // Refresh connections
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh the page after successful connection
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }

    if (linkedinError === "true" || xError || facebookError === "true") {
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/auth/social-connections");
      console.log("[Modal] /auth/social-connections payload:", response.data);
      console.log(
        "[Modal] Raw connections data:",
        JSON.stringify(response.data, null, 2)
      );
      const normalizePlatform = (p) => {
        if (!p) return "";
        if (typeof p === "string") return p.toLowerCase();
        if (typeof p === "object" && p.value)
          return String(p.value).toLowerCase();
        return String(p).toLowerCase();
      };
      const normalized = Array.isArray(response.data)
        ? response.data.map((c) => ({
            platform: normalizePlatform(c.platform),
            is_connected: Boolean(c.is_connected ?? c.connected),
            profile_info: c.profile_info || {},
            connected_at: c.connected_at || null,
            id: c.id ?? c._id ?? null,
          }))
        : [];
      setConnections(normalized);
    } catch (error) {
      console.error("Failed to fetch social connections:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAyrshareConnections = async () => {
    try {
      const response = await getAyrshareConnectedAccounts();
      if (response.data && response.data.accounts) {
        setAyrshareConnections(response.data.accounts);
        console.log("Ayrshare connected accounts:", response.data.accounts);
      }
    } catch (error) {
      console.error("Failed to fetch Ayrshare connections:", error);
      // Don't show error to user, just log it
    }
  };

  const handleConnect = async (platform) => {
    const token = localStorage.getItem("access-token");
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    console.log(
      "[Modal][Connect] Platform:",
      platform,
      "Auth header set:",
      !!token
    );

    if (platform === "linkedin") {
      try {
        const response = await axios.get("/auth/linkedin/connect", {
          headers: authHeaders,
        });
        // Redirect to LinkedIn OAuth
        window.location.href = response.data.auth_url;
      } catch (error) {
        console.error(
          "LinkedIn connection failed:",
          error?.response?.status,
          error?.response?.data || error?.message
        );
      }
    } else if (platform === "twitter") {
      try {
        const response = await axios.get("/auth/x/connect", {
          headers: authHeaders,
        });
        // Redirect to X OAuth
        window.location.href = response.data.auth_url;
      } catch (error) {
        console.error(
          "X connection failed:",
          error?.response?.status,
          error?.response?.data || error?.message
        );
      }
    } else if (platform === "facebook") {
      try {
        const response = await axios.get("/auth/facebook/connect", {
          headers: authHeaders,
        });
        // Redirect to Facebook OAuth
        window.location.href = response.data.auth_url;
      } catch (error) {
        console.error(
          "Facebook connection failed:",
          error?.response?.status,
          error?.response?.data || error?.message
        );
      }
    }

  };

  const handleDisconnect = async (platform) => {
    const token = localStorage.getItem("access-token");
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  const handleDisconnect = async (platform) => {
    const token = localStorage.getItem("access-token");
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    if (platform === "linkedin") {
      try {
        await axios.delete("/auth/linkedin/disconnect", {
          headers: authHeaders,
        });
        fetchConnections(); // Refresh connections
      } catch (error) {
        console.error(
          "LinkedIn disconnection failed:",
          error?.response?.status,
          error?.response?.data || error?.message
        );
      }
    } else if (platform === "twitter") {
      try {
        // Get the connection ID first
        const connection = connections.find(
          (conn) => conn.platform === "twitter"
        );
        console.log("X disconnect - Found connection:", connection);
    if (platform === "linkedin") {
      try {
        await axios.delete("/auth/linkedin/disconnect", {
          headers: authHeaders,
        });
        fetchConnections(); // Refresh connections
      } catch (error) {
        console.error(
          "LinkedIn disconnection failed:",
          error?.response?.status,
          error?.response?.data || error?.message
        );
      }
    } else if (platform === "twitter") {
      try {
        // Get the connection ID first
        const connection = connections.find(
          (conn) => conn.platform === "twitter"
        );
        console.log("X disconnect - Found connection:", connection);

        if (connection && connection.id) {
          console.log(
            "X disconnect - Attempting to disconnect with ID:",
            connection.id
          );
          await axios.delete(`/auth/x/connections/${connection.id}`, {
            headers: authHeaders,
          });
          console.log("X disconnect - Success, refreshing connections");
          fetchConnections(); // Refresh connections
        } else {
          console.error(
            "X disconnect - No connection found or no ID:",
            connection
          );
        }
      } catch (error) {
        console.error(
          "X disconnection failed:",
          error?.response?.status,
          error?.response?.data || error?.message
        );
        console.error("Full error:", error);
      }
    } else if (platform === "facebook") {
      try {
        // Get the connection ID first
        const connection = connections.find(
          (conn) => conn.platform === "facebook"
        );
        if (connection && connection.id) {
          await axios.delete(`/auth/facebook/connections/${connection.id}`, {
            headers: authHeaders,
          });
          fetchConnections(); // Refresh connections
        }
      } catch (error) {
        console.error(
          "Facebook disconnection failed:",
          error?.response?.status,
          error?.response?.data || error?.message
        );
      }
    }
  };
        if (connection && connection.id) {
          console.log(
            "X disconnect - Attempting to disconnect with ID:",
            connection.id
          );
          await axios.delete(`/auth/x/connections/${connection.id}`, {
            headers: authHeaders,
          });
          console.log("X disconnect - Success, refreshing connections");
          fetchConnections(); // Refresh connections
        } else {
          console.error(
            "X disconnect - No connection found or no ID:",
            connection
          );
        }
      } catch (error) {
        console.error(
          "X disconnection failed:",
          error?.response?.status,
          error?.response?.data || error?.message
        );
        console.error("Full error:", error);
      }
    } else if (platform === "facebook") {
      try {
        // Get the connection ID first
        const connection = connections.find(
          (conn) => conn.platform === "facebook"
        );
        if (connection && connection.id) {
          await axios.delete(`/auth/facebook/connections/${connection.id}`, {
            headers: authHeaders,
          });
          fetchConnections(); // Refresh connections
        }
      } catch (error) {
        console.error(
          "Facebook disconnection failed:",
          error?.response?.status,
          error?.response?.data || error?.message
        );
      }
    }
  };

  const getConnectionStatus = (platform) => {
    const connection = connections.find((conn) => conn.platform === platform);
    return connection || { platform, is_connected: false };
  };

  const getAyrshareConnectionStatus = (platform) => {
    const connection = ayrshareConnections.find((conn) => conn.platform.toLowerCase() === platform.toLowerCase());
    return connection || { platform, is_active: false };
  };

  if (!isOpen) return null;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-start justify-start p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 text-gray-900 self-start">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-300">
              <Link2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
               Social Media Connections
              </h2>
              <p className="text-sm text-gray-500">
               Connect Your Social Media Accounts to Enable AI Drafting, Scheduling, and Direct Publishing.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors border border-gray-300 text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
              <span className="ml-2 text-gray-500">Loading connections...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(platformConfig).map(([platform, config]) => {
                const connectionStatus = getConnectionStatus(platform);
                const isConnected = connectionStatus.is_connected;
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-start justify-start p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 text-gray-900 self-start">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-300">
              <Link2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Social Media Connections
              </h2>
              <p className="text-sm text-gray-500">
              Connect Your Social Media Accounts to Enable AI Drafting, Scheduling, and Direct Publishing.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors border border-gray-300 text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
              <span className="ml-2 text-gray-500">Loading connections...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(platformConfig).map(([platform, config]) => {
                const connectionStatus = getConnectionStatus(platform);
                const isConnected = connectionStatus.is_connected;

                return (
                  <div
                    key={platform}
                    className="border border-gray-200 rounded-xl p-4 hover:border-green-400/50 transition-colors bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-12 h-12 ${config.color} rounded-lg flex items-center justify-center text-white text-xl`}
                        >
                          {config.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                            <span>{config.name}</span>
                            {isConnected && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {config.description}
                          </p>

                          {/* Profile Info */}
                          {isConnected && connectionStatus.profile_info && (
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex-shrink-0">
                                {connectionStatus.profile_info
                                  ?.profile_image_url ? (
                                  <>
                                    <img
                                      src={
                                        connectionStatus.profile_info
                                          .profile_image_url
                                      }
                                      alt="Profile"
                                      className="w-12 h-12 rounded-full object-cover border border-gray-200"
                                      onError={(e) => {
                                        e.target.style.display = "none";
                                        e.target.nextSibling.style.display =
                                          "flex";
                                      }}
                                    />
                                    <div
                                      className="w-12 h-12 rounded-full flex items-center justify-center border border-gray-200 hidden"
                                      style={{ background: "#D1FAE5" }}
                                    >
                                      <span className="text-green-700 font-semibold text-xs">
                                        {(() => {
                                          const name =
                                            connectionStatus.profile_info
                                              ?.localizedFirstName &&
                                              connectionStatus.profile_info
                                                ?.localizedLastName
                                              ? `${connectionStatus.profile_info.localizedFirstName} ${connectionStatus.profile_info.localizedLastName}`
                                              : connectionStatus.profile_info
                                                ?.name
                                                ? connectionStatus.profile_info
                                                  .name
                                                : connectionStatus.profile_info
                                                  ?.given_name &&
                                                  connectionStatus.profile_info
                                                    ?.family_name
                                                  ? `${connectionStatus.profile_info.given_name} ${connectionStatus.profile_info.family_name}`
                                                  : "You";
                                          return name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")
                                            .substring(0, 2)
                                            .toUpperCase();
                                        })()}
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center border border-gray-200"
                                    style={{ background: "#D1FAE5" }}
                                  >
                                    <span className="text-green-700 font-semibold text-xs">
                                      {(() => {
                                        const name =
                                          connectionStatus.profile_info
                                            ?.localizedFirstName &&
                                            connectionStatus.profile_info
                                              ?.localizedLastName
                                            ? `${connectionStatus.profile_info.localizedFirstName} ${connectionStatus.profile_info.localizedLastName}`
                                            : connectionStatus.profile_info
                                              ?.name
                                              ? connectionStatus.profile_info.name
                                              : connectionStatus.profile_info
                                                ?.given_name &&
                                                connectionStatus.profile_info
                                                  ?.family_name
                                                ? `${connectionStatus.profile_info.given_name} ${connectionStatus.profile_info.family_name}`
                                                : "You";
                                        return name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")
                                          .substring(0, 2)
                                          .toUpperCase();
                                      })()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-green-700">
                                Connected as:{" "}
                                {connectionStatus.profile_info
                                  ?.localizedFirstName &&
                                  connectionStatus.profile_info?.localizedLastName
                                  ? `${connectionStatus.profile_info.localizedFirstName} ${connectionStatus.profile_info.localizedLastName}`
                                  : connectionStatus.profile_info?.name
                                    ? connectionStatus.profile_info.name
                                    : connectionStatus.profile_info?.username
                                      ? `@${connectionStatus.profile_info.username}`
                                      : "Your Account"}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isConnected ? (
                          <>
                            <span className="text-xs px-2 py-1 rounded-full border border-green-200 bg-green-50 text-green-700">
                              Connected
                            </span>
                            {(platform === "linkedin" ||
                              platform === "twitter") && (
                                <button
                                  onClick={() => handleDisconnect(platform)}
                                  className="text-xs px-3 py-1 rounded-full transition-colors border-2 bg-red-50 hover:bg-red-100 text-red-600 border-red-200 hover:border-red-300"
                                >
                                  Disconnect
                                </button>
                              )}
                          </>
                        ) : platform === "instagram" ||
                          platform === "facebook" ? (
                          <button
                            disabled
                            className="flex items-center justify-center w-32 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                          >
                            Coming Soon
                          </button>
                        ) : platform === "ayrshare" ? (
                          <div className="flex flex-col items-end space-y-2">
                            <div className="flex items-center space-x-2">
                              {ayrshareConnections.length > 0 ? (
                                <>
                                  <span className="text-xs px-2 py-1 rounded-full border border-green-200 bg-green-50 text-green-700">
                                    {ayrshareConnections.length} Connected
                                  </span>
                                  <button
                                    onClick={() => {
                                      fetchAyrshareConnections();
                                    }}
                                    className="text-xs px-2 py-1 rounded-full transition-colors border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-600"
                                  >
                                    Refresh
                                  </button>
                                </>
                              ) : (
                                <span className="text-xs px-2 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-600">
                                  No Connections
                                </span>
                              )}
                            </div>
                            <button
                              disabled
                              className="flex items-center justify-center w-32 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                            >
                              Use Manager Below
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleConnect(platform)}
                            className="flex items-center space-x-2 text-white px-4 py-2 rounded-lg transition-all text-sm font-medium border border-green-600 hover:shadow-lg transform hover:scale-[1.02]"
                            style={{
                              background:
                                "linear-gradient(180deg, #34D399 0%, #059669 100%)",
                            }}
                          >
                            <Link2 className="w-4 h-4" />
                            <span>Connect</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Connection Benefits */}
                    {(platform === "linkedin" || platform === "twitter") &&
                      !isConnected && (
                        <div className="mt-3 p-3 rounded-lg border bg-white border-gray-200">
                          <div className="flex items-start space-x-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 text-gray-500" />
                            <div className="text-sm text-gray-600">
                              <p className="font-medium">
                                Why connect{" "}
                                {platform === "linkedin"
                                  ? "LinkedIn"
                                  : "X"}
                                ?
                              </p>
                              <ul className="mt-1 space-y-1 text-xs">
                                <li>• Publish content directly from Simbli</li>
                                <li>
                                  • No need to copy-paste content manually
                                </li>
                                <li>• Maintain consistent posting schedule</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          )}
                    {/* Connection Benefits */}
                    {(platform === "linkedin" || platform === "twitter") &&
                      !isConnected && (
                        <div className="mt-3 p-3 rounded-lg border bg-white border-gray-200">
                          <div className="flex items-start space-x-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 text-gray-500" />
                            <div className="text-sm text-gray-600">
                              <p className="font-medium">
                                Why connect{" "}
                                {platform === "linkedin"
                                  ? "LinkedIn"
                                  : "X"}
                                ?
                              </p>
                              <ul className="mt-1 space-y-1 text-xs">
                                <li>• Publish content directly from Simbli</li>
                                <li>
                                  • No need to copy-paste content manually
                                </li>
                                <li>• Maintain consistent posting schedule</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          )}


          {/* Ayrshare Integration Section */}
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Social Media Management</h3>
            <AyrshareManager />
          </div>
          {/* Footer */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              🔒 Your account credentials are securely stored and only used for
              publishing content on your behalf.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialConnections;
export default SocialConnections;
