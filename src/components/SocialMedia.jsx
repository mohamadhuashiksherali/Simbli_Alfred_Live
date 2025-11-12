import { useState, useEffect } from "react";
import { Linkedin, Twitter, Instagram, Facebook } from "lucide-react";
import Share from "../assets/svgs/share.svg";
import social from "../assets/svgs/social.svg";
import AyrshareManager from "./AyrshareManager";
import WritingStyleSettings from "./WritingStyleSettings";
import { getAyrshareConnectedAccounts } from "../api/api.js";
import {
  fetchSocialConnectionsApi,
  connectLinkedInApi,
  connectTwitterApi,
  disconnectLinkedInApi,
  disconnectTwitterApi,
} from "../api/api";
import WritingStyleNew from "./WritingStyle/WritingStyleNew.jsx";

const SocialMedia = ({ connections, ayrshareConnections, fetchConnectionStatus, fetchAyrshareConnections }) => {
  const [loading, setLoading] = useState({});
  const [popupWindow, setPopupWindow] = useState(null);
  const [isAnalyzingWritingStyle, setIsAnalyzingWritingStyle] = useState(false);

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
        setLoading((prev) => ({ ...prev, [platform]: false }));

        // Refresh connections from parent
        if (fetchConnectionStatus && fetchAyrshareConnections) {
          await fetchConnectionStatus();
          await fetchAyrshareConnections();
        }

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
        setLoading((prev) => ({ ...prev, [platform]: false }));

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

  // Check for OAuth success/error from URL params
  useEffect(() => {
    const handleOAuthReturn = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const linkedinConnected = urlParams.get("linkedin_connected");
      const linkedinError = urlParams.get("linkedin_error");
      const xConnected = urlParams.get("x_connected") === "true";
      const xError = urlParams.get("x_error") === "true";
      const errorMessage = urlParams.get("error_message");

      if (linkedinConnected === "true" || xConnected) {
        // Connection successful, fetch updated status
        if (fetchConnectionStatus && fetchAyrshareConnections) {
          await fetchConnectionStatus();
          await fetchAyrshareConnections();
        }
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

  const handleConnect = async (platform) => {
    const token = localStorage.getItem("access-token");
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      setLoading((prev) => ({ ...prev, [platform]: true }));

      if (platform === "linkedin") {
        const response = await connectLinkedInApi();

        // Open LinkedIn OAuth in popup window
        const popup = window.open(
          response.data.auth_url,
          "linkedin-auth",
          "width=600,height=700,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no"
        );

        if (popup) {
          setPopupWindow(popup);

          // Check if popup is closed manually
          const checkClosed = setInterval(() => {
            if (popup.closed) {
              clearInterval(checkClosed);
              setPopupWindow(null);
              setLoading((prev) => ({ ...prev, [platform]: false }));
            }
          }, 1000);
        } else {
          // Popup blocked, fallback to redirect
          console.warn("Popup blocked, falling back to redirect");
          window.location.href = response.data.auth_url;
        }
      } else if (platform === "twitter") {
        const response = await connectTwitterApi();

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
              setLoading((prev) => ({ ...prev, [platform]: false }));
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
        `${platform} connection failed:`,
        error?.response?.status,
        error?.response?.data || error?.message
      );
      setLoading((prev) => ({ ...prev, [platform]: false }));
    }
  };

  const handleDisconnect = async (platform) => {
    if (platform === "linkedin") {
      try {
        await disconnectLinkedInApi();
        if (fetchConnectionStatus && fetchAyrshareConnections) {
          await fetchConnectionStatus(); // Refresh connections
          await fetchAyrshareConnections(); // Refresh Ayrshare connections
        }
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

        if (connection && connection.id) {
          await disconnectTwitterApi(connection.id);
          if (fetchConnectionStatus && fetchAyrshareConnections) {
            await fetchConnectionStatus(); // Refresh connections
            await fetchAyrshareConnections(); // Refresh Ayrshare connections
          }
        }
      } catch (error) {
        console.error(
          "X disconnection failed:",
          error?.response?.status,
          error?.response?.data || error?.message
        );
      }
    }
  };

  const getConnectionStatus = (platform) => {
    const connection = connections.find((conn) => conn.platform === platform);
    return connection || { platform, is_connected: false, profile_info: {} };
  };

  const getDisplayName = (platform) => {
    const profile = getConnectionStatus(platform).profile_info;
    if (!profile) return null;

    if (platform === "linkedin") {
      return profile.localizedFirstName && profile.localizedLastName
        ? `${profile.localizedFirstName} ${profile.localizedLastName}`
        : profile.name || "LinkedIn User";
    } else if (platform === "twitter") {
      return profile.name || profile.username || "Twitter User";
    }
    return null;
  };

  const getProfileImage = (platform) => {
    const profile = getConnectionStatus(platform).profile_info;
    if (!profile) return null;

    // Check multiple possible field names for profile image
    const imageUrl =
      profile.profile_image_url ||
      profile.profilePictureUrl ||
      profile.picture ||
      profile.profilePicture ||
      null;

    return imageUrl;
  };

  const cards = [
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
      status: getConnectionStatus("linkedin").is_connected
        ? "Active"
        : "Inactive",
      isConnected: getConnectionStatus("linkedin").is_connected,
      profileInfo: getConnectionStatus("linkedin").profile_info,
      button: getConnectionStatus("linkedin").is_connected ? (
        <button
          onClick={() => handleDisconnect("linkedin")}
          className="bg-red-500 text-white font-inter px-4 py-2 rounded-md btn-com"
        >
          <span className="px-3 btn-com">Disconnect</span>
        </button>
      ) : (
        <button
          onClick={() => handleConnect("linkedin")}
          className="bg-[#84E084] text-[#021E22] font-inter px-4 py-2 rounded-md btn-com"
          disabled={loading["linkedin"]}
        >
          <span className="px-3 btn-com">
            {loading["linkedin"] ? "Connecting..." : "Connect"}
          </span>
        </button>
      ),
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
      status: getConnectionStatus("twitter").is_connected
        ? "Active"
        : "Inactive",
      isConnected: getConnectionStatus("twitter").is_connected,
      profileInfo: getConnectionStatus("twitter").profile_info,
      button: getConnectionStatus("twitter").is_connected ? (
        <button
          onClick={() => handleDisconnect("twitter")}
          className="bg-red-500 text-white font-inter px-4 py-2 rounded-md btn-com"
        >
          <span className="px-3 btn-com">Disconnect</span>
        </button>
      ) : (
        <button
          onClick={() => handleConnect("twitter")}
          className="bg-[#84E084] text-[#021E22] font-inter px-4 py-2 rounded-md btn-com"
          disabled={loading["twitter"]}
        >
          <span className="px-3 btn-com">
            {loading["twitter"] ? "Connecting..." : "Connect"}
          </span>
        </button>
      ),
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
              <stop stop-color="#F327BC" />
              <stop offset="1" stop-color="#FFE32D" />
            </linearGradient>
          </defs>
        </svg>
      ),
      status: "Inactive",
      button: (
        <button
          className="bg-[#021E22] text-[#8CFF00] font-inter px-4 py-2 rounded-md btn-com"
          disabled
        >
          Coming Soon
        </button>
      ),
      comingSoon: true,
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
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M39 25.6875H32.625V21.4375C32.625 20.8739 32.8489 20.3334 33.2474 19.9349C33.6459 19.5364 34.1864 19.3125 34.75 19.3125H36.875V14H32.625C30.9342 14 29.3127 14.6716 28.1172 15.8672C26.9216 17.0627 26.25 18.6842 26.25 20.375V25.6875H22V31H26.25V48H32.625V31H36.875L39 25.6875Z"
            fill="white"
          />
        </svg>
      ),
      status: "Inactive",
      button: (
        <button
          className="bg-[#021E22] text-[#8CFF00] font-inter px-4 py-2 rounded-md btn-com"
          disabled
        >
          Coming Soon
        </button>
      ),
      comingSoon: true,
    },
  ];
  return (
    <div className="p-6 m-4 bg-white rounded-lg shadow-md">
      <div className="flex gap-3 ">
        <div className="w-12 h-12 bg-[#EFFBEF] rounded-full flex justify-center items-center p-0">
          <img
            src={Share}
            loading="lazy"
            className=" w-5"
            style={{ objectFit: "contain" }}
          />
        </div>
        <div>
          <h5
            className="text-lg  mb-0"
            style={{ fontWeight: "700", color: "#022C33" }}
          >
            Social Media Connections
          </h5>
          <p className="text-[#515151] mb-6 pt-1">
          Connect Your Social Media Accounts to Enable AI Drafting, Scheduling, and Direct Publishing.
          </p>
        </div>
      </div>

      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className={` rounded-xl flex flex-col items-center justify-center p-6 space-y-6 ${
              card.comingSoon ? "bg-[#FEF4F9]" : "bg-[#F2F8FF]"
            }`}
          >
            {card.icon}
            <p className="cardslink mb-0">{card.name}</p>

            {/* Show connection status and profile info */}
            {/* {card.isConnected ? (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <p className="text-sm text-green-600 mb-0">Connected</p>
                </div>

                {/* Profile Image and Info */}
                {/* <div className="flex flex-col items-center space-y-2">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
                    {getProfileImage(card.id) ? (
                      <img
                        src={getProfileImage(card.id)}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg"
                      style={{
                        display: getProfileImage(card.id) ? "none" : "flex",
                      }}
                    >
                      {getDisplayName(card.id)
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase() || "U"}
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-800 mb-0">
                      Connected as: {getDisplayName(card.id) || "User"}
                    </p>
                    <p className="text-xs text-green-600 mb-0">
                      Status: Active
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <p className="not-connect mb-0 pt-1 pb-1">Not Connected</p>
                <p className={`text-sm  status-actives px-3 py-1 mt-1`}>
                  {card.status}
                </p>
              </>
            )}

            <span className="mt-2">{card.button}</span>
          </div>
        ))} 
       </div>  */}


   
      {/* Ayrshare Integration Section */}
      <AyrshareManager 
        isAnalyzingWritingStyle={isAnalyzingWritingStyle} 
        setIsAnalyzingWritingStyle={setIsAnalyzingWritingStyle}
        ayrshareConnections={ayrshareConnections}
        fetchAyrshareConnections={fetchAyrshareConnections}
      />

      
        <WritingStyleNew isAnalyzingWritingStyle={isAnalyzingWritingStyle}/>
      {/* Writing Style Settings */}
      {/* <WritingStyleSettings  isAnalyzingWritingStyle={isAnalyzingWritingStyle}/> */}
      
      {/* <div className="bg-green-50 border border-green-200 rounded-md p-4 mt-6  ">
        <div className="text-green-800 flex gap-2 font-semibold justify-start items-start">
          <img src={social} loading="lazy" className="w-10" />
          <div>
            <p className="font-semibold font-inter text-[#1F1F1F] text-lg mb-0 connect">
              {" "}
              Why Connect Your Accounts?
            </p>
            <p className="text-[#1F1F1F] font-inter font-normal text-sm mt-1">
              Connected accounts enable direct publishing from Simbli. Instead
              of copying and pasting, you can publish your AI generated content
              with a single click, including images and hashtags.
            </p>
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default SocialMedia;
