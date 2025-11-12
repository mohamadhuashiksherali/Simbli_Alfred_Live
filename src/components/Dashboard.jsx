import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useChatHistory } from "../contexts/ChatHistoryContext";
import Loading from ".././assets/simbli_loader.gif"
import {
  LogOut,
  MessageSquare,
  Hash,
  Share2,
  Menu,
  X,
  Zap,
  Palette,
  BarChart3,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Calendar,
  User,
  Receipt,
} from "lucide-react";
import ChatInterface from "./ChatInterface";
import ContentHistory from "./ContentHistory";
import MyPosts from "./MyPosts";
import axios from "axios";
import Swal from "sweetalert2";
import {
  logoutApi,
  getProfileDataApi,
  fetchSocialConnectionsApi,
  connectLinkedInApi,
  connectTwitterApi,
  connectFacebookApi,
  disconnectLinkedInApi,
  disconnectTwitterApi,
  disconnectFacebookApi,
  COMMON_BASE_URL,
  BASE_URL,
  updateProfile,
  SIMBLI_URL,
} from "../api/api";
import "../App.css";
import "../styles/GuidePopup.css";
import logosim from "../assets/simbli-logo.png";
import side1 from "../assets/side-1.png";
import side2 from "../assets/side-2.png";
import side3 from "../assets/side-3.png";
import side4 from "../assets/side-4.png";
import side5 from "../assets/side-5.png";
import side6 from "../assets/side-6.png";
import sidetop from "../assets/side-top.png";
import sidetop1 from "../assets/billing.png";
import sidetop2 from "../assets/subscription.png";
import QuickGuide from "../assets/Vector.png"
import BillingSvg from "../assets/BillingSvg.svg";
import CreaditSvg from "../assets/CreaditSvg.svg";
import InvoiceSvg from "../assets/Invoice.svg";
import ContentHistoryNew from "./ContentHistoryNew";
import ContentHistory7Days from "./ContentHistory7Days";
import SocialMedia from "./SocialMedia";
import Invoice from "./Invoice";
import MyPostsNew from "./MyPostsNew";
import MyPostsDashboard from "./MyPostsDashboard";
import ContentHistory7 from "./ContentHistory7";
import MyPostsDashboardNew from "./MyPostsDashboardNew";
import SubscriptionPlans from "./SubscriptionPlans";
import BillingScreen from "./BillingScreen";
import Billing from "./Billing";
import Credit from "./Credit";
import BillingHistory from "./BillingHistory";
import PaymentMethod from "./PaymentMethods/PaymentMethod";
import InvoiceNew from "./Invoice/InvoiceNew";
import BillingHistoryNew from "./History/BillingHistoryNew";
import AlfredLanding from "../AlfredLandingComponent/pages/AlfredLanding";
import Billing2 from "./Billing2";
import BillingNewCode from "./BillingNewCode";
import Profilepop from "./Profilepop";
import MyPostsDashboardnext from "./MypostDashboardnext";
import { getAyrshareConnectedAccounts } from "../api/api";
// import ChatInterfaceNew from "./ChatInterfaceNew";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { clearChatHistory } = useChatHistory();
  const [connections, setConnections] = useState([]);
  const [ayrshareConnections, setAyrshareConnections] = useState([]);
  const [socialDataInitialized, setSocialDataInitialized] = useState(false);
  // Initialize activeTab based on URL parameters to prevent redirect to chat on refresh
  const getInitialTab = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get("tab");
    if (
      tab &&
      [
        "chat",
        "posts",
        "social",
        "billing",
        "credit",
        "invoice",
        "history",
      ].includes(tab)
    ) {
      return tab;
    }
    return "chat"; // default fallback
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const openPopup = () => {
    setIsPopupOpen(true);
  };
  const [isGuideOpen, setIsGuideOpen] = useState(true);
  const [dontShowGuideAgain, setDontShowGuideAgain] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [socialConnections, setSocialConnections] = useState([]);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [SubscriptionPlansDropdownOpen, setSubscriptionPlansDropdownOpen] =
    useState(false);
  const profileMenuRef = useRef(null);
  const SubscriptionPlansDropdownRef = useRef(null);
  const mainContentRef = useRef(null);
  const logo = "/Simbliai.jpg";
  const IMAGE_BASE_URL = `${COMMON_BASE_URL}/image`;
  const [profileData, setProfileData] = useState(null);
  const [hasSubscription, setHasSubscription] = useState(null); // null = loading, true/false = loaded
  const [subscriptionData, setSubscriptionData] = useState(null);
  const hasMarkedGuideSeenRef = useRef(false);
  const agents = [
    {
      name: "Alfred",
      role: "Social Media Agent",
      img: "/Alfred.png",
      url: "https://alfred.simbli.ai/dashboard",
    },
    {
      name: "Sam",
      role: "Sales Agent",
      img: "/Sam.jpeg",
      url: "https://sam.simbli.ai/onboard",
    },
    {
      name: "Richard",
      role: "RolePlay Coach Agent",
      img: "/Richard.png",
      url: "https://richard.simbli.ai/dashboard",
    },
  ];

  const [currentAgent, setCurrentAgent] = useState(agents[0]);
  const location = useLocation();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle URL parameters for tab navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get("tab");
    if (
      tab &&
      [
        "chat",
        "posts",
        "social",
        "billing",
        "credit",
        "invoice",
        "history",
      ].includes(tab)
    ) {
      setActiveTab(tab);
    }
  }, [location.search]);

  // Sync URL when activeTab changes (but not on initial load)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const currentTab = urlParams.get("tab");

    // Only update URL if the tab is different from what's in the URL
    if (currentTab !== activeTab) {
      const newUrl = new URL(window.location);
      if (activeTab === "chat") {
        // Remove tab parameter for default chat tab
        newUrl.searchParams.delete("tab");
      } else {
        newUrl.searchParams.set("tab", activeTab);
      }
      window.history.replaceState({}, document.title, newUrl.toString());
    }
  }, [activeTab]);

  // Scroll to top when tab changes
  useEffect(() => {
    // Scroll the main content area to top when activeTab changes
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo(0, 0);
    }

    // Also scroll window to top as backup
    window.scrollTo(0, 0);
  }, [activeTab]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!profileMenuRef.current) return;
      if (!profileMenuRef.current.contains(e.target)) setProfileMenuOpen(false);
    };
    if (profileMenuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileMenuOpen]);

  // Close SubscriptionPlans dropdown on outside click - DISABLED
  // useEffect(() => {
  //   const handler = (e) => {
  //     if (!SubscriptionPlansDropdownRef.current) return;
  //     if (!SubscriptionPlansDropdownRef.current.contains(e.target))
  //       setSubscriptionPlansDropdownOpen(false);
  //   };
  //   if (SubscriptionPlansDropdownOpen)
  //     document.addEventListener("mousedown", handler);
  //   return () => document.removeEventListener("mousedown", handler);
  // }, [SubscriptionPlansDropdownOpen]);

  const handleLogout = () => {
    Swal.fire({
      title: "Confirm Log Out",
      text: "Are you sure you want to log out?",
      showConfirmButton: true,
      showCancelButton: true,
      cancelButtonText: "Cancel",
      confirmButtonText: "Yes, Log Out",
      reverseButtons: true,
      imageUrl: logosim,
      background: "#FFFFFF",
      color: "#374151",
      buttonsStyling: false,
      width: 460,
      customClass: {
        popup: "swal2-popup-custom",
        confirmButton: "swal2-confirm-custom",
        cancelButton: "swal2-cancel-custom",
        image: "logo",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        logoutApi()
          .then((res) => {
            if (res?.status === 200) {
              // Clear auth context and axios defaults
              try {
                logout();
              } catch (e) {}
              localStorage.removeItem("access-token");
              localStorage.removeItem("mail");
              localStorage.removeItem("ayrshare_profile");
              localStorage.removeItem("simbli_chat_messages");
              localStorage.removeItem("simbli_publish_success_map");
              console.log("Cleared Ayrshare localStorage on component mount");
              Swal.fire({
                text: "Logged out successfully.",
                icon: "success",
                background: "#FFFFFF",
                color: "#374151",
                customClass: {
                  popup: "swal2-popup-custom",
                  confirmButton: "swal2-confirm-custom",
                },
                showConfirmButton: false,
                timer: 4000,
                timerProgressBar: true,
                willClose: () => {
                  window.location.href = `${SIMBLI_URL}`;
                },
              });
            } else {
              Swal.fire({
                text: "Logout failed. Please try again.",
                timer: 4000,
                timerProgressBar: true,
                icon: "error",
                background: "#FFFFFF",
                color: "#374151",
                showConfirmButton: true,
              });
            }
          })
          .catch(() => {
            Swal.fire({
              text: "Logout failed. Please try again.",
              timer: 4000,
              timerProgressBar: true,
              icon: "error",
              background: "#FFFFFF",
              color: "#374151",
              showConfirmButton: true,
            });
          });
      }
    });
  };

  // Fetch profile data
  const getProfileData = async () => {
    try {
      const res = await getProfileDataApi();
      if (res?.status === 200 && res?.data) {
        console.log("res",res)
        const data = res.data.data || res.data;
        setProfileData(data);
        if(data?.hasSeenPopup === 0){
          console.log("open guide")
          setIsGuideOpen(false);
          console.log("hasMarkedGuideSeenRef1",hasMarkedGuideSeenRef.current)
          if (!hasMarkedGuideSeenRef.current) {
            try {
              await updateProfile({ hasSeenPopup: true });
              hasMarkedGuideSeenRef.current = true;
            } catch (e) {
              console.error("Failed to mark guide as seen:", e);
            }
          }
          console.log("hasMarkedGuideSeenRef2",hasMarkedGuideSeenRef.current)
        } else {
          setIsGuideOpen(true);
        }
      } else {
        setProfileData(null);
      }
    } catch (err) {
      console.error("Error fetching profile data:", err);
      setProfileData(null);
    }
  };

  // Callback function to refresh profile data (to be called from Profilepop)
  const refreshProfileData = () => {
    getProfileData();
  };

  // Check user subscription status
  const checkSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem("access-token");
      if (!token) {
        setHasSubscription(false);
        return;
      }

      const response = await fetch(
        `${BASE_URL}/subscription/check-subscription`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.status === "success") {
        setHasSubscription(data.has_subscription);
        setSubscriptionData(data.subscription);
      } else {
        setHasSubscription(false);
      }
    } catch (err) {
      console.error("Error checking subscription status:", err);
      setHasSubscription(false);
    }
  };

  // Fetch social connections functions
  const fetchConnectionStatus = async () => {
    try {
      const response = await fetchSocialConnectionsApi();
      const connectionsData = response.data || [];
      const normalized = Array.isArray(connectionsData)
        ? connectionsData.map((c) => ({
            platform: c.platform?.toLowerCase(),
            is_connected: Boolean(c.is_connected ?? c.connected),
            profile_info: c.profile_info || {},
            connected_at: c.connected_at || null,
            id: c.id ?? c._id ?? null,
          }))
        : [];
      setConnections(normalized);
      setSocialDataInitialized(true);
    } catch (error) {
      console.error("Failed to fetch connection status:", error);
      setSocialDataInitialized(true);
    }
  };

  const fetchAyrshareConnections = async () => {
    try {
      const response = await getAyrshareConnectedAccounts();
      if (response.data && response.data.accounts) {
        setAyrshareConnections(response.data.accounts);
      }
    } catch (error) {
      console.error("Failed to fetch Ayrshare connections:", error);
    }
  };

  // Fetch social connections on component mount and handle tab query
  useEffect(() => {
    // Only fetch if not already initialized
    if (!socialDataInitialized) {
      fetchConnectionStatus();
      fetchAyrshareConnections();
    }
    fetchSocialConnections();
    getProfileData();
    checkSubscriptionStatus();
    checkUrlParams();
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "social") {
      setActiveTab("social");
    }
  }, []);

  // React to query param changes while already on Dashboard (e.g., navigating from modals)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    if (tab === "social" && activeTab !== "social") {
      setActiveTab("social");
    }
  }, [location.search]);

  // Check for LinkedIn and X connection success/error from URL params
  const checkUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const linkedinConnected = urlParams.get("linkedin_connected");
    const linkedinError = urlParams.get("linkedin_error");
    const xConnected = urlParams.get("x_connected");
    const xError = urlParams.get("x_error");
    const facebookConnected = urlParams.get("facebook_connected");
    const facebookError = urlParams.get("facebook_error");
    const errorMessage = urlParams.get("error_message");

    if (linkedinConnected === "true") {
      fetchSocialConnections(); // Refresh connections
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (linkedinError === "true") {
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (xConnected === "true") {
      fetchSocialConnections(); // Refresh connections
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (xError === "true") {
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (facebookConnected === "true") {
      fetchSocialConnections(); // Refresh connections
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (facebookError === "true") {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const fetchSocialConnections = async () => {
    try {
      const response = await fetchSocialConnectionsApi();

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
      setSocialConnections(normalized);
    } catch (error) {
      console.error("Failed to fetch social connections:", error);
    }
  };

  const handleConnect = async (platform) => {
    try {
      const token = localStorage.getItem("access-token");
      console.log("[Connect] Platform:", platform, "Auth header set:", !!token);

      if (platform === "linkedin") {
        const response = await connectLinkedInApi();
        if (response.data.auth_url) {
          window.location.href = response.data.auth_url;
        }
      } else if (platform === "twitter") {
        const response = await connectTwitterApi();
        if (response.data.auth_url) {
          window.location.href = response.data.auth_url;
        }
      } else if (platform === "facebook") {
        const response = await connectFacebookApi();
        if (response.data.auth_url) {
          window.location.href = response.data.auth_url;
        }
      } else if (platform === "instagram") {
        // No backend OAuth yet; open Instagram as a placeholder action
        window.open("https://www.instagram.com/", "_blank");
      } else {
        // Handle platform not available
      }
    } catch (error) {
      console.error(
        "[Connect] Error:",
        error?.response?.status,
        error?.response?.data || error?.message
      );
      // Handle connection error silently
    }
  };

  const handleDisconnect = async (platform) => {
    try {
      if (platform === "linkedin") {
        await disconnectLinkedInApi();
        fetchSocialConnections();
      } else if (platform === "twitter") {
        // Get the connection ID first
        const connection = socialConnections.find(
          (conn) => conn.platform === "twitter"
        );
        console.log("X disconnect - Found connection:", connection);
        if (connection && connection.id) {
          console.log(
            "X disconnect - Attempting to disconnect with ID:",
            connection.id
          );
          await disconnectTwitterApi(connection.id);
          console.log("X disconnect - Success, refreshing connections");
          fetchSocialConnections();
        } else {
          console.error(
            "X disconnect - No connection found or no ID:",
            connection
          );
        }
      } else if (platform === "facebook") {
        const connection = socialConnections.find(
          (conn) => conn.platform === "facebook"
        );
        if (connection && connection.id) {
          await disconnectFacebookApi(connection.id);
          fetchSocialConnections();
        }
      } else {
        // Handle platform not available
      }
    } catch (error) {
      console.error(
        "[Disconnect] Error:",
        error?.response?.status,
        error?.response?.data || error?.message
      );
      // Handle disconnection error silently
    }
  };

  const navigationItems = [
    
    {
      id: "new",
      label: "Clear Chat",
      image: sidetop,
      color: "text-[#3D3D3D]",
      bgColor: "bg-[#84E084]",
    },
    {
      id: "chat",
      label: "AI Chat",
      image: side1,
      color: "text-[#3D3D3D]",
      bgColor: "bg-[#84E084]",
    },
    // {
    //   id: "history",
    //   label: "Content History",
    //   image: side2,
    //   color: "text-[#3D3D3D]",
    //   bgColor: "bg-[#84E084]",
    // },
    {
      id: "posts",
      label: "My Posts",
      image: side3,
      color: "text-[#3D3D3D]",
      bgColor: "bg-[#84E084]",
    },
    {
      id: "social",
      label: "Social Media",
      image: side4,
      color: "text-[#3D3D3D]",
      bgColor: "bg-[#84E084]",
    },
    {
      id: "SubscriptionPlans",
      label: "Subscription Plans",
      image: sidetop2,
      color: "text-[#3D3D3D]",
      bgColor: "bg-[#84E084]",
      isDropdown: true,
      dropdownItems: [
        { id: "billing", label: "Billing", image: sidetop1 },
        { id: "credit", label: "Credit Usage", image: CreaditSvg },
        { id: "invoice", label: "Invoice", image: InvoiceSvg },
        { id: "history", label: "History", image: side6 },
      ],
    },
   
    // { id: 'analytics', label: 'Analytics', image: side5, color: 'text-[#3D3D3D]', bgColor: 'bg-[#84E084]' },
    // { id: 'templates', label: 'Templates', image: side6, color: 'text-[#3D3D3D]', bgColor: 'bg-[#84E084]' },
  ];
  const chatItems = [
    { id: "ch1", label: "Previous Chats" },
    //   // { id: "ch2", label: "Content History 02" },
    //   // { id: "ch3", label: "Content History 03" },
    //   // { id: "ch4", label: "Content History 04" },
    //   // { id: "ch5", label: "Content History 05" },
    //   // { id: "ch6", label: "Content History 06" },
    //   // { id: "ch6", label: "Content History 06" },
    //   // { id: "ch6", label: "Content History 06" },
    //   // { id: "ch6", label: "Content History 06" },
    //   // { id: "ch6", label: "Content History 06" },
  ];

  const socialPlatforms = [
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: Linkedin,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      connected: false,
    },
    {
      id: "twitter",
      name: "X",
      icon: Twitter,
      color: "text-gray-800",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
      connected: false,
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: Instagram,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
      borderColor: "border-pink-200",
      connected: false,
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: Facebook,
      color: "text-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      connected: false,
    },
  ];

  // Update social platforms with connection status and profile info
  const updatedSocialPlatforms = socialPlatforms.map((platform) => {
    const connection = socialConnections.find(
      (conn) => conn.platform === platform.id
    );
    return {
      ...platform,
      connected: connection?.is_connected || connection?.connected || false,
      profileInfo: connection?.profile_info || null,
    };
  });

  // Compute avatar image URL and user initial
  const userInitial = (user?.name || user?.email || "U")
    .toString()
    .charAt(0)
    .toUpperCase();
  const rawAvatar =
    profileData?.profileImage ||
    profileData?.profile_image ||
    profileData?.profile_image_url ||
    profileData?.picture;
  const avatarSrc = rawAvatar
    ? rawAvatar.startsWith("http") ||
      rawAvatar.includes("googleusercontent.com")
      ? rawAvatar
      : `${IMAGE_BASE_URL}${rawAvatar.startsWith("/") ? "" : "/"}${rawAvatar}`
    : null;

  // Show loading state while checking subscription
  if (hasSubscription === null) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        // style={{ background: "#121318" }}
      >
        {/* <div className="text-white text-lg">Loading...</div> */}
        {/* <div className="loader"></div> */}
        <img src={Loading} alt="" className="w-24 h-24" />
      </div>
    );
  }

  // Show billing screen if user doesn't have subscription
  // if (hasSubscription === false) {
  //   return <BillingScreen />;
  // }
  return (
    <div
      className="h-screen flex overflow-hidden"
      style={{ background: "#121318" }}
    >
      <style>{`
      div:where(.swal2-container) div:where(.swal2-actions) {
    display: flex !important;
    z-index: 1;
    box-sizing: border-box;
    flex-wrap: unset !important;
    align-items: center;
    justify-content: var(--swal2-actions-justify-content);
    width: var(--swal2-actions-width);
    margin: var(--swal2-actions-margin);
    padding: var(--swal2-actions-padding);
    border-radius: var(--swal2-actions-border-radius);
    background: var(--swal2-actions-background);
}
        .swal2-popup-custom { 
          background: #FFFFFF !important; 
          border: 1px solid #E5E7EB !important; 
          border-radius: 14px !important; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.15) !important;
          color: #374151 !important;
          padding-top: 22px !important;
          min-height: 240px !important;
          font-size:16px !important;
        }
          .swal2-popup-custom .swal2-html-container {
    font-size: 17px !important;
    color: #666 !important;
    line-height: 1.5 !important;
    margin: 0 !important;
}
        .swal2-html-container { 
          color: #222222 !important; 
          font-weight: 400; 
          font-size:16px !important;
        }
        .swal2-actions { gap: 12px !important; }
        .swal2-confirm-custom { 
          background: linear-gradient(180deg, #7EDD7E 0%, #57C957 100%) !important; 
          color: #021E22 !important; 
          border: none !important; 
          border-radius: 12px !important; 
          padding: 10px 28px !important;
          min-width: 160px !important;
          justify-content: center !important;
        }
      
        .swal2-cancel-custom { 
          background: #EAEAEA !important; 
          color: #021E22 !important; 
          border: none !important; 
          border-radius: 12px !important; 
          padding: 10px 28px !important;
          min-width: 160px !important;
          justify-content: center !important;
        }
      
        .swal2-image.logo { width: 140px; height: auto; margin: 12px auto 12px !important; }
      `}</style>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Fixed */}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:h-full`}
      >
        <div
          className={`flex flex-col h-full bg-[#FFFFFF] border-r border-[#EDEDED] shadow-xl ${
            sidebarCollapsed ? "w-16" : "w-58"
          }`}
        >
          {/* Sidebar Header - Fixed */}
          <div className="flex items-center justify-between px-3 py-1 pt-4 flex-shrink-0">
            {!sidebarCollapsed && (
              <div className="flex items-center">
                <div className="w-32 h-8 flex items-center justify-center">
                  <a href="http://alfred.simbli.ai/dashboard">
                    <img src={logosim} alt="Simbli" className="w-26 h-6" />
                  </a>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:hidden p-2 rounded-lg  transition-colors text-[#000]"
            >
              {sidebarCollapsed ? (
                <Menu className="w-4 h-4" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-[#1D2027] transition-colors text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation - Scrollable */}
          <div
            className="flex-1 overflow-y-auto px-2 pt-3 custom-scrollbar"
            style={{
              marginRight: "0px",
              paddingRight: "16px",
            }}
          >
            {/* Main Navigation Items */}
            <nav className="h-full flex flex-col justify-between  space-y-2">
              <div>
                {navigationItems.filter((data) => data.id !== "new").map((item) => (
                    <div
                      key={item.id}
                      className="relative"
                      ref={item.isDropdown ? SubscriptionPlansDropdownRef : null}
                    >
                      <button
                        onClick={async () => {
                          if (item.id === "new") {
                            await clearChatHistory(); // reset messages + session
                            setActiveTab("chat"); // always navigate to AI Chat
                            setSidebarOpen(false);
                          } else if (item.isDropdown) {
                            setSubscriptionPlansDropdownOpen(
                              !SubscriptionPlansDropdownOpen
                            );
                            // Don't close sidebar for dropdown/accordion toggle
                          } else if (item.isExternal) {
                            window.location.href = item.url;
                            setSidebarOpen(false);
                          } else {
                            setActiveTab(item.id);
                            setSidebarOpen(false);
                            // Close Subscription Plans dropdown when clicking other nav items
                            setSubscriptionPlansDropdownOpen(false);
                          }
                        }}
                        className={`w-full flex items-center space-x-3 py-2 px-3 mt-2 rounded-xl transition-all duration-200 ${activeTab === item.id ||
                          (item.isDropdown && SubscriptionPlansDropdownOpen)
                            ? `${item.bgColor} text-black shadow-sm`
                            : "text-[#3D3D3D] hover:bg-[#84E084]"
                        }`}
                        style={{ borderRadius: "6px" }}
                      >
                        <img
                          src={item.image}
                          alt={item.label}
                          className={`${sidebarCollapsed ? "w-3 h-3" : "w-5 h-5"}`}
                          style={{
                            width: "14px",
                            height: "14px",
                            maxWidth: "unset !important",
                          }}
                        />
                        {!sidebarCollapsed && (
                          <span
                            className="font-medium"
                            style={{ fontSize: "15px" }}
                          >
                            {item.label}
                          </span>
                        )}
                        {!sidebarCollapsed && item.isDropdown && (
                          <svg
                            className={`w-4 h-4 ml-auto transition-transform duration-200 ${SubscriptionPlansDropdownOpen ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        )}
                      </button>

                      {/* Accordion Content */}
                      {item.isDropdown &&
                        SubscriptionPlansDropdownOpen &&
                        !sidebarCollapsed && (
                          <div className="mt-1 ml-4 space-y-1">
                            {item.dropdownItems?.map((dropdownItem) => (
                              <button
                                key={dropdownItem.id}
                                onClick={() => {
                                  setActiveTab(dropdownItem.id);
                                  setSidebarOpen(false);
                                }}
                                className={`w-full flex items-center space-x-3 mt-2 py-2 px-3 text-left hover:bg-[#84E084] transition-colors duration-200 rounded-lg ${activeTab === dropdownItem.id
                                    ? "bg-[#84E084] text-black"
                                    : "text-[#3D3D3D]"
                                }`}
                                style={{ borderRadius: "6px" }}
                              >
                                <img
                                  src={dropdownItem.image}
                                  alt={dropdownItem.label}
                                  className="w-4 h-4"
                                  style={{
                                    width: "14px",
                                    height: "14px",
                                    maxWidth: "unset !important",
                                  }}
                                />
                                <span
                                  className="font-medium"
                                  style={{ fontSize: "14px" }}
                                >
                                  {dropdownItem.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  ))}
              </div>
              <div className="mb-3">
                <button
                  onClick={() => setIsGuideOpen(false)}
                  className={`w-full flex items-center space-x-3 py-2 px-3 mt-2 rounded-xl transition-all duration-200 text-[#3D3D3D] hover:bg-[#84E084]`}
                  style={{ borderRadius: "6px" }}
                >
                  <img
                    src={QuickGuide}
                    alt="Quick Guide"
                    className={`${sidebarCollapsed ? "w-3 h-3" : "w-5 h-5"}`}
                    style={{ width: "14px", height: "14px", maxWidth: "unset !important" }}
                  />
                  {!sidebarCollapsed && (
                    <span className="font-medium" style={{ fontSize: "15px" }}>
                      Quick Guide
                    </span>
                  )}
                </button>
                 {navigationItems.filter((data) => data.id === "new").map((item) => (
                    <div
                      key={item.id}
                      className="relative"
                      ref={item.isDropdown ? SubscriptionPlansDropdownRef : null}
                    >
                      <button
                        onClick={async () => {
                          if (item.id === "new") {
                            await clearChatHistory(); // reset messages + session
                            setActiveTab("chat"); // always navigate to AI Chat
                            setSidebarOpen(false);
                          } else if (item.isDropdown) {
                            setSubscriptionPlansDropdownOpen(
                              !SubscriptionPlansDropdownOpen
                            );
                            // Don't close sidebar for dropdown/accordion toggle
                          } else if (item.isExternal) {
                            window.location.href = item.url;
                            setSidebarOpen(false);
                          } else {
                            setActiveTab(item.id);
                            setSidebarOpen(false);
                            // Close Subscription Plans dropdown when clicking other nav items
                            setSubscriptionPlansDropdownOpen(false);
                          }
                        }}
                        className={`w-full flex items-center space-x-3 py-2 px-3 mt-2 rounded-xl transition-all duration-200 ${activeTab === item.id ||
                          (item.isDropdown && SubscriptionPlansDropdownOpen)
                            ? `${item.bgColor} text-black shadow-sm`
                            : "text-[#3D3D3D] hover:bg-[#84E084]"
                        }`}
                        style={{ borderRadius: "6px" }}
                      >
                        <img
                          src={item.image}
                          alt={item.label}
                          className={`${sidebarCollapsed ? "w-3 h-3" : "w-5 h-5"}`}
                          style={{
                            width: "14px",
                            height: "14px",
                            maxWidth: "unset !important",
                          }}
                        />
                        {!sidebarCollapsed && (
                          <span
                            className="font-medium"
                            style={{ fontSize: "15px" }}
                          >
                            {item.label}
                          </span>
                        )}
                        {!sidebarCollapsed && item.isDropdown && (
                          <svg
                            className={`w-4 h-4 ml-auto transition-transform duration-200 ${SubscriptionPlansDropdownOpen ? "rotate-180" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        )}
                      </button>

                      {/* Accordion Content */}
                      {item.isDropdown &&
                        SubscriptionPlansDropdownOpen &&
                        !sidebarCollapsed && (
                          <div className="mt-1 ml-4 space-y-1">
                            {item.dropdownItems?.map((dropdownItem) => (
                              <button
                                key={dropdownItem.id}
                                onClick={() => {
                                  setActiveTab(dropdownItem.id);
                                  setSidebarOpen(false);
                                }}
                                className={`w-full flex items-center space-x-3 mt-2 py-2 px-3 text-left hover:bg-[#84E084] transition-colors duration-200 rounded-lg ${activeTab === dropdownItem.id
                                    ? "bg-[#84E084] text-black"
                                    : "text-[#3D3D3D]"
                                }`}
                                style={{ borderRadius: "6px" }}
                              >
                                <img
                                  src={dropdownItem.image}
                                  alt={dropdownItem.label}
                                  className="w-4 h-4"
                                  style={{
                                    width: "14px",
                                    height: "14px",
                                    maxWidth: "unset !important",
                                  }}
                                />
                                <span
                                  className="font-medium"
                                  style={{ fontSize: "14px" }}
                                >
                                  {dropdownItem.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  ))}
              </div>
            </nav>

            {/* Chat Items Section */}
            {/* <div className="mt-6">
              {!sidebarCollapsed && (
                <h3 className="chats-text font-semibold text-gray-400 tracking-wide mb-2">
                  Chats
                </h3>
              )}
              <div className="space-y-1">
                {chatItems.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => {
                      setActiveTab(chat.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                      activeTab === chat.id
                        ? "bg-[#84E084] text-[#474747] shadow-sm"
                        : "text-gray-500 hover:bg-[#84E084]/20"
                    }`}
                  >
                    {!sidebarCollapsed && (
                      <span className="text-sm">{chat.label}</span>
                    )}
                  </button>
                ))}
              </div>
            </div> */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Top Bar - Fixed */}
        <div className="bg-[#ffff] flex-shrink-0 z-30 border-b border-[#EDEDED]">
          <div className="flex items-center justify-between px-3 py-2 md:px-4 md:py-3">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                className="lg:hidden p-2 rounded-lg  text-[#000]"
                aria-label={sidebarOpen ? "Close menu" : "Open menu"}
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5" style={{ color: "#000" }} />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
              <div className="flex items-center space-x-2 py-2 px-3 px-lg-3 border border-[#B1E3B1] bg-[#EFFBEF] rounded-xl">
                <img
                  src={currentAgent.img}
                  alt={currentAgent.name}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div className="leading-tight text-left">
                  <div className="text-sm font-bold text-gray-900">
                    {currentAgent.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    {currentAgent.role}
                  </div>
                </div>
              </div>
            </div>
            {/* Top-right profile avatar with dropdown */}
            <div className="relative mr-3" ref={profileMenuRef}>
              <div className="d-flex items-center justify-center">
                <button
                  onClick={() => setProfileMenuOpen((v) => !v)}
                  className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden bg-gray-600 border-2 border-gray-300 hover:bg-gray-700 transition-colors"
                  aria-haspopup="menu"
                  aria-expanded={profileMenuOpen}
                  style={{ borderRadius: "50%" }}
                >
                  {avatarSrc ? (
                    <>
                      <img
                        src={avatarSrc}
                        alt="Profile"
                        className="w-9 h-9 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const sib = e.currentTarget.nextSibling;
                          if (sib) sib.style.display = "inline";
                        }}
                      />
                      <span
                        className="text-white font-semibold"
                        style={{ display: "none" }}
                      >
                        {userInitial}
                      </span>
                    </>
                  ) : (
                    <span className="text-white font-semibold">
                      {userInitial}
                    </span>
                  )}
                </button>
                {/* <svg
                style={{color:"#173E44"}}
                  xmlns="http://www.w3.org/2000/svg"
                  xmlns:xlink="http://www.w3.org/1999/xlink"
                  fill="#000000"
                  height="10px"
                  width="10px"
                  version="1.1"
                  id="Layer_1"
                  viewBox="0 0 512.002 512.002"
                  xml:space="preserve"
                  className={`ml-1 transition-transform duration-200 ${
                    profileMenuOpen ? "rotate-180" : ""
                  }`}
                >
                  <g>
                    <g>
                      <path d="M498.837,65.628c-7.957-3.328-17.152-1.472-23.253,4.629L256,289.841L36.416,70.257    c-6.101-6.101-15.275-7.936-23.253-4.629C5.184,68.913,0,76.721,0,85.34v106.667c0,5.675,2.24,11.093,6.251,15.083    l234.667,234.667c4.16,4.16,9.621,6.251,15.083,6.251c5.462,0,10.923-2.091,15.083-6.251L505.751,207.09    c4.011-3.989,6.251-9.408,6.251-15.083V85.34C512,76.721,506.816,68.913,498.837,65.628z" />
                    </g>
                  </g>
                </svg> */}
              </div>
              <div
                className={`absolute right-0 mt-3 w-48 rounded-2xl border border-gray-200 bg-white shadow-lg p-2 transition-all duration-150 origin-top-right transform ${
                  profileMenuOpen
                    ? "opacity-100 scale-100 translate-y-0"
                    : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
                }`}
                role="menu"
              >
                <button
                  // onClick={() => {
                  //   window.location.href = `${SIMBLI_URL}/profile`;
                  //   setProfileMenuOpen(false);
                  // }}
                  onClick={()=>{
                    openPopup()
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  role="menuitem"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">My Profile</span>
                </button>

                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    handleLogout();
                    setProfileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  role="menuitem"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        {isPopupOpen && (
          <>
            <Profilepop isPopupOpen ={isPopupOpen}
              setIsPopupOpen ={setIsPopupOpen}
              onProfileUpdate={refreshProfileData}
            />
          </>
        )}
        {!isGuideOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setIsGuideOpen(true)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 p-6 md:p-9 guide-popup-scrollbar" style={{maxWidth:"720px",height:"95vh",overflowY:"auto"}}>
              <button
                onClick={() => setIsGuideOpen(true)}
                className="guide-popup-close-btn"
                aria-label="Close guide"
              >
                <X />
              </button>
              <h3 className="text-center text-xl md:text-2xl font-semibold mb-3" style={{color:"#022C33"}}>
                Alfred Agent Manual: Content Creation Guide
              </h3>
              <p className="text-center text-sm md:text-base leading-6 pb-3 text-gray-600" style={{borderBottom:"1px solid #E0E0E0"}}>
                Alfred helps you create engaging, personalized posts for <strong>LinkedIn, Twitter (X), Instagram, and Facebook - all from one place.</strong>
              </p>
              <p className="text-center text-sm md:text-base leading-6 pb-3 text-gray-600" style={{}}>
                Just start a chat and tell Alfred what you want to share.
              </p>

              <h4 className="mt-4 font-semibold" style={{color:"#022C33"}}>Step 1: Create Your Content</h4>
              <p className="text-gray-600 text-sm md:text-base leading-6 mb-2">Start by telling Alfred the type of post you'd like to make.</p>
              <p className="text-gray-600 text-sm md:text-base leading-6 mb-2">Examples:</p>
              <ul className="list-disc pl-5 text-gray-600 text-sm md:text-base leading-6 mb-2">
                <li>"Create a LinkedIn post about my startup journey."</li>
                <li>"Write a Twitter (X) post on how AI is changing the world."</li>
                <li>"Generate an Instagram post about healthy living."</li>
                <li>"Make a Facebook post about the recent [event]."</li>
              </ul>
              <p className="text-gray-600 text-sm md:text-base leading-6 mb-3">Alfred will instantly craft a tailored post based on your topic and platform.</p>
              <p className="text-gray-600 text-sm md:text-base leading-6 mb-4"><span className="font-medium">💡 Tip:</span> You can also ask Alfred about trending topics and turn them into instant posts.</p>

              <h4 className="font-semibold" style={{color:"#022C33"}}>Step 2: Refine and Perfect Your Post</h4>
              <p className="text-gray-600 text-sm md:text-base leading-6 mb-2">If the first version isn't exactly what you want, just ask Alfred to tweak it.</p>
              <p className="text-gray-600 text-sm md:text-base leading-6 mb-2">Examples:</p>
              <ul className="list-disc pl-5 text-gray-600 text-sm md:text-base leading-6 mb-3">
                <li>"Regenerate the image."</li>
                <li>"Make it shorter for Twitter (X)."</li>
                <li>"Add a professional tone."</li>
              </ul>
              <p className="text-gray-600 text-sm md:text-base leading-6 mb-4">Every new version appears in the chat - your original content always stays safe.</p>

              <h4 className="font-semibold" style={{color:"#022C33"}}>Step 3: Create Posts from Images or Links</h4>
              <p className="text-gray-600 text-sm md:text-base leading-6 mb-2">Want Alfred to write from your visuals or web links? Easy.</p>
              <p className="text-gray-600 text-sm md:text-base leading-6 mb-1 font-medium">Using an Image:</p>
              <ol className="list-decimal pl-5 text-gray-600 text-sm md:text-base leading-6 mb-2">
                <li>Click the upload image button in chat.</li>
                <li>Upload your photo or graphic.</li>
                <li>Say, "Create a post using this image" or "Analyze this image and make a LinkedIn post."</li>
              </ol>
              <p className="text-gray-600 text-sm md:text-base leading-6 mb-1 font-medium">Using a Link:</p>
              <p className="text-gray-600 text-sm md:text-base leading-6 mb-4">Type: "Create a post using this [URL]."<br />Alfred will analyze the page and generate a post inspired by it.</p>

              <h4 className="font-semibold" style={{color:"#022C33"}}>Step 4: Review and Prepare for Publishing</h4>
              <p className="text-gray-600 text-sm md:text-base leading-6 mb-2">Once your post is ready:</p>
              <ol className="list-decimal pl-5 text-gray-600 text-sm md:text-base leading-6 mb-1">
                <li>Click the platform selector at the bottom.</li>
                <li>Choose your platform - LinkedIn, Twitter (X), Instagram, or Facebook.</li>
                <li>Review or edit your post. You can:
                  <ul className="list-disc pl-5 mt-1">
                    <li>Regenerate visuals</li>
                    <li>Add your own image or video</li>
                    <li>Save as draft for later</li>
                  </ul>
                </li>
              </ol>

              <h4 className="font-semibold mt-4" style={{color:"#022C33"}}>Step 5: Manage Your Posts</h4>
              <p className="text-gray-600 text-sm md:text-base leading-6 mb-2">Head to My Posts to organize your content.</p>
              <p className="text-gray-600 text-sm md:text-base leading-6 mb-2">Here, you can:</p>
              <ul className="list-disc pl-5 text-gray-600 text-sm md:text-base leading-6 mb-3">
                <li>View, edit, or duplicate posts across platforms.</li>
                <li>Check your publishing calendar.</li>
                <li>Schedule upcoming posts easily.</li>
              </ul>

              <h4 className="font-semibold" style={{color:"#022C33"}}>Step 6: Personalize Your Experience</h4>
              <p className="text-gray-600 text-sm md:text-base leading-6 mb-2">Go to Social Media Settings to help Alfred sound more like you.</p>
              <ul className="list-disc pl-5 text-gray-600 text-sm md:text-base leading-6 mb-2">
                <li>Connect your LinkedIn account.</li>
                <li>Let Alfred learn your writing tone and style.</li>
                <li>Add or confirm your company details (if not auto-detected).</li>
              </ul>
              <p className="text-gray-600 text-sm md:text-base leading-6 mb-4">From then on, every post Alfred creates will match your brand voice, style, and audience.</p>

              <h4 className="font-semibold" style={{color:"#022C33"}}>Pro Tips</h4>
              <ul className="list-disc pl-5 text-gray-600 text-sm md:text-base leading-6 mb-2">
                <li>Upload your own images and ask Alfred to build posts around them - it keeps your content authentic.</li>
                <li>After creating a post, Alfred will show "Here's why this post works for you," explaining how it fits your brand tone and audience goals.</li>
              </ul>
              <div className="mb-4 mt-4">
                <h4 className="font-bold text-base md:text-lg mb-2" style={{color:"#022C33"}}>In short:</h4>
                <p className="text-gray-600 text-sm md:text-base leading-6 font-medium" >
                  Chat → Create → Refine → Schedule → Grow.<br />
                  Alfred takes care of the rest.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-center gap-3">
                
                <button
                  onClick={() => {
                   setIsGuideOpen(true);
                  }}
                  className="inline-flex items-center w-full justify-center px-6 py-2 rounded-xl text-sm font-semibold text-[#021E22]"
                  style={{ background: "linear-gradient(180deg, #7EDD7E 0%, #57C957 100%)",borderRadius:"10px" }}
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Page Content - Scrollable */}
        <div
          ref={mainContentRef}
          className="flex-1 bg-[#f4f4f4] overflow-y-auto custom-scrollbar"
        >
          {/* Tab Content */}
          <div className="min-h-full dashboard-pin h-100">
            {activeTab === "chat" && (
              <ChatInterface
                onNavigateToBilling={() => setActiveTab("billing")}
                onNavigateToSocial={() => setActiveTab("social")}
                onNavigateToPosts={() => setActiveTab("posts")}
              />
              //  <ChatInterfaceNew
              //   onNavigateToBilling={() => setActiveTab("billing")}
              //   onNavigateToSocial={() => setActiveTab("social")}
              //   onNavigateToPosts={() => setActiveTab("posts")}
              // />
            )}
            {/* {activeTab === "history" && <ContentHistory7 />} */}
            {activeTab === "posts" && (
              // <MyPosts />
              // <MyPostsNew/>
              // <MyPostsDashboard />
              <MyPostsDashboardNew
                onNavigateToSocial={() => setActiveTab("social")}
              />
              // <MyPostsDashboardnext
              // onNavigateToSocial={() => setActiveTab("social")}
              // />
            )}
            {activeTab === "social" && (
              <>
                <SocialMedia 
                  connections={connections}
                  ayrshareConnections={ayrshareConnections}
                  fetchConnectionStatus={fetchConnectionStatus}
                  fetchAyrshareConnections={fetchAyrshareConnections}
                />
              </>
            )}
            {activeTab === "subscription" && (
              <>
                <SubscriptionPlans />
              </>
            )}
            {activeTab === "billing" && (
              <>
                {/* <Billing /> */}
                <BillingNewCode
                  onNavigateToInvoice={() => setActiveTab("invoice")}
                />
                {/* <PaymentMethod /> */}
              </>
            )}
            {activeTab === "credit" && (
              <>
                <Credit />
              </>
            )}
            {activeTab === "invoice" && (
              <>
                {/* <Invoice /> */}
                <InvoiceNew />
              </>
            )}
            {activeTab === "history" && (
              <>
                {/* <BillingHistory /> */}
                <BillingHistoryNew subscriptionData={subscriptionData} />
              </>
            )}
            {/*{activeTab === "payment-method" && (
              <>
                <PaymentMethod />
              </>
            )}
            {activeTab === "analytics" && (
              <div className="text-center py-20 text-gray-500">
                <BarChart3
                  className="w-16 h-16 mx-auto mb-4"
                  style={{ color: "#79DB79" }}
                />
                <h3 className="text-lg font-medium mb-2">
                  Analytics Coming Soon
                </h3>
                <p>Track your content performance and engagement metrics</p>
              </div>
            )}
            {activeTab === "templates" && (
              <div className="text-center py-20 text-gray-500">
                <Palette
                  className="w-16 h-16 mx-auto mb-4"
                  style={{ color: "#79DB79" }}
                />
                <h3 className="text-lg font-medium mb-2">
                  Templates Coming Soon
                </h3>
                <p>Save and reuse your favorite content templates</p>
              </div>
            )}
            {/* {activeTab === "ch1" && (
              <>
                <ContentHistory7 />
              </>
            )} */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
