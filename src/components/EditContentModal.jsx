import React, { useState, useRef, useEffect } from "react";
import "./ConnectAccountPopup.css";
import {
  X,
  Upload,
  RefreshCw,
  Target,
  Calendar,
  Clock,
  Zap,
  CheckCircle,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import MarkdownRenderer from "./MarkdownRenderer";
import DeleteDraftModal from "./DeleteDraftModal";
import { useNavigate } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./PostCreationModal.css";
import refreshIcon from "../assets/refresh.png";
import addIcon from "../assets/add.png";
import global from "../assets/global.png";
import linkedinIcon from "../assets/dashlink.png";
import twitterIcon from "../assets/lnk2.png";
import instagramIcon from "../assets/instagram.png";
import facebookIcon from "../assets/fb.png";
import { useAuth } from "../contexts/AuthContext";
import { useChatHistory } from "../contexts/ChatHistoryContext";
import "../index.css";
import {
  getSocialConnectionsApi,
  autoConvertPlatformApi,
  updateContentApi,
  publishContentApi,
  getPublishUrlApi,
  schedulePostApi,
  reschedulePostApi,
  getSuggestedTimesApi,
  unschedulePostApi,
  generateImageApi,
  uploadImageApi,
  uploadVideoApi,
  uploadMediaApi,
  getAyrshareProfile,
  getAyrshareConnectedAccounts,
  postToAyrshare,
  scheduleAyrsharePost,
  updateScheduledPost,
  unscheduleAyrsharePost,
  removeDraftApi,
  upsertDraftVersionApi,
  removeDraftVersionApi,
  checkImageLimitApi,
  checkChatBlockStatusApi,
  getAvailablePlatformsForDuplicateApi,
  duplicateContentApi,
  BASE_URL,
} from "../api/api";
import Swal from "sweetalert2";
import PricingPopup from "./PricingPopup";
// Use shared MarkdownRenderer
import {
  convertLocalTimeToUTC,
  convertUTCToLocal,
  getCurrentTimezone,
  formatTimeForDisplay,
} from "../utils/timezoneUtils";

const EditContentModal = ({
  isOpen,
  onClose,
  content,
  onContentUpdate,
  publishSuccessMap,
  setPublishSuccessMap,
  onNavigateToSocial,
  platform,
  isOriginalPlatform,
  showDuplicateButton,
  publishing: publishingProp,
}) => {
  console.log("content ------->>>>>>>>>>>", { content });
  console.log("content.created_at ------->>>>>>>>>>>", {
    created_at: content?.created_at,
    type: typeof content?.created_at,
  });
  console.log("publishSuccessMap", publishSuccessMap);
  console.log("type ------->>>>>>>>>>>", { type: content?.type });
  const [editedContent, setEditedContent] = useState("");
  const [editedHashtags, setEditedHashtags] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(
    platform || "linkedin"
  );
  const [publishing, setPublishing] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  // Use prop if provided, otherwise use local state
  // This ensures isPublishing is always defined
  const isPublishing = publishingProp !== undefined && publishingProp !== null ? publishingProp : publishing;
  const [reschedulePostId, setReschedulePostId] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [isAM, setIsAM] = useState(true);
  const [suggestedTimes, setSuggestedTimes] = useState([]);
  const [hourDropdownOpen, setHourDropdownOpen] = useState(false);
  const [minuteDropdownOpen, setMinuteDropdownOpen] = useState(false);
  const [ampmDropdownOpen, setAmpmDropdownOpen] = useState(false);
  const hourDropdownRef = useRef(null);
  const minuteDropdownRef = useRef(null);
  const ampmDropdownRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAlreadyPublished, setIsAlreadyPublished] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Confirmation modal states
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null); // 'publish', 'schedule', 'unschedule'
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [confirmationTitle, setConfirmationTitle] = useState("");
  const [confirmationConfirmText, setConfirmationConfirmText] = useState("");
  const [confirmationCancelText, setConfirmationCancelText] = useState("");
const [uploading, setUploading] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);

  // Duplicate functionality states
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [availablePlatforms, setAvailablePlatforms] = useState([]);
  const [duplicating, setDuplicating] = useState(false);
  useEffect(() => {
    setSelectedPlatform(platform);
  }, [platform]);
  
  // Set selectedPlatform based on isOriginalPlatform prop
  useEffect(() => {
    if (isOpen && isOriginalPlatform && content?.original_platform) {
      // Use original_platform when isOriginalPlatform prop is true
      console.log("Setting selectedPlatform to original_platform (isOriginalPlatform=true):", content.original_platform);
      setSelectedPlatform(content.original_platform);
    } else if (isOpen && platform) {
      console.log("Setting selectedPlatform to platform prop:", platform);
      setSelectedPlatform(platform);
    }
  }, [isOpen, content?.original_platform, platform, isOriginalPlatform]);

  // Update character count whenever editedContent changes
  useEffect(() => {
    setCharacterCount(editedContent.length);
  }, [editedContent]);
  // Update current time every minute for dynamic elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      console.log(
        "EditContentModal: Time updated to",
        new Date().toISOString()
      );
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Force re-render every 10 seconds to update elapsed time (for testing)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      setForceUpdate((prev) => prev + 1); // Force re-render
      console.log(
        "EditContentModal: Force update triggered",
        new Date().toISOString()
      );
    }, 10000); // Update every 10 seconds for testing
    return () => clearInterval(interval);
  }, []);

  // Function to calculate elapsed time
  // const getElapsedTime = (timestamp) => {
  //   console.log("timeStap",timestamp)
  //   if (!timestamp) {
  //     console.log("EditContentModal: No timestamp provided");
  //     return "Just now";
  //   }
  //   console.log("EditContentModal timestamppppp", typeof timestamp, { timestamp });

  //   // Use current time directly instead of state to ensure accuracy
  //   const now = new Date();

  //   // Ensure timestamp is properly parsed - handle both UTC and timezone offset formats
  //   let messageTime;
  //   if (typeof timestamp === "string") {
  //     console.log("timestampStr 11111111111", { timestamp });

  //     // Normalize timestamp format - handle microseconds (6 digits) by truncating to 3 digits
  //     let normalizedTimestamp = timestamp;
  //     if (timestamp.includes(".") && timestamp.includes("+")) {
  //       // Handle format like "2025-10-04T12:56:22.935425+05:30"
  //       const parts = timestamp.split(".");
  //       if (parts.length === 2) {
  //         const timeAndTz = parts[1];
  //         const timeAndTzParts = timeAndTz.split(/[+-]/);
  //         if (timeAndTzParts.length === 2) {
  //           const microseconds = timeAndTzParts[0];
  //           const timezone = timeAndTz.substring(microseconds.length);
  //           // Truncate microseconds to milliseconds (3 digits)
  //           const milliseconds = microseconds.substring(0, 3);
  //           normalizedTimestamp = parts[0] + "." + milliseconds + timezone;
  //           console.log("Normalized timestamp:", normalizedTimestamp);
  //         }
  //       }
  //     }

  //     // Check if timestamp already has timezone info (Z or +/- offset)
  //     // Look for timezone indicators: Z at the end, or +/- after the time part (position 19 or later)
  //     const hasTimezone = normalizedTimestamp.includes("Z") ||
  //                        normalizedTimestamp.includes("+") ||
  //                        (normalizedTimestamp.includes("-") && normalizedTimestamp.indexOf("-") > 19);

  //     if (hasTimezone) {
  //       // Timestamp already has timezone info, parse directly
  //       console.log("Parsing timestamp with timezone info:", normalizedTimestamp);
  //       messageTime = new Date(normalizedTimestamp);
  //     } else {
  //       // No timezone info, append 'Z' to treat as UTC
  //       console.log("Adding Z to timestamp:", normalizedTimestamp);
  //       messageTime = new Date(normalizedTimestamp + "Z");
  //     }
  //   } else {
  //     console.log("timestampStr 22222222222", { timestamp });
  //     messageTime = new Date(timestamp);
  //   }

  //   // Check if the date is valid
  //   if (isNaN(messageTime.getTime())) {
  //     console.log("Invalid date:", { timestamp, messageTime });
  //     return "Just now";
  //   }

  //   const diffInSeconds = Math.floor((now - messageTime) / 1000);

  //   console.log("!!!!!!!!!!!!!!!!!!", {
  //     messageTime,
  //     diffInSeconds,
  //     now: now.toISOString(),
  //     messageTimeISO: messageTime.toISOString(),
  //     timeDiff: now - messageTime
  //   });

  //   // Check if diffInSeconds is valid
  //   if (isNaN(diffInSeconds) || diffInSeconds < 0) {
  //     console.log("Invalid time difference:", { diffInSeconds, now, messageTime });
  //     return "Just now";
  //   }

  //   if (diffInSeconds < 60) {
  //     return "Just now";
  //   } else if (diffInSeconds < 3600) {
  //     const minutes = Math.floor(diffInSeconds / 60);
  //     return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  //   } else if (diffInSeconds < 86400) {
  //     const hours = Math.floor(diffInSeconds / 3600);
  //     return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  //   } else if (diffInSeconds < 2592000) {
  //     const days = Math.floor(diffInSeconds / 86400);
  //     return `${days} day${days > 1 ? "s" : ""} ago`;
  //   } else if (diffInSeconds < 31536000) {
  //     const months = Math.floor(diffInSeconds / 2592000);
  //     return `${months} month${months > 1 ? "s" : ""} ago`;
  //   } else {
  //     const years = Math.floor(diffInSeconds / 31536000);
  //     return `${years} year${years > 1 ? "s" : ""} ago`;
  //   }
  // };

  const getElapsedTime = (timestamp) => {
    console.log("EditContentModal timestamp:", timestamp);
    if (!timestamp) {
      console.log("EditContentModal: No timestamp provided");
      return "Just now";
    }

    // Use current time directly instead of state to ensure accuracy
    const now = new Date();
    
    // Ensure timestamp is properly parsed - handle both UTC and timezone offset formats
    let messageTime;
    if (typeof timestamp === "string") {
      console.log("EditContentModal processing string timestamp:", timestamp);
      
      // Handle both timestamp formats:
      // 1. '2025-10-09T13:32:31.181Z' (ISO 8601 with Z suffix)
      // 2. '2025-10-07T10:10:48+00:00' (ISO 8601 with timezone offset)
      // 3. '2025-10-07T10:10:48' (ISO 8601 without timezone - treat as UTC)
      
      try {
        // If timestamp doesn't have timezone info, append 'Z' to treat it as UTC
        const timestampStr = timestamp.includes("Z") || timestamp.includes("+") || timestamp.includes("-", 10)
          ? timestamp
          : timestamp + "Z";
        
        console.log("EditContentModal processed timestamp:", timestampStr);
        messageTime = new Date(timestampStr);
        
        // If parsing failed, try custom parsing for edge cases
        if (isNaN(messageTime.getTime())) {
          console.log("Direct parsing failed, trying custom parsing");
          
          // Remove timezone info and milliseconds for custom parsing
          let cleanTimestamp = timestamp.replace(/[Z+].*$/, '');
          cleanTimestamp = cleanTimestamp.replace(/\.\d+/, '');
          
          // Split timestamp parts
          const parts = cleanTimestamp.split(/[-T:]/).map(Number);
          let [year, month, day, hour = 0, minute = 0, second = 0] = parts;
          console.log("Custom parsing parts:", parts);
          
          // Create Date object in UTC
          messageTime = new Date(
            Date.UTC(year, month - 1, day, hour, minute, second)
          );
        }
      } catch (error) {
        console.log("Error parsing timestamp:", error);
        return "Just now";
      }
    } else {
      messageTime = new Date(timestamp);
    }

    // Check if the date is valid
    if (isNaN(messageTime.getTime())) {
      console.log("EditContentModal: Invalid timestamp");
      return "Just now";
    }

    const diffInSeconds = Math.floor((now - messageTime) / 1000);
    console.log("EditContentModal time difference:", diffInSeconds, "seconds");

    // Check if diffInSeconds is valid
    if (isNaN(diffInSeconds) || diffInSeconds < 0) {
      return "Just now";
    }

    if (diffInSeconds < 60) {
      return "Just now";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} month${months > 1 ? "s" : ""} ago`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years} year${years > 1 ? "s" : ""} ago`;
    }
  };

  // Wheel picker scroll handlers
  const handleWheelScroll = (e, type) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;

    if (type === "hour") {
      const newHour = selectedHour + delta;
      if (newHour >= 1 && newHour <= 12) {
        setSelectedHour(newHour);
      } else if (newHour > 12) {
        setSelectedHour(1);
      } else {
        setSelectedHour(12);
      }
    } else if (type === "minute") {
      const newMinute = selectedMinute + delta;
      if (newMinute >= 0 && newMinute <= 59) {
        setSelectedMinute(newMinute);
      } else if (newMinute > 59) {
        setSelectedMinute(0);
      } else {
        setSelectedMinute(59);
      }
    } else if (type === "period") {
      setIsAM(!isAM);
    }
  };

  // Function to handle time selection
  const handleTimeSelection = () => {
    const hour24 = isAM
      ? selectedHour === 12
        ? 0
        : selectedHour
      : selectedHour === 12
      ? 12
      : selectedHour + 12;

    const timeString = `${hour24.toString().padStart(2, "0")}:${selectedMinute
      .toString()
      .padStart(2, "0")}`;

    setScheduleTime(timeString);
    setShowTimePicker(false);
  };

  // Initialize time picker state when opening
  const openTimePicker = () => {
    if (scheduleTime) {
      const timeParts = scheduleTime.split(":");
      const hour = timeParts[0];
      const minute = timeParts[1];
      const hour24 = parseInt(hour, 10);

      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      setSelectedHour(hour12);
      setSelectedMinute(parseInt(minute, 10));
      setIsAM(hour24 < 12);
    }
    setShowTimePicker(true);
  };

  // Close dropdowns when time picker is closed
  useEffect(() => {
    if (!showTimePicker) {
      setHourDropdownOpen(false);
      setMinuteDropdownOpen(false);
      setAmpmDropdownOpen(false);
    }
  }, [showTimePicker]);

  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (hourDropdownRef.current && !hourDropdownRef.current.contains(event.target)) {
        setHourDropdownOpen(false);
      }
      if (minuteDropdownRef.current && !minuteDropdownRef.current.contains(event.target)) {
        setMinuteDropdownOpen(false);
      }
      if (ampmDropdownRef.current && !ampmDropdownRef.current.contains(event.target)) {
        setAmpmDropdownOpen(false);
      }
    };

    if (hourDropdownOpen || minuteDropdownOpen || ampmDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [hourDropdownOpen, minuteDropdownOpen, ampmDropdownOpen]);

  const [selectedSuggestedTime, setSelectedSuggestedTime] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [currentContent, setCurrentContent] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const [converting, setConverting] = useState(false);
  const [conversionMessage, setConversionMessage] = useState("");
  const [socialConnections, setSocialConnections] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const { user, isAuthenticated } = useAuth();
  const { setMessages } = useChatHistory();

  // Ayrshare integration state
  const [ayrshareProfile, setAyrshareProfile] = useState(null);
  const [ayrshareConnections, setAyrshareConnections] = useState([]);
  const [ayrshareLoading, setAyrshareLoading] = useState(false);

  // Delete draft modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingDraft, setDeletingDraft] = useState(false);
  
  // Pricing popup state
  const [showPricingPopup, setShowPricingPopup] = useState(false);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [plan, setPlan] = useState(null);
  const [chatBlocked, setChatBlocked] = useState(false);

    // State for media preview modal
    const [showMediaPreview, setShowMediaPreview] = useState(false);
    const [previewMediaUrl, setPreviewMediaUrl] = useState(null);
    const [previewMediaType, setPreviewMediaType] = useState(null); // 'image' or 'video'
  // Regeneration badge helpers (read shared state written by chat)
  const getRegeneratedMap = () => {
    try {
      return JSON.parse(localStorage.getItem("simbli_regenerated_map") || "{}");
    } catch (_) {
      return {};
    }
  };
  const isRecentlyRegenerated = (contentId, windowMs = 2 * 60 * 1000) => {
    try {
      const map = getRegeneratedMap();
      const ts = map?.[String(contentId)];
      return typeof ts === "number" && Date.now() - ts < windowMs;
    } catch (_) {
      return false;
    }
  };

  // Function to check if user email is in the special list for 25MB uploads
  const isSpecialUserForLargeUploads = (userEmail) => {
    console.log(`isSpecialUserForLargeUploads: ${userEmail}`);
    // Add specific email IDs that can upload 25MB files
    const specialEmails = [
      "crvenk@gmail.com",
      "crv@dci.in",
      "test@simbli.ai"
      // Add more email addresses as needed
    ];
    
    return specialEmails.includes(userEmail?.toLowerCase());
  };

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && (platform === "twitter" || selectedPlatform === "twitter")) {
      if (content.content_text.length > 280) {
      handlePlatformSwitch("twitter");
      }
    }
  }, [isOpen, currentContent, selectedPlatform]);
  // Ayrshare functions
  const fetchAyrshareData = async () => {
    try {
      setAyrshareLoading(true);
      const storedProfile = localStorage.getItem("ayrshare_profile");
      if (storedProfile) {
        console.log("Loaded Ayrshare profile from storage:", storedProfile);
        setAyrshareProfile(JSON.parse(storedProfile));
        await loadAyrshareConnections();
        return;
      }

      const profileResponse = await getAyrshareProfile();
      if (profileResponse.data) {
        console.log("Loaded Ayrshare profile from API:", profileResponse.data);
        setAyrshareProfile(profileResponse.data);
        localStorage.setItem(
          "ayrshare_profile",
          JSON.stringify(profileResponse.data)
        );
        await loadAyrshareConnections();
      } else {
        console.log("No Ayrshare profile found in API response");
      }
    } catch (error) {
      console.error("Error fetching Ayrshare data:", error);
    } finally {
      setAyrshareLoading(false);
    }
  };

  // Load Ayrshare connected accounts
  const loadAyrshareConnections = async () => {
    if (!ayrshareProfile) {
      console.log("No Ayrshare profile available for loading connections");
      return;
    }

    try {
      console.log(
        "Loading Ayrshare connections for profile:",
        ayrshareProfile.profile_key
      );
      const response = await getAyrshareConnectedAccounts();
      console.log("Raw Ayrshare response:", response);

      if (response.data && Array.isArray(response.data.accounts)) {
        setAyrshareConnections(response.data.accounts);
        console.log("Ayrshare connections loaded:", response.data);
      } else {
        console.log("No Ayrshare connections found or invalid response format");
        setAyrshareConnections([]);
      }
    } catch (error) {
      console.error("Error loading Ayrshare connections:", error);
      setAyrshareConnections([]);
    }
  };

  // Manual refresh function for Ayrshare connections
  const refreshAyrshareConnections = async () => {
    console.log("Manually refreshing Ayrshare connections...");
    if (ayrshareProfile) {
      await loadAyrshareConnections();
    } else {
      await fetchAyrshareData();
    }
  };

  // Fetch social connections and update user profile
  const fetchSocialConnections = async () => {
    try {
      const resp = await getSocialConnectionsApi();
      setSocialConnections(resp.data || []);
      updateUserProfile(resp.data || []);
    } catch (err) {
      console.error("Error fetching social connections:", err);
      setSocialConnections([]);
      setUserProfile(null);
    }
  };

  // Update user profile based on selected platform
  const updateUserProfile = (connections) => {
    const normalize = (p) =>
      typeof p === "string"
        ? p.toLowerCase()
        : (p?.value || p || "").toString().toLowerCase();
    const found = connections.find(
      (c) => normalize(c.platform) === selectedPlatform
    );

    // Also check Ayrshare connections
    const ayrshareFound = ayrshareConnections.find(
      (c) => normalize(c.platform) === selectedPlatform
    );

    console.log("Found:", found);
    console.log("Ayrshare found:", ayrshareFound);
    if (found && found.is_connected && found.profile_info) {
      // Use platform-specific profile data from the API response
      const profileInfo = found.profile_info;
      console.log("Profile info for", selectedPlatform, ":", profileInfo);

      if (selectedPlatform === "linkedin") {
        setUserProfile({
          name:
            profileInfo.name ||
            (profileInfo.display_name && profileInfo.family_name
              ? `${profileInfo.display_name} ${profileInfo.family_name}`
              : profileInfo.display_name || profileInfo.family_name || "User"),
          title: profileInfo.headline || "Professional",
          company: profileInfo.company || "Building Simbli's AI Agent Suite",
          platform: selectedPlatform,
          profileImage:
            profileInfo.picture || profileInfo.profile_picture_url || null,
          isConnected: true,
        });
      } else if (selectedPlatform === "twitter") {
        setUserProfile({
          name: profileInfo.name || "User",
          title: profileInfo.description || "Social Media User",
          company: "Building Simbli's AI Agent Suite",
          platform: selectedPlatform,
          profileImage: profileInfo.profile_image_url || null,
          isConnected: true,
        });
      } else {
        // For other platforms, use generic profile data
        setUserProfile({
          name: profileInfo.name || "User",
          title: "Social Media User",
          company: "Building Simbli's AI Agent Suite",
          platform: selectedPlatform,
          profileImage:
            profileInfo.profile_image_url || profileInfo.picture || null,
          isConnected: true,
        });
      }
    } else if (ayrshareFound && ayrshareFound.is_active) {
      // Use Ayrshare connection data if available
      console.log(
        "Using Ayrshare connection for",
        selectedPlatform,
        ":",
        ayrshareFound
      );
      setUserProfile({
        name: ayrshareFound.display_name || ayrshareFound.username || "User",
        title: "Professional",
        company: "Building Simbli's AI Agent Suite",
        platform: selectedPlatform,
        profileImage: ayrshareFound.user_image || null,
        isConnected: true,
      });
    } else {
      // Use default profile when not connected
      setUserProfile({
        name: user?.name || user?.username || "User",
        title: "Social Media User",
        company: "Building Simbli's AI Agent Suite",
        platform: selectedPlatform,
        profileImage: null,
        isConnected: false,
      });
    }
  };

  // Ensure selected platform is connected; if not, prompt and route to social tab
  const promptConnectIfNeeded = async (platform) => {
    try {
      // Refresh Ayrshare connections first to ensure we have latest data
      if (ayrshareProfile) {
        await loadAyrshareConnections();
      }

      // Check Ayrshare connections first
      const isAyrshareConnected = ayrshareConnections.some(
        (account) =>
          account.platform.toLowerCase() === platform.toLowerCase() &&
          account.is_active
      );

      console.log(`Checking ${platform} connection:`, {
        ayrshareConnections: ayrshareConnections.length,
        isAyrshareConnected,
        platform,
        accounts: ayrshareConnections.map((a) => ({
          platform: a.platform,
          is_active: a.is_active,
        })),
      });

      if (isAyrshareConnected) return true;

      // Fallback to original social connections check
      const resp = await getSocialConnectionsApi();
      const normalize = (p) =>
        typeof p === "string"
          ? p.toLowerCase()
          : (p?.value || p || "").toString().toLowerCase();
      const list = Array.isArray(resp.data) ? resp.data : [];
      const found = list.find((c) => normalize(c.platform) === platform);
      const connected = Boolean(found?.is_connected ?? found?.connected);
      if (connected) return true;

      const result = await Swal.fire({
        html: `
          <div class="connect-account-icon">
            <svg width="86" height="86" viewBox="0 0 86 86" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="43" cy="43" r="43" fill="#CFF3DE"/>
<path d="M43.5 40.6696V33.3571M43.5 47.9821H43.5194M39.4167 58.8464L42.2556 62.9136C42.6777 63.5185 42.8889 63.8208 43.1477 63.929C43.3742 64.0237 43.6258 64.0237 43.8523 63.929C44.1111 63.8208 44.3223 63.5185 44.7444 62.9136L47.5833 58.8464C48.1533 58.0297 48.4383 57.6215 48.786 57.3097C49.2495 56.8942 49.7967 56.6 50.3843 56.451C50.8249 56.3393 51.2999 56.3393 52.25 56.3393C54.9679 56.3393 56.3269 56.3393 57.3991 55.8621C58.8282 55.2261 59.964 54.0057 60.5559 52.4701C61 51.3181 61 49.8579 61 46.9375V35.0286C61 31.5182 61 29.7631 60.3642 28.4223C59.8049 27.2429 58.9126 26.2841 57.815 25.6832C56.5671 25 54.9337 25 51.6667 25H35.3333C32.0664 25 30.4329 25 29.1851 25.6832C28.0874 26.2841 27.1951 27.2429 26.6358 28.4223C26 29.7631 26 31.5182 26 35.0286V46.9375C26 49.8579 26 51.3181 26.444 52.4701C27.0361 54.0057 28.1717 55.2261 29.601 55.8621C30.673 56.3393 32.032 56.3393 34.75 56.3393C35.7 56.3393 36.175 56.3393 36.6157 56.451C37.2033 56.6 37.7505 56.8942 38.214 57.3097C38.5617 57.6215 38.8467 58.0297 39.4167 58.8464Z" stroke="#26AE26" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
</svg>


          </div>
          <button class="connect-account-close-btn" id="swal-close-btn">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="connect-account-message">
           Connect your ${
              platform === "twitter"
                ? "X"
                : platform.charAt(0).toUpperCase() + platform.slice(1)
            } account to start drafting, scheduling, and publishing your content directly from Alfred.
          </div>
        `,
        background: "#ffffff",
        color: "#222222",
        showCancelButton: true,
        confirmButtonText: "Connect",
        cancelButtonText: "Cancel",
        buttonsStyling: false,
        width: 460,
        allowOutsideClick: true,
        allowEscapeKey: true,
        didOpen: () => {
          const closeBtn = document.getElementById('swal-close-btn');
          if (closeBtn) {
            closeBtn.onclick = () => Swal.close();
          }
        },
        customClass: {
          popup: "connect-account-popup",
          confirmButton: "connect-account-confirm-btn",
          cancelButton: "connect-account-cancel-btn",
          htmlContainer: "connect-account-html-container",
        },
      });
      
      if (result.isConfirmed) {
        onNavigateToSocial()
        // navigate(`/dashboard?tab=social`);
      }
      return false;
    } catch (err) {
      onNavigateToSocial()
      // navigate(`/dashboard?tab=social`);
      return false;
    }
  };

  const platforms = [
    {
      value: "linkedin",
      label: "LinkedIn",
      color: "bg-blue-600",
      directPublish: true,
      charLimit: 3000,
    },
    {
      value: "twitter",
      label: "X",
      color: "bg-gray-900",
      directPublish: true,
      charLimit: 280,
    },
    {
      value: "instagram",
      label: "Instagram",
      color: "bg-pink-600",
      directPublish: true,
      charLimit: 2200,
    },
    {
      value: "facebook",
      label: "Facebook",
      color: "bg-blue-700",
      directPublish: true,
      charLimit: 63206,
    },
  ];

  // Platform logo components
  const PlatformIcons = {
    linkedin: () => (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    twitter: () => (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    instagram: () => (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    facebook: () => (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  };

  // Initialize content when modal opens
  useEffect(() => {
    if (isOpen && content) {
      setCurrentContent(content);
      
      // Strip hashtags from content text since they're shown separately
      const contentWithoutHashtags = stripProvidedHashtags(
        formatContentForUI(content.content_text), 
        content.hashtags || []
      );
      
      setEditedContent(contentWithoutHashtags);
      setEditedHashtags(content.hashtags || []);
      // Show scheduled info if already scheduled, but don't set up for rescheduling
      const sched =
        publishSuccessMap?.[
          content.type == "scheduled" ? content.content_id : content.id
        ]?.[selectedPlatform];
      if (sched?.isScheduled && sched?.scheduledTime) {
        console.log("sched ------->>>>>>>>>>>", { sched });
        setSelectedPlatform(sched?.platform);
        try {
          const date = new Date(sched.scheduledTime);
          setScheduleDate(date.toISOString().split("T")[0]);
          setScheduleTime(date.toTimeString().slice(0, 5));
        } catch (_) {}
        // Don't set reschedulePostId - we want to create new schedules, not reschedule
        setReschedulePostId(null);
      } else if (content.isScheduled && content.scheduled_time) {
        // Fallback: check content.isScheduled flag and content.scheduled_time
        console.log("content 1111111------->>>>>>>>>>>", { content });
        setSelectedPlatform(content.platform);
        try {
          const date = new Date(content.scheduled_time);
          setScheduleDate(date.toISOString().split("T")[0]);
          setScheduleTime(date.toTimeString().slice(0, 5));
        } catch (_) {}
        setReschedulePostId(null);
      } else {
        setReschedulePostId(null);
        setScheduleDate("");
        setScheduleTime("");
      }
    }
  }, [isOpen, content]);
console.log("CurrentContent",currentContent)
  // Fetch social connections when modal opens
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchSocialConnections();
      fetchAyrshareData();
    }
  }, [isOpen, isAuthenticated]);

  // Check if a platform is connected
  const isPlatformConnected = (platform) => {
    const normalize = (p) =>
      typeof p === "string"
        ? p.toLowerCase()
        : (p?.value || p || "").toString().toLowerCase();
    
    // Check Ayrshare connections first
    const ayrshareFound = ayrshareConnections.find(
      (c) => normalize(c.platform) === normalize(platform) && c.is_active
    );
    
    if (ayrshareFound) return true;
    
    // Check social connections
    const found = socialConnections.find(
      (c) => normalize(c.platform) === normalize(platform)
    );
    
    return Boolean(found?.is_connected ?? found?.connected);
  };

  // Update user profile when platform changes
  useEffect(() => {
    if (ayrshareConnections.length > 0) {
      updateUserProfile(ayrshareConnections);
    } else if (socialConnections.length > 0) {
      updateUserProfile(socialConnections);
    } else if (isAuthenticated) {
      // Set default profile when no connections are available
      setUserProfile({
        name: user?.name || user?.username || "User",
        title: "Social Media User",
        company: "Building Simbli's AI Agent Suite",
        platform: selectedPlatform,
        profileImage: null,
        isConnected: false,
      });
    }
  }, [
    selectedPlatform,
    socialConnections,
    ayrshareConnections,
    isAuthenticated,
    user,
  ]);

  // Refresh Ayrshare connections when profile is loaded
  useEffect(() => {
    if (ayrshareProfile) {
      loadAyrshareConnections();
    }
  }, [ayrshareProfile]);

  // Debug publishSuccessMap changes and scroll to bottom
  const modalBodyRef = useRef(null);
  
  const scrollToBottom = () => {
    if (modalBodyRef.current) {
      modalBodyRef.current.scrollTo({
        top: modalBodyRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };
  
  useEffect(() => {
    console.log("publishSuccessMap changed:", publishSuccessMap);
    
    // Scroll to bottom when publishSuccessMap changes
    if (publishSuccessMap && Object.keys(publishSuccessMap).length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 200); // Small delay to ensure content is rendered
    }
  }, [publishSuccessMap]);

  // Helper function to format date with uppercase AM/PM
  const formatDateTimeWithUppercaseAMPM = (date, options = {}) => {
    const formatted = date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "full",
      timeStyle: "short",
      ...options,
    });
    // Replace lowercase am/pm with uppercase AM/PM
    return formatted.replace(/\b(am|pm)\b/g, (match) => match.toUpperCase());
  };

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll
      document.body.style.overflow = "hidden";
      // Focus on modal for accessibility
      const modalElement = document.querySelector(
        '[data-modal="edit-content"]'
      );
      if (modalElement) {
        modalElement.focus();
      }
    } else {
      // Restore body scroll
      document.body.style.overflow = "unset";
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Get current platform character limit
  const getCurrentCharLimit = () => {
    const platform = platforms.find((p) => p.value === selectedPlatform);
    return platform?.charLimit || 3000;
  };

  // Get current character count (including hashtags)
  const getCurrentCharCount = () => {
    let count = editedContent.length;
    
    // Add hashtags count if there are any
    if (editedHashtags && editedHashtags.length > 0) {
      // Convert hashtags array to string with spaces: "#tag1 #tag2 #tag3"
      // Each hashtag includes the hash symbol and a space after it
      const hashtagsString = editedHashtags
        .map(hashtag => hashtag.trim()) // Remove any extra whitespace
        .join(' '); // Join with spaces
      
      count += hashtagsString.length;
    }
    
    return count;
  };

  // Check if content exceeds limit
  const isOverLimit = () => {
    return getCurrentCharCount() > getCurrentCharLimit();
  };

  // Get character count color
  const getCharCountColor = () => {
    const count = getCurrentCharCount();
    const limit = getCurrentCharLimit();
    const percentage = (count / limit) * 100;

    if (percentage >= 100) return "text-red-600";
    if (percentage >= 80) return "text-yellow-600";
    return "text-gray-500";
  };

  // Auto-convert content when switching platforms
  const handlePlatformSwitch = async (newPlatform) => {
    if (!currentContent || converting) return;

    setConverting(true);
    setConversionMessage("");

    try {
      const response = await autoConvertPlatformApi(
        (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
          ? currentContent?.content_id
          : currentContent?.id,
        newPlatform
      );

      if (response.data.conversion_applied) {
        // Update content with converted version
        const convertedContent = response.data.converted_content;
        const convertedHashtags = response.data.converted_hashtags || [];
        
        // Strip hashtags from content text since they're shown separately
        const contentWithoutHashtags = stripProvidedHashtags(convertedContent, convertedHashtags);
        
        setEditedContent(contentWithoutHashtags);
        setEditedHashtags(convertedHashtags);
        setConversionMessage(
          ` Content optimized for ${
            newPlatform === "twitter"
              ? "X"
              : newPlatform.charAt(0).toUpperCase() + newPlatform.slice(1)
          }!`
        );
      } else {
        // Content was restored or no conversion needed
        const convertedContent = response.data.converted_content;
        const convertedHashtags = response.data.converted_hashtags || [];
        
        // Strip hashtags from content text since they're shown separately
        const contentWithoutHashtags = stripProvidedHashtags(convertedContent, convertedHashtags);
        
        setEditedContent(contentWithoutHashtags);
        setEditedHashtags(convertedHashtags);
      //   setConversionMessage(
      //     ` Original content restored for ${
      //       newPlatform === "twitter"
      //         ? "X"
      //         : newPlatform.charAt(0).toUpperCase() + newPlatform.slice(1)
      //     }`
      //   );
      }

      // Clear message after 3 seconds
      setTimeout(() => setConversionMessage(""), 3000);
    } catch (error) {
      console.error("Platform conversion error:", error);
      setConversionMessage(
        " Failed to convert content. Using original content."
      );
      setTimeout(() => setConversionMessage(""), 3000);
    } finally {
      setConverting(false);
    }
  };

  // Remove any hashtags present in the provided hashtags array from the given text
  // Handles "#Tag", "# Tag", and standalone "Tag" occurrences.
  const stripProvidedHashtags = (text, hashtags) => {
    if (!text) return text;
    const tags = Array.isArray(hashtags)
      ? hashtags
          .map((h) => String(h || "").replace(/^#\s*/, ""))
          .filter((t) => t.length > 0)
      : [];
    if (tags.length === 0) return text;

    let out = String(text);
    tags.forEach((tag) => {
      const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      
      // Remove with hash (e.g., "#Tag" or "# Tag")
      out = out.replace(new RegExp(`#\\s*${escaped}\\b`, "gi"), "");
      
      // Remove standalone token when it appears as a separate word/line
      // out = out.replace(new RegExp(`(^|\\s)${escaped}\\b`, "g"), "$1");
    });

    // Normalize spaces and blank lines after removals
    out = out
      .replace(/[\t ]+/g, " ")
      .replace(/^\s*$/gm, "")
      .replace(/\n{3,}/g, "\n\n");
    
    return out.trim();
  };

  // Helper functions
  // Helper functions
  const formatContentForUI = (contentText) => {
    if (!contentText) return "No content available";

    // Remove all markdown formatting except line breaks and lists
    let result = contentText
      .replace(/\*\*([^*]+)\*\*/g, "$1") // Remove bold
      .replace(/\*([^*]+)\*/g, "$1"); // Remove italic

    // Remove hashtags from content text (they will be shown separately in hashtags section)
    result = result.replace(/#[a-zA-Z0-9_]+/g, "");

    // --- CHANGED: merge "2.\nText" into "2. Text"
    result = result.replace(/(\d+)\.\s*\n\s*([^\n]+)/g, "$1. $2"); // CHANGED

    // Keep line breaks and list formatting
    result = result.replace(/(\d+\.\s+[^,]*?),\s*(?=\d+\.)/g, "$1\n");
    result = result.replace(/(\d+\.\s+)/g, "\n$1");
    result = result.replace(/(\d+\.\s+[^.]*\.)\s*([A-Z])/g, "$1\n$2");
    result = result.replace(/(•\s+[^•]*?),\s*(?=•)/g, "$1\n");
    result = result.replace(/([a-z]):\s*(•)/g, "$1:\n$2");
    result = result.trim();
    result = result.replace(/\n{3,}/g, "\n\n");

    return result;
  };

  const formatContentForSocialMedia = (contentText) => {
    if (!contentText) return "No content available";

    let processedContent = contentText
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1");

    // Remove hashtags from content text (they will be shown separately in hashtags section)
    processedContent = processedContent.replace(/#[a-zA-Z0-9_]+/g, "");

    let result = processedContent;

    // --- CHANGED: merge "2.\nText" into "2. Text"
    result = result.replace(/(\d+)\.\s*\n\s*([^\n]+)/g, "$1. $2"); // CHANGED

    result = result.replace(/(\d+\.\s+[^,]*?),\s*(?=\d+\.)/g, "$1\n\n");
    result = result.replace(/(\d+\.\s+)/g, "\n\n$1");
    result = result.replace(/(\d+\.\s+[^.]*\.)\s*([A-Z])/g, "$1\n\n$2");
    result = result.replace(/(•\s+[^•]*?),\s*(?=•)/g, "$1\n");
    result = result.replace(/([a-z]):\s*(•)/g, "$1:\n$2");
    result = result.trim();
    result = result.replace(/\n{3,}/g, "\n\n");

    return result;
  };

  // Handler functions
  const handleSaveChanges = async () => {
    if (!currentContent || saving) {
      console.error("No current content to save or already saving");
      return;
    }

    setSaving(true);
    console.log(
      "Saving changes for content:",
      (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
        ? currentContent?.content_id
        : currentContent?.id
    );
    console.log("Edited content:", editedContent);
    console.log("Edited hashtags:", editedHashtags);
    console.log("Current content 1111111111111:", currentContent);
    console.log("selectedPlatform content 1111111111111:", selectedPlatform);

    try {
      // Check if this is the original platform
      // If original_platform is null (for existing records), treat current platform as original
      const isOriginalPlatform = content?.original_platform === selectedPlatform || 
                                 (content?.original_platform === null);
      
      console.log("Is original platform:", isOriginalPlatform);
      console.log("Original platform:", content?.original_platform);
      console.log("Current platform:", selectedPlatform);

      let response = null;

      // If this is the original platform, update the main content table
      if (isOriginalPlatform) {
        console.log("Updating original content in alfred_content table");
        response = await updateContentApi(
          (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
          ? currentContent?.content_id
          : currentContent?.id,
        editedContent,
        editedHashtags,
          selectedPlatform,
          content?.original_platform === null ? selectedPlatform : null
      );
      console.log("Save response:", response.data);
        
        // If original_platform was null, we should also update it to set the current platform as original
        if (content?.original_platform === null) {
          console.log("Setting original_platform to:", selectedPlatform);
          // The updateContentApi should handle updating the original_platform field
        }
      } else {
        console.log("Skipping alfred_content update - not original platform");
      }

      // Always upsert draft version for the new system
      try {
        // Prepare content data to send
        const contentData = {
          content_text: editedContent,
          hashtags: editedHashtags,
          image_url: currentContent?.image_url || null,
          video_url: currentContent?.video_url || null,
          is_video: currentContent?.is_video || false,
          userInput: currentContent?.userInput || null,
          image_description: currentContent?.image_description || null,
          platform_specific_tips: currentContent?.platform_specific_tips || null,
          prompt: currentContent?.prompt || null,
          domain: currentContent?.domain || null,
          session_id: currentContent?.session_id || null
        };

        const draftVersionResponse = await upsertDraftVersionApi(
          (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
            ? currentContent?.content_id
            : currentContent?.id,
          selectedPlatform,
          contentData
        );
        console.log("Draft version upserted:", draftVersionResponse.data);
        console.log("Action performed:", draftVersionResponse.data.action); // "created" or "updated"
      } catch (draftError) {
        console.error("Error upserting draft version:", draftError);
        // Don't block the main save operation if draft version upsert fails
      }

      // Update the content in parent component
      if (onContentUpdate) {
        // Use the response from updateContentApi if available, otherwise use currentContent
        onContentUpdate(response?.data || currentContent);
      } else {
        console.error("onContentUpdate function not provided");
      }

      onClose();
    } catch (error) {
      console.error("Error saving changes:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!currentContent || publishing) return;

    // Check if already published
    const existingSuccess =
      publishSuccessMap[
        (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
          ? currentContent?.content_id
          : currentContent?.id
      ]?.[selectedPlatform];
    if (existingSuccess?.success) {
      console.log(
        "Content already published for this platform:",
        selectedPlatform
      );
      return;
    }

    setPublishing(true);

    try {
      const ok = await promptConnectIfNeeded(selectedPlatform);
      if (!ok) {
        setPublishing(false);
        return;
      }

      const formattedContent = {
        ...currentContent,
        content_text: formatContentForSocialMedia(editedContent),
        hashtags: editedHashtags,
      };

      // Always add hashtags to the content text for Ayrshare (remove any existing hashtags first)
      if (editedHashtags && editedHashtags.length > 0) {
        const normalizedTags = editedHashtags
          .map((h) => (String(h).startsWith("#") ? String(h) : `#${String(h)}`))
          .join(" ");

        // Remove any existing hashtags from content text to avoid duplicates
        const contentWithoutHashtags = formattedContent.content_text
          .replace(/#[a-zA-Z0-9_]+/g, "")
          .trim();

        // Add hashtags to the cleaned content
        // formattedContent.content_text = `${contentWithoutHashtags}\n\n${normalizedTags}`;
        formattedContent.content_text = `${contentWithoutHashtags}`;
        console.log(
          "Formatted content for Ayrshare content text:",
          formattedContent.content_text
        );
      }

      // Try Ayrshare publishing first if profile is available
      if (ayrshareProfile && ayrshareConnections.length > 0) {
        try {
          // Collect media URLs from currentContent
          const mediaUrls = getMediaUrlsFromContent(currentContent);
          // const mediaUrls = ["https://fastly.picsum.photos/id/354/1080/1080.jpg?hmac=y_pY2-y14V1kLVR-mYZvo3EguRMAWgZ7ssXgcIWdbGI"];

          console.log("mediaUrls", { mediaUrls });
          console.log("Attempting Ayrshare publishing:", {
            profile_key: ayrshareProfile.profile_key,
            platform: selectedPlatform,
            connections: ayrshareConnections.length,
            mediaUrls: mediaUrls,
            currentContent: {
              id:
                (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                  ? currentContent?.content_id
                  : currentContent?.id,
              content_text: formattedContent.content_text,
              hashtags: formattedContent.hashtags,
            },
          });

          const ayrshareResponse = await postToAyrshare(
            (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
              ? currentContent?.content_id
              : currentContent?.id,
            ayrshareProfile.profile_key,
            formattedContent.content_text,
            mediaUrls.length > 0 ? mediaUrls : null, // media parameter with image/video URLs
            [selectedPlatform], // platforms parameter
            formattedContent.hashtags // hashtags parameter
          );

          console.log("Ayrshare publish response:", ayrshareResponse);

          // Check for success in the response structure
          const isSuccess =
            ayrshareResponse.data?.status === "success" ||
            ayrshareResponse.data?.success === true ||
            ayrshareResponse.status === "success";

          if (isSuccess) {
            // Extract post URL from platforms object
            const platformData =
              ayrshareResponse.data?.platforms?.[selectedPlatform] ||
              ayrshareResponse.platforms?.[selectedPlatform];
            const postUrl =
              platformData?.postUrl ||
              ayrshareResponse.data?.post_url ||
              ayrshareResponse.data?.postUrl;

            console.log("Setting publish success map for Ayrshare:", {
              contentId:
                (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                  ? currentContent?.content_id
                  : currentContent?.id,
              platform: selectedPlatform,
              response: ayrshareResponse.data,
              platformData: platformData,
              postUrl: postUrl,
            });

            setPublishSuccessMap((prev) => {
              const newMap = {
                ...prev,
                [(currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                  ? currentContent?.content_id
                  : currentContent?.id]: {
                  ...prev[
                    (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                      ? currentContent?.content_id
                      : currentContent?.id
                  ],
                  [selectedPlatform]: {
                    success: true,
                    message: "Content published successfully via Ayrshare!",
                    postUrl: postUrl,
                    platform: selectedPlatform,
                    contentId:
                      (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                        ? currentContent?.content_id
                        : currentContent?.id,
                    ayrsharePublished: true,
                    testMode: ayrshareResponse.data?.test_mode || false,
                  },
                },
              };
              console.log("New publish success map:", newMap);
              return newMap;
            });
            // Close the modal after successful publish
            onClose();
          } else {
            console.log("Ayrshare publish not successful:", ayrshareResponse);
          }
        } catch (ayrshareError) {
          console.error("Ayrshare publishing error:", ayrshareError);
        }
      } else {
        console.log("Ayrshare not available:", {
          hasProfile: !!ayrshareProfile,
          connectionsCount: ayrshareConnections.length,
        });
      }
    } catch (error) {
      console.error("Publishing error:", error);

      if (
        error.response?.status === 400 &&
        error.response.data.detail?.includes("not connected")
      ) {
        // LinkedIn not connected - handle silently
      } else if (
        error.response?.status === 401 &&
        error.response.data.detail?.includes("token expired")
      ) {
        // Token expired - handle silently
      } else {
        // Fallback to manual publishing
        try {
          const fallbackResponse = await getPublishUrlApi(selectedPlatform);
          const publishUrl = fallbackResponse.data.publish_url;
          window.open(publishUrl, "_blank");
        } catch (fallbackError) {
          console.error("Fallback publishing error:", fallbackError);
        }
      }
    } finally {
      setPublishing(false);
    }
  };

  const handleSchedule = async () => {
    if (!currentContent || scheduling || !scheduleDate || !scheduleTime) return;
    // Enforce future-only scheduling
    try {
      const selected = new Date(`${scheduleDate}T${scheduleTime}`);
      if (!(selected.getTime() > Date.now())) {
        // alert("Please choose a future date and time.");
        return;
      }
    } catch (_) {
      return;
    }

    // Check if already scheduled

    setScheduling(true);

    try {
      const ok = await promptConnectIfNeeded(selectedPlatform);
      if (!ok) {
        setScheduling(false);
        return;
      }

      // Convert local time to UTC for proper scheduling
      // const localDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
      // const utcDateTime = new Date(
      //   localDateTime.getTime() - localDateTime.getTimezoneOffset() * 60000
      // );
      // const scheduledDateTime = utcDateTime.toISOString();

      // console.log(
      //   `EditContentModal - Local time: ${localDateTime.toLocaleString()} (${
      //     Intl.DateTimeFormat().resolvedOptions().timeZone
      //   })`
      // );
      // console.log(`EditContentModal - UTC time: ${utcDateTime.toISOString()}`);

      const formattedContent = {
        ...currentContent,
        content_text: formatContentForSocialMedia(editedContent),
        hashtags: editedHashtags,
      };

      // Always add hashtags to the content text for Ayrshare (remove any existing hashtags first)
      if (editedHashtags && editedHashtags.length > 0) {
        const normalizedTags = editedHashtags
          .map((h) => (String(h).startsWith("#") ? String(h) : `#${String(h)}`))
          .join(" ");

        // Remove any existing hashtags from content text to avoid duplicates
        const contentWithoutHashtags = formattedContent.content_text
          .replace(/#[a-zA-Z0-9_]+/g, "")
          .trim();

        // Add hashtags to the cleaned content
        // formattedContent.content_text = `${contentWithoutHashtags}\n\n${normalizedTags}`;
        formattedContent.content_text = `${contentWithoutHashtags}`;
        console.log(
          "Formatted content for Ayrshare content text:",
          formattedContent.content_text
        );
      }
      const { local: localDateTime, utc: scheduleDateTimeUTC } =
        convertLocalTimeToUTC(scheduleDate, scheduleTime);
      // Try Ayrshare scheduling first if profile is available
      if (ayrshareProfile && ayrshareConnections.length > 0) {
        try {
          let ayrshareResponse;

          if (reschedulePostId) {
            console.log("Updating scheduled post with ID:", reschedulePostId);
            ayrshareResponse = await updateScheduledPost(
              (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                ? currentContent?.content_id
                : currentContent?.id,
              reschedulePostId,
              ayrshareProfile.profile_key,
              localDateTime, // Send local time to backend for proper timezone conversion
              Intl.DateTimeFormat().resolvedOptions().timeZone
            );
          } else {
            // Collect media URLs from currentContent
            const mediaUrls = getMediaUrlsFromContent(currentContent);
            // const mediaUrls = ["https://fastly.picsum.photos/id/354/1080/1080.jpg?hmac=y_pY2-y14V1kLVR-mYZvo3EguRMAWgZ7ssXgcIWdbGI"];

            ayrshareResponse = await scheduleAyrsharePost(
              (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                ? currentContent?.content_id
                : currentContent?.id,
              ayrshareProfile.profile_key,
              formattedContent.content_text,
              localDateTime, // Send local time to backend for proper timezone conversion
              mediaUrls.length > 0 ? mediaUrls : null,
              [selectedPlatform], // platforms parameter
              formattedContent.hashtags // hashtags parameter
            );
          }

          console.log("Ayrshare schedule response:", ayrshareResponse);

          // Check for success in the response structure
          const isScheduleSuccess =
            ayrshareResponse.data?.status === "success" ||
            ayrshareResponse.data?.status === "pending" ||
            ayrshareResponse.data?.success === true ||
            ayrshareResponse.status === "success" ||
            ayrshareResponse.status === "pending" ||
            (ayrshareResponse.data?.message &&
              ayrshareResponse.data.message.includes("scheduled successfully"));

          if (isScheduleSuccess) {
            const postId =
              ayrshareResponse.data?.ayrshare_schedule_id ||
              ayrshareResponse.data?.id ||
              ayrshareResponse.data?.post_id ||
              ayrshareResponse.id;
            const ayrsharePostDetails =
              ayrshareResponse.data?.ayrshare_post_details ||
              ayrshareResponse.data ||
              ayrshareResponse;

            console.log("Setting schedule success map for Ayrshare:", {
              contentId:
                (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                  ? currentContent?.content_id
                  : currentContent?.id,
              platform: selectedPlatform,
              response: ayrshareResponse.data,
              postId: postId,
            });

            setPublishSuccessMap((prev) => {
              const newMap = {
                ...prev,
                [(currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                  ? currentContent?.content_id
                  : currentContent?.id]: {
                  ...prev[
                    (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                      ? currentContent?.content_id
                      : currentContent?.id
                  ],
                  [selectedPlatform]: {
                    success: true,
                    message:
                      ayrshareResponse.data?.message ||
                      "Content scheduled successfully via Ayrshare!",
                    postUrl: null,
                    platform: selectedPlatform,
                    contentId:
                      (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                        ? currentContent?.content_id
                        : currentContent?.id,
                    isScheduled: true,
                    scheduledTime: localDateTime.toISOString(),
                    testMode: ayrshareResponse.data?.test_mode || false,
                    schedulerError: null,
                    // Store complete Ayrshare post details from backend
                    ayrsharePostId: postId,
                    ayrsharePostDetails: ayrsharePostDetails,
                    profileKey: ayrshareProfile.profile_key, // Store profile key for unscheduling
                    // Keep scheduleId for backward compatibility
                    scheduleId: postId,
                  },
                },
              };
              console.log("New schedule success map:", newMap);
              return newMap;
            });
            // Close the modal after successful scheduling
            onClose();

            setShowScheduleModal(false);
            setScheduleDate("");
            setScheduleTime("");
            setReschedulePostId(null);
          } else {
            console.log("Ayrshare schedule not successful:", ayrshareResponse);
          }
        } catch (ayrshareError) {
          console.error("Ayrshare scheduling error:", ayrshareError);
        }
      } else {
        console.log("Ayrshare not available for scheduling:", {
          hasProfile: !!ayrshareProfile,
          connectionsCount: ayrshareConnections.length,
        });
      }
    } catch (error) {
      console.error("Scheduling error:", error);
    } finally {
      setScheduling(false);
    }
  };

  const openScheduleModal = async () => {
    const ok = await promptConnectIfNeeded(selectedPlatform);
    if (!ok) return;

    const sched =
      publishSuccessMap?.[
        (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
          ? currentContent?.content_id
          : currentContent?.id
      ]?.[selectedPlatform];
    console.log("sched ------->>>>>>>>>>>", { sched });
    // Always create a new schedule, never reschedule
    setReschedulePostId(null);
    setScheduleDate("");
    setScheduleTime("");
    setShowScheduleModal(true);
    const schedEntry =
      publishSuccessMap?.[
        (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
          ? currentContent?.content_id
          : currentContent?.id
      ]?.[selectedPlatform];
    console.log("schedEntry ------->>>>>>>>>>>", { schedEntry });
    if (schedEntry?.isScheduled && schedEntry?.scheduledTime) {
      try {
        const date = new Date(schedEntry.scheduledTime);
        setScheduleDate(date.toISOString().split("T")[0]);
        setScheduleTime(date.toTimeString().slice(0, 5));
      } catch (_) {}
      setReschedulePostId(
        schedEntry.scheduleId || schedEntry.ayrsharePostId || null
      );
    } else {
      setReschedulePostId(null);
    }
    try {
      const response = await getSuggestedTimesApi();
      setSuggestedTimes(response.data.suggested_times);
    } catch (error) {
      console.error("Failed to load suggested times:", error);
    }
  };

  // Confirmation modal handlers
  const showConfirmation = (action) => {
    console.log("action 33333333", action);
    let message = "";
    let title = "";
    let confirmButtonText = "";
    let cancelButtonText = "";
    
    switch (action) {
      case "publish":
        title = "Confirm Immediate Publish";
        message = "Are You Ready to Publish This Post Immediately?";
        confirmButtonText = "Publish Now";
        cancelButtonText = "Cancel";
        break;
      case "schedule":
        title = "Confirm Schedule Post";
        message = "Are You Ready to Send This Post to the Scheduler?";
        confirmButtonText = "Schedule Post";
        cancelButtonText = "Cancel";
        break;
      case "unschedule":
        title = "Confirm Unschedule";
        message = "Are you sure you want to unschedule this content?";
        confirmButtonText = "Unschedule";
        cancelButtonText = "Cancel";
        break;
      default:
        title = "Confirm Action";
        message = "Are you sure you want to proceed?";
        confirmButtonText = "Confirm";
        cancelButtonText = "Cancel";
    }
    setConfirmationAction(action);
    setConfirmationMessage(message);
    setConfirmationTitle(title);
    setConfirmationConfirmText(confirmButtonText);
    setConfirmationCancelText(cancelButtonText);
    setShowConfirmationModal(true);
    console.log("message 33333333", message);
  };

  const handleConfirmation = async () => {
    if (!confirmationAction) return;

    setShowConfirmationModal(false);

    switch (confirmationAction) {
      case "publish":
        await handlePublish();
        break;
      case "schedule":
        await openScheduleModal();
        break;
      case "unschedule":
        await handleUnschedule();
        break;
    }

    setConfirmationAction(null);
    setConfirmationMessage("");
  };

  const handleCancelConfirmation = () => {
    setShowConfirmationModal(false);
    setConfirmationAction(null);
    setConfirmationMessage("");
    setConfirmationTitle("");
    setConfirmationConfirmText("");
    setConfirmationCancelText("");
  };

  const handleUnschedule = async () => {
    try {
      const sched =
        publishSuccessMap?.[
          (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
            ? currentContent?.content_id
            : currentContent?.id
        ]?.[selectedPlatform];
      const scheduledPostId = sched?.scheduledPostId;
      const ayrsharePostId = sched?.ayrsharePostId;
      const profileKey = ayrshareProfile?.profile_key;

      console.log("Unschedule - Entry:", sched);
      console.log("Unschedule - Post ID:", scheduledPostId || ayrsharePostId);
      console.log("Unschedule - Profile Key:", profileKey);

      if (!scheduledPostId && !ayrsharePostId) {
        console.log("No scheduled post ID found for unscheduling");
        return;
      }

      // Try Ayrshare unscheduling first if we have the required data
      if (ayrsharePostId && profileKey) {
        try {
          console.log("Attempting Ayrshare unschedule:", {
            ayrsharePostId,
            profileKey,
          });
          await unscheduleAyrsharePost(
            (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
              ? currentContent?.content_id
              : currentContent?.id,
            ayrsharePostId,
            profileKey
          );
          console.log("Ayrshare unschedule successful");
        } catch (ayrshareError) {
          console.error(
            "Ayrshare unschedule failed, trying fallback:",
            ayrshareError
          );
          // Fallback to original method
          if (scheduledPostId) {
            await unschedulePostApi(scheduledPostId);
          }
        }
      } else if (scheduledPostId) {
        // Use original unschedule method
        await unschedulePostApi(scheduledPostId);
      }

      // Remove the platform entry to revert UI to initial state
      setPublishSuccessMap((prev) => {
        const next = { ...prev };
        const perContent = {
          ...(next[
            (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
              ? currentContent?.content_id
              : currentContent?.id
          ] || {}),
        };
        delete perContent[selectedPlatform];
        if (Object.keys(perContent).length === 0) {
          delete next[
            (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
              ? currentContent?.content_id
              : currentContent?.id
          ];
        } else {
          next[
            (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
              ? currentContent?.content_id
              : currentContent?.id
          ] = perContent;
        }
        return next;
      });
      setShowScheduleModal(false);
      setReschedulePostId(null);
      onClose();
    } catch (error) {
      console.error("Unschedule error:", error);
    }
  };

  const handleDeleteDraft = () => {
    if (!currentContent) return;
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentContent) return;

    setDeletingDraft(true);
    try {
      // Delete the main content
      await removeDraftApi(
        (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
          ? currentContent?.content_id
          : currentContent?.id
      );

      // If this is a draft version, also delete the draft version record
      if (currentContent?.type === "draft-version") {
        try {
          await removeDraftVersionApi(currentContent?.id);
          console.log("Draft version deleted successfully");
          
          // Also update localStorage to set original_platform to null
          // if this draft was the original platform for the content
          try {
            const savedMessages = localStorage.getItem("simbli_chat_messages");
            if (savedMessages) {
              const messages = JSON.parse(savedMessages);
              const updatedMessages = messages.map((msg) => {
                if (msg.type === "ai" && msg.content) {
                  const contentIdMatch =  msg.content.id == currentContent.content_id
                  if (contentIdMatch && msg.content.original_platform === selectedPlatform) {
                    return {
                      ...msg,
                      content: {
                        ...msg.content,
                        original_platform: null
                      }
                    };
                  }
                }
                return msg;
              });
              
              localStorage.setItem("simbli_chat_messages", JSON.stringify(updatedMessages));
              
              // If this component has access to setMessages, update it
              if (messages !== updatedMessages) {
                // Update the context with the updated messages
                setMessages(updatedMessages);
                
                // Trigger a re-fetch or update by notifying parent
                if (onContentUpdate) {
                  onContentUpdate(null); // This signals deletion
                }
              }
            }
          } catch (localStorageError) {
            console.error("Error updating localStorage:", localStorageError);
            // Don't block the delete operation if localStorage update fails
          }
          
        } catch (draftVersionError) {
          console.error("Error deleting draft version:", draftVersionError);
          // Don't block the main delete operation if draft version delete fails
        }
      }

      // Remove this draft id from localStorage saved list used by ChatInterface
      try {
        const deletedId = String(
          (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
            ? currentContent?.content_id
            : currentContent?.id
        );
        const raw = localStorage?.getItem("simbli_saved_draft_ids");
        if (raw) {
          const ids = JSON?.parse(raw);
          if (Array.isArray(ids)) {
            const next = ids.map((x) => String(x)).filter((x) => x !== deletedId);
            if (next.length > 0) {
              localStorage?.setItem("simbli_saved_draft_ids", JSON?.stringify(next));
            } else {
              localStorage?.removeItem("simbli_saved_draft_ids");
            }
          }
        }
      } catch (_) {}

      // Close the delete modal
      setShowDeleteModal(false);
      setDeletingDraft(false);

      // Show success message using a simple alert for now
      // You can replace this with a toast notification if you have one
      // alert("Your draft has been deleted successfully.");

      // Close the modal and refresh the parent component
      onClose();
      if (onContentUpdate) {
        onContentUpdate(null); // Signal to parent that content was deleted
      }
    } catch (error) {
      console.error("Delete draft error:", error);
      setDeletingDraft(false);
      // alert("Failed to delete the draft. Please try again.");
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingDraft(false);
  };

  const handleSuggestedTimeClick = (suggestedTime) => {
    const date = new Date(suggestedTime);
    const localISODate = date.toISOString().split("T")[0];
    const localISOTime = date.toTimeString().slice(0, 5);

    setScheduleDate(localISODate);
    setScheduleTime(localISOTime);
    setSelectedSuggestedTime(suggestedTime);
  };

  const handleRegenerateImage = async (contentId) => {
    if (regenerating) return;
    
    // Check if user is blocked from generating images
    try {
      const imageLimitResponse = await checkImageLimitApi();
      const { image_limit_reached } = imageLimitResponse.data?.data;

      if (image_limit_reached) { // Testing popup - change back to image_limit_reached
        // Get plan information from chat block status API for the popup (same as chat block)
        const blockStatusResponse = await checkChatBlockStatusApi();
        const { available_plans, plan } = blockStatusResponse.data?.data;
        
        setChatBlocked(true);
        setAvailablePlans(available_plans || []);
        setPlan(plan);
        setShowPricingPopup(true);
        return; // Stop execution if user is blocked
      }
    } catch (error) {
      console.error("Error checking image limit status:", error);
      // Continue with normal flow if API call fails
    }

    setRegenerating(true);
    try {
      const response = await generateImageApi(contentId);

      // Update the content in parent component
      const updatedContent = {
        ...currentContent,
        image_url: response.data.image_url,
        isRegenerated: true,
      };
      onContentUpdate(updatedContent);
      
      // Update local content state to reflect the change immediately
      setCurrentContent(updatedContent);
    } catch (error) {
      console.error("Error regenerating image:", error);
    } finally {
      setRegenerating(false);
    }
  };
  console.log("sele", selectedHour);
  const handleImageUpload = async (file) => {
    console.log("ImageUpload")
    if (!currentContent) return;
    setUploading(true);
    // Check file size based on user email
    const isSpecialUser = isSpecialUserForLargeUploads(user?.email);
    console.log("isSpecialUser",isSpecialUser)
    const maxSize = isSpecialUser ? 100 * 1024 * 1024 : 15 * 1024 * 1024; // 25MB for special users, 5MB for others
    const maxSizeMB = isSpecialUser ? 100 : 15;
    
    if (file.size > maxSize) {
      alert(
        `File size must be less than ${maxSizeMB}MB. Your file is ${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)}MB.`
      );
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      // const response = await uploadImageApi(
      //   (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
      //     ? currentContent?.content_id
      //     : currentContent?.id,
      //   formData
      // );

      const response = await uploadMediaApi(
        (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
          ? currentContent?.content_id
          : currentContent?.id,
        formData
      );

      // Update the content in parent component
      const updatedContent = {
        ...currentContent,
        image_url: response.data.image_url,
        video_url: null, // Clear video when uploading image
      };
      onContentUpdate(updatedContent);

      // Update local content state to reflect the change immediately
      setCurrentContent(updatedContent);
      setUploading(false);
    } catch (error) {
      console.error("Error uploading image:", error);
      setUploading(false);
    }
  };

  const handleVideoUpload = async (file) => {
    console.log("videouploade")
    if (!currentContent) return;
    setUploading(true);

    // Check file size based on user email
    const isSpecialUser = isSpecialUserForLargeUploads(user?.email);
     console.log("isSpecialUser",isSpecialUser)
    const maxSize = isSpecialUser ? 100 * 1024 * 1024 : 15 * 1024 * 1024; // 25MB for special users, 5MB for others
    const maxSizeMB = isSpecialUser ? 100 : 15;
    
    if (file.size > maxSize) {
      alert(
        `File size must be less than ${maxSizeMB}MB. Your file is ${(
          file.size /
          (1024 * 1024)
        ).toFixed(2)}MB.`
      );
      setUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      // const response = await uploadVideoApi(
      //   (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
      //     ? currentContent?.content_id
      //     : currentContent?.id,
      //   formData
      // );

      const response = await uploadMediaApi(
        (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
          ? currentContent?.content_id
          : currentContent?.id,
        formData
      );

      // Update the content in parent component
      const updatedContent = {
        ...currentContent,
        video_url: null,
        image_url: response.data.image_url, // Clear image when uploading video
      };
      onContentUpdate(updatedContent);

      // Update local content state to reflect the change immediately
      setCurrentContent(updatedContent);
      setUploading(false);
    } catch (error) {
      console.error("Error uploading video:", error);
      setUploading(false);
    }
  };

  const handleCopyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  // Duplicate functionality handlers
  const handleDuplicate = async () => {
    if (!currentContent) return;
    
    try {
      const contentId = currentContent?.type === "scheduled" || currentContent?.type === "draft-version"
        ? currentContent?.content_id
        : currentContent?.id;
      
      const response = await getAvailablePlatformsForDuplicateApi(contentId);
      setAvailablePlatforms(response.data.available_platforms || []);
      setShowDuplicateModal(true);
    } catch (error) {
      console.error("Error fetching available platforms:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch available platforms for duplication",
      });
    }
  };

  const handlePlatformSelect = async (targetPlatform) => {
    if (!currentContent || duplicating) return;
    
    setDuplicating(true);
    try {
      const contentId = currentContent?.type === "scheduled" || currentContent?.type === "draft-version"
        ? currentContent?.content_id
        : currentContent?.id;
      
      const draftId = currentContent?.type === "draft-version" ? currentContent?.id : currentContent?.draft_id;
      
      const response = await duplicateContentApi(contentId, draftId, targetPlatform);
      
      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Post Duplicated",
          text: `Your content has been copied to ${targetPlatform} successfully!`,
          timer: 4000,
          timerProgressBar: true,
        });
        
        // Close the duplicate modal
        setShowDuplicateModal(false);
        // Optionally refresh the content or navigate
        if (onContentUpdate) {
          // You might want to refresh the content list here
          onContentUpdate(response.data.duplicated_content);
        }
        onClose();
      }
    } catch (error) {
      console.error("Error duplicating content:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.detail || "Failed to duplicate content",
      });
    } finally {
      setDuplicating(false);
    }
  };

  const handleCloseDuplicateModal = () => {
    setShowDuplicateModal(false);
    setAvailablePlatforms([]);
  };

  // Helper function to build full URLs for media
  const buildMediaUrl = (rawUrl) => {
    if (!rawUrl) return "";
    // If already absolute URL, return as is
    if (/^https?:\/\//i.test(rawUrl)) return rawUrl;

    // Ensure leading slash for relative API paths
    const normalizedPath = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;

    // Use direct URL
    const base = `${BASE_URL}`;

    console.log("111111 Building media URL:", {
      rawUrl,
      normalizedPath,
      base,
      finalUrl: `${base}${normalizedPath}`,
    });

    return `${base}${normalizedPath}`;
  };
  // Helper function to extract media URLs from content
  const getMediaUrlsFromContent = (content) => {
    const mediaUrls = [];
    if (content?.image_url) {
      const imageUrl = buildMediaUrl(content.image_url);
      console.log("111111 Image URL transformation:", {
        original: content.image_url,
        processed: imageUrl,
      });
      if (imageUrl) mediaUrls.push(imageUrl);
    }
    if (content?.video_url) {
      const videoUrl = buildMediaUrl(content.video_url);
      console.log("Video URL transformation:", {
        original: content.video_url,
        processed: videoUrl,
      });
      if (videoUrl) mediaUrls.push(videoUrl);
    }
    console.log("111111 Media URLs:", mediaUrls);
    return mediaUrls;
  };

  // Helper function to get platform icon
  const getPlatformIcon = (platform) => {
    const icons = {
      linkedin: linkedinIcon,
      twitter: twitterIcon,
      instagram: instagramIcon,
      facebook: facebookIcon,
    };
    return icons[platform.toLowerCase()] || null;
  };

  const handleOpenMediaPreview = (mediaUrl, mediaType) => {
    setPreviewMediaUrl(mediaUrl);
    setPreviewMediaType(mediaType);
    setShowMediaPreview(true);
  };

  // Handler for closing media preview modal
  const handleCloseMediaPreview = () => {
    setShowMediaPreview(false);
    setPreviewMediaUrl(null);
    setPreviewMediaType(null);
  };

  if (!isOpen || !content) return null;
  const LoadingSpinner = ({ size = "w-4 h-4" }) => (
    <div
      className={`animate-spin rounded-full ${size} border-2 border-[#79DB79] border-t-transparent`}
    ></div>
  );
  return (
    <>
      {/* Markdown Content Styles */}
      <style>{`
        .markdown-content h1 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 0.5rem;
        }
        .markdown-content h2 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }
        .markdown-content h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
        }
        .markdown-content strong {
          font-weight: 700 !important;
          color: #111827 !important;
          font-size: inherit;
          padding: 0.125rem 0.25rem !important;
          border-radius: 0.25rem !important;
        }
        .markdown-content em {
          font-style: italic !important;
          color: #374151 !important;
          font-size: inherit;
          padding: 0.125rem 0.25rem !important;
          border-radius: 0.25rem !important;
        }
        .markdown-content p {
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }
   * {
  border: none !important;
}


.shadow-sm {
    box-shadow: none !important; 
}
        .markdown-content .list-item {
          display: flex;
          align-items: flex-start;
          margin-bottom: 0.5rem;
          padding: 0.25rem 0;
        }
        .markdown-content .list-item.numbered {
          gap: 0.75rem;
        }
        .markdown-content .list-item.bulleted {
          gap: 0.75rem;
        }
        .markdown-content .list-item .number {
          font-weight: 600;
          color: #059669;
          min-width: 2rem;
          flex-shrink: 0;
        }
        .markdown-content .list-item .bullet {
          color: #059669;
          font-size: 1.125rem;
          margin-top: 0.125rem;
          flex-shrink: 0;
        }
        .markdown-content .list-item .content {
          color: #374151;
          line-height: 1.6;
          flex: 1;
        }
        .post-time {
          font-weight: 400;
          background: unset;
          padding: unset;
          border-radius: 4px;
          border: unset;
          margin-top:-2px;
        }
        
        
        /* Hide scrollbar completely for textarea and preview */
        .content-area textarea,
        .content-area .preview-container {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        
        .content-area textarea::-webkit-scrollbar,
        .content-area .preview-container::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
        
        /* Overall modal scrollbar styling */
        .modal-body-custom {
          scrollbar-width: thin;
          scrollbar-color: #2FB130 #f3f4f6;
        }
        
        .modal-body-custom::-webkit-scrollbar {
          width: 6px;
        }
        
        .modal-body-custom::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 3px;
        }
        
        .modal-body-custom::-webkit-scrollbar-thumb {
          background: #2FB130;
          border-radius: 3px;
        }
        
        .modal-body-custom::-webkit-scrollbar-thumb:hover {
          background: #28a028;
        }
        
        /* Overall font family for the modal */
        .post-creation-modal,
        .post-creation-modal * {
              
        }
        
        /* Modal header layout */
        .modal-header-custom {
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
        }
        
        /* Header actions container */
        .modal-header-actions {
          display: flex !important;
          flex-direction: row !important;
          gap: 4px !important;
          align-items: center !important;
          margin-left: auto !important;
        }
      `}</style>
      <Modal
        show={isOpen}
        onHide={onClose}
        size="lg"
        centered
        className="post-creation-modal"
        style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <Modal.Header
          className="modal-header-custom"
          style={{
            backgroundColor: "#ffffff",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div className="user-info1">
            {userProfile?.isConnected && (
              <div className="avatar">
                {userProfile?.profileImage ? (
                  <img
                    src={userProfile.profileImage}
                    alt={userProfile.name}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{
                    display: userProfile?.profileImage ? "none" : "flex",
                  }}
                >
                  <span className="text-white font-bold text-lg">
                    {(userProfile?.name || user?.name || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                </div>
              </div>
            )}
            <div className="user-details">
              <h6 className="user-name">
                {userProfile?.isConnected
                  ? userProfile?.name || user?.name || "User"
                  : "AI Generated"}
                {userProfile?.isConnected && (
                  <span className="ml-2 text-xs text-green-600">
                    {selectedPlatform === "linkedin"
                      ? "LinkedIn"
                      : selectedPlatform === "twitter"
                      ? "X"
                      : selectedPlatform.charAt(0).toUpperCase() +
                        selectedPlatform.slice(1)}
                  </span>
                )}
              </h6>
              {userProfile?.isConnected && (
                <>
                  <p className="user-title mb-0 pb-0">
                    Social Media User
                    {/* {userProfile?.title || "Social Media User"}
                    {userProfile?.company && ` • ${userProfile.company}`} */}
                  </p>
                  <span className="post-time text-xs text-gray-500 flex items-center">
                    {(() => {
                      console.log("content--->", content);
                      const updatedAt = content?.isPublished ? content?.published_at : content?.updated_at;
                      const createdAt = content?.isPublished ? content?.published_at : content?.created_at;
                      console.log("EditContentModal UI timestamps:", {
                        updatedAt,
                        createdAt,
                        content,
                        forceUpdate,
                      });

                      // Check if updated_at and created_at are different
                      const isEdited =
                        updatedAt && createdAt && updatedAt !== createdAt;

                      if (isEdited) {
                        return `Edited on ${getElapsedTime(updatedAt)}`;
                      } else {
                        return getElapsedTime(updatedAt || createdAt);
                      }
                    })()}{" "}
                    •{" "}
                    <img
                      src={global}
                      className="mt-1 ms-1"
                      style={{
                        objectFit: "contain",
                        width: "10px",
                        height: "10px",
                      }}
                    ></img>
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="modal-header-actions me-lg-3 me-5" style={{ display: "flex", flexDirection: "row", gap: "4px", alignItems: "center" }}>
            {showDuplicateButton && (currentContent?.type !== "scheduled" ||  currentContent?.draft_id) && (
                <button
                  onClick={() => handleDuplicate()}
                  className="duplicate-btn me-lg-4 me-4"
                  style={{ 
                    backgroundColor: "#84E084", 
                    color: "black", 
                    padding: "6px 16px",
                    borderRadius: "6px",
                    border: "none",
                    fontSize: "14px",
                    fontWeight: "500",
                    marginTop: userProfile?.isConnected ? "-30%" : "0",
                    opacity: (isPublishing || scheduling) ? 0.5 : 1,
                    cursor: (isPublishing || scheduling) ? "not-allowed" : "pointer"
                  }}
                  disabled={isPublishing || scheduling}
                >
                  Duplicate Post
                </button>
              )}
            <button
              type="button"
              className="btn-close-custom"
              onClick={onClose}
              aria-label="Close"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4L4 12M4 4L12 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </Modal.Header>

        <Modal.Body
          ref={modalBodyRef}
          className="modal-body-custom pt-3"
          style={{
            backgroundColor: "#ffffff",
            overflowY: "auto",
            maxHeight: "70vh",
          }}
        >
          {/* Content Area */}
          <div className="content-area">
            {content?.type === "scheduled" ? (
              // Read-only view for scheduled content
              <div className="relative">
                <div
                  className="w-full p-3 border rounded-lg bg-gray-50 text-gray-800 preview-container"
                  style={{
                    minHeight: "120px",
                    maxHeight: "480px",
                    overflowY: "auto",
                  }}
                >
                  <MarkdownRenderer
                    enableInline={false}
                    content={stripProvidedHashtags(editedContent, editedHashtags)}
                  />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xs font-medium text-gray-500">
                    {getCurrentCharCount()}/{getCurrentCharLimit()} Characters (including Hashtags)
                  </div>
                  {/* <div className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Scheduled Content - Read Only
                  </div> */}
                </div>
              </div>
            ) : previewMode ? (
              <div className="relative">
                <div
                  className="w-full p-3 border rounded-lg bg-gray-50 text-gray-800 preview-container"
                  style={{
                    minHeight: "120px",
                    maxHeight: "480px",
                    overflowY: "auto",
                  }}
                >
                  <MarkdownRenderer
                    enableInline={false}
                    content={stripProvidedHashtags(editedContent, editedHashtags)}
                  />
                </div>

                {/* Character count and controls */}
                <div className="flex items-center justify-between mt-2">
                  <div className={`text-xs font-medium ${getCharCountColor()}`}>
                    {getCurrentCharCount()}/{getCurrentCharLimit()} (including Hashtags)
                    {isOverLimit() && (
                      <span className="text-red-500 ml-2">
                        Exceeds {selectedPlatform} limit
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                 <textarea
                  value={editedContent}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    setEditedContent(newValue);
                  }}
                  rows={8}
                  className={`w-full p-3 border rounded-lg focus:outline-none resize-none text-sm leading-relaxed ${
                    isOverLimit()
                      ? "border-red-500 focus:ring-red-500 bg-red-50 text-red-800"
                      : "border-gray-300 focus:ring-green-500 bg-white text-gray-800"
                  }`}
                  placeholder="Edit your content here... Use line breaks and lists (1. numbered lists, • bullet points)"
                  style={{
                    minHeight: "120px",
                    maxHeight: "480px",
                  }}
                />

                {/* Character count and controls */}
                <div className="flex items-center justify-between mt-2">
                  <div className={`text-xs font-medium ${getCharCountColor()}`}>
                    {getCurrentCharCount()}/{getCurrentCharLimit()} (including Hashtags)
                    {isOverLimit() && (
                      <span className="text-red-500 ml-2">
                        Exceeds {selectedPlatform} limit
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Hashtags Section */}
          <div className="hashtags-section">
            <div className="existing-hashtags">
              {editedHashtags.map((hashtag, index) => (
                <span key={index} className="hashtag-pill">
                  {hashtag}
                  {content?.type !== "scheduled" && (
                    <button
                      onClick={() =>
                        setEditedHashtags((prev) =>
                          prev.filter((h) => h !== hashtag)
                        )
                      }
                      className="ml-2 ps-2 text-xs !text-red-500 hover:!text-red-700"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
            {content?.type !== "scheduled" && (
              <input
                type="text"
                className="hashtag-input"
                placeholder="# Add New Hashtags and Press Enter"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && e.target.value.trim()) {
                    const hashtag = e.target.value.trim();
                    if (hashtag && !editedHashtags.includes(`#${hashtag}`)) {
                      setEditedHashtags((prev) => [...prev, `#${hashtag}`]);
                      e.target.value = "";
                    }
                  }
                }}
              />
            )}
          </div>

          {/* Media Preview - Unified logic using image_url for both video and image content */}
          {currentContent?.image_url ? (
            (() => {
              // Helper function to determine if media is video based on file extension
              const isVideoFile = (url) => {
                if (!url) return false;
                const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.m4v'];
                const lowerUrl = url.toLowerCase();
                return videoExtensions.some(ext => lowerUrl.includes(ext));
              };

              const mediaUrl = currentContent?.image_url.startsWith("http")
                ? currentContent?.image_url
                : `${BASE_URL}${currentContent?.image_url}`;

              const isVideo = isVideoFile(currentContent?.image_url);

                return isVideo ? (
            /* Video Preview */
                  <div className="video-preview mt-4 relative">
              <div className="video-container">
                <video
                    onClick={() => handleOpenMediaPreview(mediaUrl, 'video')}
                        src={mediaUrl}
                  controls
                  className="w-full max-w-full rounded-xl border border-gray-300 shadow-sm"
                        style={{ height: "350px" }}
                >
                  Your browser does not support the video tag.
                </video>
                    {content?.type !== "scheduled" && (
                  <div className="video-controls">
                    <button
                      className="control-btn upload"
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload Custom Image"
                      disabled={uploading}
                    >
                      <img src={addIcon} alt="Add" className="control-icon" />
                    </button>
                    <button
                      className="control-btn upload"
                      onClick={() => videoInputRef.current?.click()}
                      title="Upload Custom Video"
                      disabled={uploading}
                    >
                      <svg
                        width="19"
                        height="19"
                        className="control-icon"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
              </div>
                )}
            </div>
                  
                  {/* Upload Loading Overlay */}
                  {uploading && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 rounded-xl">
                      <div className="flex flex-col items-center space-y-3">
                        <LoadingSpinner size="w-8 h-8" />
                        <span className="text-white text-sm font-medium">Uploading...</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
            /* Image Preview */
                <div className="image-preview relative">
              <div className="image-container">
                <div className="robot-image">
                  <img
                                        onClick={() => handleOpenMediaPreview(mediaUrl, 'image')}
                        src={mediaUrl}
                    alt="Generated content"
                    className="robot-img"
                  />
                  {regenerating && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 rounded-xl">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent"></div>
                    </div>
                  )}
                  {/* {(currentContent?.isRegenerated ||
                    isRecentlyRegenerated(
                          (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                        ? currentContent?.content_id
                        : currentContent?.id
                    )) && (
                    <span className="absolute bottom-5 left-58 z-20 px-2 py-1  font-semibold rounded-full "
                      style={{
                                        background: "#ffff",
                                        color: "#84E084",
                                        border:"2px solid #84E084 ",
                                        fontSize:"14px"
                                      }}>
                      Regenerated
                    </span>
                  )} */}
                </div>
                {content?.type !== "scheduled" && (
                  <div className="image-controls">
                    <button
                      className="control-btn refresh flex items-center justify-center"
                      onClick={() =>
                        handleRegenerateImage(
                              (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                                ? currentContent?.content_id
                                : currentContent?.id
                            )
                          }
                          disabled={regenerating || uploading}
                          title="Regenerate AI Image"
                        >
                          {regenerating ? (
                            <span className="animate-spin rounded-full w-4 h-4 !border-2 !border-current !border-t-transparent" />
                          ) : (
                            <img
                              src={refreshIcon}
                              alt="Refresh"
                              className="control-icon w-5 h-5"
                            />
                          )}
                        </button>

                    <button
                      className="control-btn upload"
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload Custom Image"
                          disabled={uploading}
                    >
                      <img src={addIcon} alt="Add" className="control-icon" />
                    </button>
                    <button
                      className="control-btn upload"
                      onClick={() => videoInputRef.current?.click()}
                      title="Upload Custom Video"
                          disabled={uploading}
                    >
                      <svg
                        width="19"
                        height="19"
                        className="control-icon"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
                  
                  {/* Upload Loading Overlay */}
                  {uploading && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 rounded-xl">
                      <div className="flex flex-col items-center space-y-3">
                        <LoadingSpinner size="w-8 h-8" />
                        <span className="text-white text-sm font-medium">Uploading...</span>
            </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : null}

          {/* Platform Selection */}
          <div className="platform-selection mt-4">
            <h6>
              {content?.type == ("scheduled" || "draft")
                ? "Selected Platform:"
                : "Select Platform:"}
            </h6>
            {converting && (
              <div className="flex items-center space-x-2 text-xs text-yellow-600 mb-3">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Converting content...</span>
              </div>
            )}

            {/* Conversion Message */}
            {conversionMessage && (
              <div
                className="mb-3 p-3 rounded-lg border text-sm"
                style={{ background: "#f0f9ff", borderColor: "#e0f2fe" }}
              >
                <div className="flex items-center space-x-2">
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ background: "#2FB130" }}
                  ></div>
                  <span className="text-gray-700">{conversionMessage}</span>
                </div>
              </div>
            )}
            <div className="platform-cards">
              {( platforms
              ).map((platform) => {
                const IconComponent = PlatformIcons[platform.value];
                const isSelected = selectedPlatform === platform.value;
                
                // Check if this platform should be disabled
                // Disable if:
                // 1. isOriginalPlatform prop is true and this is not the original platform, OR
                // 2. content type is draft/draft-version and this is not the current platform, OR
                // 3. content type is scheduled and this is not the current platform
                const isThisOriginalPlatform = content?.original_platform === platform.value;
                const isCurrentPlatform = content?.platform === platform.value;
                const shouldDisable = (isOriginalPlatform && content?.original_platform && !isThisOriginalPlatform) || 
                                     ((content?.type === "draft" || content?.type === "draft-version") && !isCurrentPlatform) ||
                                     (content?.type === "scheduled" && !isCurrentPlatform);
                
                return (
                  <div
                    key={platform.value}
                    className={`platform-card ${isSelected ? "selected" : ""} ${shouldDisable ? "disabled" : ""}`}
                    data-platform={platform.value}
                    onClick={() => {
                      if (!shouldDisable && content?.type !== "draft" && content?.type !== "scheduled" && !converting) {
                        if (platform.value !== selectedPlatform) {
                          handlePlatformSwitch(platform.value);
                        }
                        setSelectedPlatform(platform.value);
                      }
                    }}
                    style={{
                      opacity: converting || shouldDisable || ( (content?.type !== "draft" || content?.type !== "scheduled") && !isSelected)
                        ? 0.5
                        : 1,
                      cursor: converting || shouldDisable || ( (content?.type === "draft" || content?.type === "scheduled") && !isSelected)
                        ? "not-allowed"
                        : "pointer",
                      backgroundColor: shouldDisable ? "#f3f4f6" : undefined,
                      borderColor: shouldDisable ? "#d1d5db" : undefined,
                    }}
                  >
                    <div className="platform-logo">
                      <IconComponent />
                      {platform.directPublish &&
                        (platform.value === "linkedin" ||
                          platform.value === "twitter" ||
                          platform.value === "instagram" ||
                          platform.value === "facebook"
                        ) && (
                          <span className="lightning">⚡</span>
                        )}
                    </div>
                    <div className="platform-info">
                      <span className="platform-name">{platform.label}</span>
                      <span className="platform-chars">
                        {shouldDisable 
                          ? (isOriginalPlatform && content?.original_platform && !isThisOriginalPlatform
                              ? "Locked to original platform" 
                              : content?.type === "scheduled" && !isCurrentPlatform
                              ? "Locked to scheduled platform"
                              : "Locked to current platform")
                          : `${platform.charLimit.toLocaleString()} Characters`
                        }
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Success Message */}
          {(() => {
            console.log("Success modal render check:", {
              contentId:
                (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                  ? currentContent?.content_id
                  : currentContent?.id,
              selectedPlatform,
              publishSuccessMap: publishSuccessMap,
              hasContentId:
                !!publishSuccessMap[
                  (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                    ? currentContent?.content_id
                    : currentContent?.id
                ],
              hasPlatform:
                !!publishSuccessMap[
                  (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                    ? currentContent?.content_id
                    : currentContent?.id
                ]?.[selectedPlatform],
              platformData:
                publishSuccessMap[
                  (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                    ? currentContent?.content_id
                    : currentContent?.id
                ]?.[selectedPlatform],
            });
            return (
              publishSuccessMap[
                (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                  ? currentContent?.content_id
                  : currentContent?.id
              ] &&
              publishSuccessMap[
                (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                  ? currentContent?.content_id
                  : currentContent?.id
              ][selectedPlatform]
            );
          })() && (
            <div className="mt-4 mb-6 p-4 rounded-xl shadow-lg border bg-green-50 border-green-200">
              <div className="text-center">
                {/* <div className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center shadow-md bg-green-500">
                    ({publishSuccessMap[currentContent?.type == "scheduled" || currentContent?.type == "draft-version") ? currentContent?.content_id :currentContent?.id][selectedPlatform].isScheduled ? (
                      <Calendar className="w-6 h-6 text-white" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-white" />
                    )}
                  </div> */}
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center shadow-md bg-[#84E084]">
                {/*( {publishSuccessMap[currentContent?.type == "scheduled" || currentContent?.type == "draft-version") ? currentContent?.content_id :currentContent?.id][selectedPlatform]
                      .isPublished ? (
                      <CheckCircle className="w-8 h-8 text-[#173E44]" />
                    () : publishSuccessMap[currentContent?.type == "scheduled" || currentContent?.type == "draft-version") ? currentContent?.content_id :currentContent?.id][selectedPlatform]
                      .isScheduled ? (
                      <Calendar className="w-8 h-8 text-[#173E44]" />
                    ) : (
                      <CheckCircle className="w-8 h-8 text-[#173E44]" />
                    )} */}
                  <svg
                    width="68"
                    height="69"
                    viewBox="0 0 68 69"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <ellipse
                      cx="34"
                      cy="34.5"
                      rx="34"
                      ry="34.5"
                      fill="#84E084"
                    />
                    <path
                      d="M47 32.2H22M47 35.7V30.52C47 28.1678 47 26.9917 46.5458 26.0932C46.1464 25.303 45.509 24.6604 44.725 24.2578C43.8336 23.8 42.6669 23.8 40.3333 23.8H28.6667C26.3331 23.8 25.1663 23.8 24.275 24.2578C23.491 24.6604 22.8536 25.303 22.4541 26.0932C22 26.9917 22 28.1678 22 30.52V42.28C22 44.6323 22 45.8083 22.4541 46.7068C22.8536 47.4971 23.491 48.1396 24.275 48.5422C25.1663 49 26.3331 49 28.6667 49H34.5M40.0556 21V26.6M28.9444 21V26.6M37.9722 44.8L40.75 47.6L47 41.3"
                      stroke="#173E44"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>

                {/* <h3 className="text-lg font-bold text-gray-800 mb-2">
                    ({publishSuccessMap[currentContent?.type == "scheduled" || currentContent?.type == "draft-version") ? currentContent?.content_id :currentContent?.id][selectedPlatform].isScheduled ? 'Successfully Scheduled' : 'Successfully Published'}
                  </h3> */}

                <h3 className="text-xl font-bold text-[#173E44] mb-2">
                  <p className="publish-screens mb-0 pb-0">
                    {publishSuccessMap[
                      (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                        ? currentContent?.content_id
                        : currentContent?.id
                    ][selectedPlatform].isPublished
                      ? "Successfully Published"
                      : publishSuccessMap[
                          (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                            ? currentContent?.content_id
                            : currentContent?.id
                        ][selectedPlatform].isScheduled
                      ? "Successfully Scheduled"
                      : "Successfully Published"}
                  </p>
                  <p className="publish-post-p pt-1">
                    {publishSuccessMap[
                      (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                        ? currentContent.content_id
                        : currentContent.id
                    ][selectedPlatform].isPublished
                      ? "Your post has been published and is now live!"
                      : "Post scheduled and will be automatically published"}
                  </p>
                  {/* {publishSuccessMap[currentContent?.id][selectedPlatform]
                    </p>
                    ({/* {publishSuccessMap[currentContent?.type == "scheduled" || currentContent?.type == "draft-version") ? currentContent?.content_id :currentContent?.id][selectedPlatform]
                      .testMode && (
                      <span
                        className="ml-2 px-2 py-1 text-xs font-medium rounded-full border"
                        style={{
                          background: "rgba(245, 158, 11, 0.15)",
                          color: "#F59E0B",
                          borderColor: "rgba(245, 158, 11, 0.3)",
                        }}
                      >
                        TEST MODE
                      </span>
                    )}
                    ({(publishSuccessMap[currentContent?.type == "scheduled" || currentContent?.type == "draft-version") ? currentContent?.content_id :currentContent?.id][selectedPlatform]
                      .ayrsharePublished ||
                      (publishSuccessMap[currentContent?.type == "scheduled" || currentContent?.type == "draft-version") ? currentContent?.content_id :currentContent?.id][selectedPlatform]
                        .ayrshareScheduled) && (
                        <span
                          className="ml-2 px-2 py-1 text-xs font-medium rounded-full border"
                          style={{
                            background: "rgba(34, 197, 94, 0.15)",
                            color: "#22C55E",
                            borderColor: "rgba(34, 197, 94, 0.3)",
                          }}
                        >
                          AYRSHARE
                        </span>
                      )} */}
                </h3>
                {/* <p className="text-gray-600 text-sm mb-3">
                    ({publishSuccessMap[currentContent?.type == "scheduled" || currentContent?.type == "draft-version") ? currentContent?.content_id :currentContent?.id][selectedPlatform].isScheduled
                      ? 'Post scheduled and will be automatically published'
                      : `Your content is now live on ${selectedPlatform === 'linkedin' ? 'LinkedIn' : selectedPlatform === 'twitter' ? 'X' : selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}`
                    }
                  </p> */}

                <div className="flex items-center justify-center mb-2">
                  <div
                    className={`text-white px-3 py-1 rounded-lg flex items-center space-x-2 ${
                      selectedPlatform === "linkedin"
                        ? "bg-[#0A66C2]"
                        : selectedPlatform === "twitter"
                        ? "bg-black"
                        : selectedPlatform === "facebook"
                        ? "bg-[#1877F2]"
                        : selectedPlatform === "instagram"
                        ? "bg-[#CF2972]"
                        : "bg-gray-600"
                    }`}
                  >
                    {selectedPlatform === "linkedin" ? (
                      <div className="w-3 h-3 bg-[#0A66C2] rounded flex items-center justify-center">
                        <svg
                          class="w-4 h-4 "
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"></path>
                        </svg>
                      </div>
                    ) : selectedPlatform === "twitter" ? (
                      <div className="w-5 h-5 bg-black rounded flex items-center justify-center">
                        <svg
                          className="w-3 h-3  text-white"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </div>
                    ) : selectedPlatform === "facebook" ? (
                      <div className="w-5 h-5 bg-[#1877F2] rounded flex items-center justify-center">
                        <svg
                          className="w-3 h-3  text-white"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </div>
                    ) : selectedPlatform === "instagram" ? (
                      <div className="w-5 h-5 bg-[#CF2972] rounded flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white "
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.186 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </div>
                    ) : (
                      <div className="w-5 h-5 bg-gray-600 rounded flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {selectedPlatform.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="font-medium text-md">
                      {selectedPlatform === "linkedin"
                        ? "LinkedIn"
                        : selectedPlatform === "twitter"
                        ? "X"
                        : selectedPlatform.charAt(0).toUpperCase() +
                          selectedPlatform.slice(1)}
                    </span>
                  </div>
                </div>
                {publishSuccessMap[
                  (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                    ? currentContent?.content_id
                    : currentContent?.id
                ][selectedPlatform].isScheduled &&
                  publishSuccessMap[
                    (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                      ? currentContent?.content_id
                      : currentContent?.id
                  ][selectedPlatform].scheduledTime && (
                    <div className="flex items-center justify-center space-x-2 text-gray-600 mb-4">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {formatDateTimeWithUppercaseAMPM(
                          new Date(
                            publishSuccessMap[
                              (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                                ? currentContent?.content_id
                                : currentContent?.id
                            ][selectedPlatform].scheduledTime
                          ),
                          { dateStyle: "medium" }
                        )}{" "}
                        IST
                      </span>
                    </div>
                  )}
                {publishSuccessMap[
                  (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                    ? currentContent?.content_id
                    : currentContent?.id
                ][selectedPlatform].postUrl && (
                  <>
                    <div className="w-full   h-px bg-gradient-to-r from-transparent via-green-400 to-transparent my-3"></div>
                    <div className="flex items-center justify-center space-x-2 gap-2">
                      <button
                        onClick={() =>
                          window.open(
                            publishSuccessMap[
                              (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                                ? currentContent?.content_id
                                : currentContent?.id
                            ][selectedPlatform].postUrl,
                            "_blank"
                          )
                        }
                        className=" bg-date flex items-center space-x-2 px-4 py-2 bg-[#84E084] text-[#021E22] rounded-lg transition-colors text-sm "
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>View Post</span>
                      </button>

                      <button
                        onClick={() =>
                          handleCopyUrl(
                            publishSuccessMap[
                              (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                                ? currentContent?.content_id
                                : currentContent?.id
                            ][selectedPlatform].postUrl
                          )
                        }
                        className=" bg-date flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                      >
                        {copiedUrl ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}

                {/* Actions for scheduled posts: change time / unschedule */}
                {publishSuccessMap[
                  (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                    ? currentContent?.content_id
                    : currentContent?.id
                ][selectedPlatform].isScheduled && (
                  <div className="mt-2 flex justify-center gap-2">
                    <button
                      onClick={() => openScheduleModal()}
                      className="px-4 py-3 bg-[#84E084] text-[#000] rounded-lg text-sm font-medium hover:bg-green-600 transition-colors unchane-times"
                    >
                      Change Time
                    </button>
                    <button
                      onClick={() => showConfirmation("unschedule")}
                      className="px-4 py-3 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors unchane-times"
                    >
                      Unschedule
                    </button>
                  </div>
                )}

                {/*( {publishSuccessMap[currentContent?.type == "scheduled" || currentContent?.type == "draft-version") ? currentContent?.content_id :currentContent?.id][selectedPlatform]
                    .isScheduled && (
                    <div className="mt-4 flex justify-center gap-3">
                      <button
                        onClick={() => openScheduleModal()}
                        className="chat-message-over px-4 py-2 bg-[#84E084] text-[#000] rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                      >
                        Schedule Again
                      </button>
                      <button
                        (onClick={() => handleUnschedule(currentContent?.type == "scheduled" || currentContent?.type == "draft-version") ? currentContent?.content_id :currentContent?.id)}
                        className="chat-message-over px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                      >
                        Unschedule
                      </button>
                    </div>
                  )} */}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {content?.type !== "scheduled" && (
            <div className="action-buttons ">
              {content.is_draft && 
                !publishSuccessMap[
                  (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                    ? currentContent?.content_id
                    : currentContent?.id
                ]?.[selectedPlatform]?.isScheduled &&
                !publishSuccessMap[
                  (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                    ? currentContent?.content_id
                    : currentContent?.id
                ]?.[selectedPlatform]?.postUrl && (
                <button
                  className="schedule-btn"
                  onClick={handleDeleteDraft}
                  disabled={isPublishing || scheduling}
                  style={{ backgroundColor: "#dc3545", color: "white", opacity: (isPublishing || scheduling) ? 0.5 : 1, cursor: (isPublishing || scheduling) ? "not-allowed" : "pointer" }}
                >
                  Delete
                </button>
              )}

              {/* Only show Schedule button if content is NOT already scheduled */}
              {!publishSuccessMap[
                (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                  ? currentContent?.content_id
                  : currentContent?.id
              ]?.[selectedPlatform]?.isScheduled &&
                !publishSuccessMap[
                  (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                    ? currentContent?.content_id
                    : currentContent?.id
                ]?.[selectedPlatform]?.postUrl && (
                  <>
                    <button
                      // onClick={() => showConfirmation("schedule")}
                      onClick={() => openScheduleModal()}
                      disabled={
                        isPublishing ||
                        scheduling ||
                        isOverLimit() ||
                        !(
                          selectedPlatform === "linkedin" ||
                          selectedPlatform === "twitter" ||
                          selectedPlatform === "instagram" ||
                          selectedPlatform === "facebook"
                        )
                      }
                      className="schedule-btn"
                      style={{
                        opacity:
                          isPublishing ||
                          scheduling ||
                          isOverLimit() ||
                          !(
                            selectedPlatform === "linkedin" ||
                            selectedPlatform === "twitter" ||
                            selectedPlatform === "instagram" ||
                            selectedPlatform === "facebook"
                          )
                            ? 0.5
                            : 1,
                        cursor:
                          isPublishing ||
                          scheduling ||
                          isOverLimit() ||
                          !(
                            selectedPlatform === "linkedin" ||
                            selectedPlatform === "twitter" ||
                            selectedPlatform === "instagram" ||
                            selectedPlatform === "facebook"
                          )
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      Schedule
                    </button>
                    <button
                      onClick={() => showConfirmation("publish")}
                      disabled={isPublishing || scheduling || isOverLimit()}
                      className={`d-flex alifn-items-center publish-btn ${
                        isPublishing || scheduling || isOverLimit()
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {publishing ? (
                        <>
                          <div className="animate-spin rounded-full w-4 h-4 border-2 border-current border-t-transparent mr-2"></div>
                          Publishing...
                        </>
                      ) : isOverLimit() ? (
                        <>
                          <svg
                            className="w-4  text-red-400 mr-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                          </svg>
                          Over Character Limit
                        </>
                      ) : (
                        "Publish Now"
                      )}
                    </button>
                  </>
                )}
            </div>
          )}
        </Modal.Body>

        <Modal.Footer
          className="modal-footer-custom"
          style={{ backgroundColor: "#ffffff", borderTop: "1px solid #e5e7eb" }}
        >
          {""}

          {!publishSuccessMap[
            (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
              ? currentContent?.content_id
              : currentContent?.id
          ]?.[selectedPlatform]?.isScheduled ||
          !publishSuccessMap[
            (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
              ? currentContent?.content_id
              : currentContent?.id
          ]?.[selectedPlatform]?.postUrl ? (
            <button onClick={onClose} className="cancel-btn">
              Close
            </button>
          ) : (
            <button onClick={onClose} className="cancel-btn">
              {content?.type === "scheduled" ? "Close" : "Cancel"}
            </button>
          )}

          {!publishSuccessMap[
            (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
              ? currentContent?.content_id
              : currentContent?.id
          ]?.[selectedPlatform]?.isScheduled &&
            !publishSuccessMap[
              (currentContent?.type == "scheduled" || currentContent?.type == "draft-version")
                ? currentContent?.content_id
                : currentContent?.id
            ]?.[selectedPlatform]?.postUrl &&
            content?.type !== "scheduled" && (
              <>
                {/* <button
                  onClick={() => handleDuplicate()}
                  className="duplicate-btn"
                  style={{ 
                    backgroundColor: "#10B981", 
                    color: "white", 
                    marginRight: "8px",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500"
                  }}
                >
                  Duplicate Post
                </button> */}
              <button
                onClick={() => handleSaveChanges()}
                className={`save-btn ${ (saving || isPublishing || scheduling || isOverLimit()) ? "opacity-50 cursor-not-allowed" : ""}`}
                disabled={saving || isPublishing || scheduling || isOverLimit()}
              >
                {saving ? "Saving..." : isOverLimit() ? "Character limit exceeded" : "Save"}
              </button>
              </>
            )}
        </Modal.Footer>
      </Modal>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files[0]) {
            handleImageUpload(e.target.files[0]);
          }
        }}
        accept="image/*"
        className="hidden"
      />

      {/* Hidden Video File Input */}
      <input
        type="file"
        ref={videoInputRef}
        onChange={(e) => {
          if (e.target.files[0]) {
            handleVideoUpload(e.target.files[0]);
          }
        }}
        accept="video/*"
        className="hidden"
      />

      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
          <div
            className="rounded-2xl shadow-2xl border w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#2FB130 #ffffff",
            }}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 pb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-3">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#d8fdd8]">
                    <svg
                      width="30"
                      height="30"
                      viewBox="0 0 35 38"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M33 18.15V13.56C33 10.7037 33 9.27559 32.4368 8.18465C31.9415 7.22502 31.1512 6.44482 30.179 5.95587C29.0737 5.4 27.627 5.4 24.7333 5.4H10.2667C7.37306 5.4 5.92625 5.4 4.82105 5.95587C3.84887 6.44482 3.05848 7.22502 2.56313 8.18465C2 9.27559 2 10.7037 2 13.56V27.84C2 30.6963 2 32.1243 2.56313 33.2154C3.05848 34.1751 3.84887 34.9552 4.82105 35.4441C5.92625 36 7.37306 36 10.2667 36H18.3611M33 15.6H2M24.3889 2V8.8M10.6111 2V8.8M27.8333 34.3V24.1M22.6667 29.2H33"
                        stroke="#173E44"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="schedule-yours font-bold text-gray-900">
                      Schedule Your Post
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Choose the perfect time to reach your audience
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setScheduleDate("");
                    setScheduleTime("");
                  }}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors" style={{position:"relative",top:"-30px"}}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Platform Selection */}
              <div
                className="mt-4 flex items-center space-x-3"
                style={{ overflowX: "auto" }}
              >
                {selectedPlatform === "linkedin" && (
                  <div
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-[#0A66C2] text-white"
                >
                  <div className="w-5 h-5 bg-[#0A66C2] rounded flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </div>
                  <span className="font-medium text-sm">LinkedIn</span>
                </div>
                )}

                {selectedPlatform === "twitter" && (
                  <div
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-black text-white"
                >
                  <div className="w-5 h-5 bg-black rounded flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </div>
                  <span className="font-medium text-sm">Twitter</span>
                </div>
                )}

                {selectedPlatform === "instagram" && (
                  <div
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white"
                >
                  <div className="w-5 h-5 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 rounded flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </div>
                  <span className="font-medium text-sm">Instagram</span>
                </div>
                )}

                {selectedPlatform === "facebook" && (
                  <div
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-blue-600 text-white"
                >
                  <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <span className="font-medium text-sm">Facebook</span>
                </div>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 mt-3 pt-3">
              {/* All Suggested Best Times */}
              {suggestedTimes.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 22 22"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20.9208 12.265C20.9731 11.8507 21 11.4285 21 11C21 5.47715 16.5228 1 11 1C5.47715 1 1 5.47715 1 11C1 16.5228 5.47715 21 11 21C11.4354 21 11.8643 20.9722 12.285 20.9182M11 5V11L14.7384 12.8692M18 21V15M15 18H21"
                        stroke="#173E44"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>

                    <h4 className="schedule-yours all-sugges">
                      All Suggested Best Times
                    </h4>
                    <div className="opti-borer px-2 mx-3 py-1 text-xs font-medium rounded-full bg-[#EFFFEB] text-[#29AA6A]">
                      Optimized
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4  gap-3">
                    {suggestedTimes.slice(0, 4).map((time, index) => {
                      const date = new Date(time);
                      const isToday =
                        date.toDateString() === new Date().toDateString();
                      const isTomorrow =
                        date.toDateString() ===
                        new Date(
                          Date.now() + 24 * 60 * 60 * 1000
                        ).toDateString();

                      let dayLabel = date.toLocaleDateString("en-US", {
                        weekday: "short",
                      });
                      if (isToday) dayLabel = "Today";
                      else if (isTomorrow) dayLabel = "Tomorrow";

                      // Show green dot for first two cards by default
                      const showGreenDot = index < 2;

                      return (
                        <button
                          key={index}
                          onClick={() => handleSuggestedTimeClick(time)}
                          className={`group px-3 py-2 rounded-lg transition-all duration-200 text-left border-2 ${
                            selectedSuggestedTime === time
                              ? "border-[#EDEDED] bg-[#FAFAFA]"
                              : "border-[#EDEDED] bg-[#FAFAFA] hover:border-[#EDEDED]"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-md font-semibold text-[#173E44]">
                              {dayLabel}
                            </div>
                            {showGreenDot && (
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            )}
                          </div>
                          <div className="text-sm text-[#173E44] mb-2">
                            {date.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4 text-[#2FB130]" />
                            <div className="text-sm font-semibold text-[#2FB130]">
                              {date.toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Schedule */}
              <div>
                <div className="flex items-center space-x-2 mb-4 mt-3">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 22 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M20.9208 12.265C20.9731 11.8507 21 11.4285 21 11C21 5.47715 16.5228 1 11 1C5.47715 1 1 5.47715 1 11C1 16.5228 5.47715 21 11 21C11.4354 21 11.8643 20.9722 12.285 20.9182M11 5V11L14.7384 12.8692M18 21V15M15 18H21"
                      stroke="#173E44"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <h4 className="all-sugges">Custom Schedule</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full pr-10 px-3 py-3 rounded-lg !border-2 !border-green-500 !bg-[#eeffe5] text-sm cursor-pointer"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          const el =
                            document.querySelector('input[type="date"]');
                          if (el && typeof el.showPicker === "function") {
                            el.showPicker();
                          } else {
                            el?.focus();
                          }
                        }}
                        className="absolute inset-y-0 right-2 flex items-center z-10"
                        aria-label="Open calendar"
                      >
                        <span className="bg-[#2FB130] bg-date px-2 py-2">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 26"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M23 12.4V9.16C23 7.14381 23 6.13571 22.6003 5.36564C22.2488 4.68825 21.6879 4.13752 20.998 3.79238C20.2136 3.4 19.1869 3.4 17.1333 3.4H6.86667C4.81314 3.4 3.78637 3.4 3.00204 3.79238C2.3121 4.13752 1.75118 4.68825 1.39964 5.36564C1 6.13571 1 7.14381 1 9.16V19.24C1 21.2562 1 22.2642 1.39964 23.0344C1.75118 23.7118 2.3121 24.2625 3.00204 24.6076C3.78637 25 4.81314 25 6.86667 25H12.6111M23 10.6H1M16.8889 1V5.8M7.11111 1V5.8M19.3333 23.8V16.6M15.6667 20.2H23"
                              stroke="white"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Time
                    </label>
                    <div className="relative">
                      <input
                        id="scheduleTimeInput"
                        type="text"
                        value={
                          scheduleTime
                            ? (() => {
                                const [hour, minute] = scheduleTime.split(":");
                                const hour12 =
                                  hour === "00"
                                    ? 12
                                    : hour === "12"
                                    ? 12
                                    : parseInt(hour) > 12
                                    ? parseInt(hour) - 12
                                    : parseInt(hour);
                                const ampm = parseInt(hour) >= 12 ? "PM" : "AM";
                                return `${hour12}:${minute} ${ampm}`;
                              })()
                            : ""
                        }
                        readOnly
                        onClick={openTimePicker}
                        className="w-full pr-10 px-3 py-3 rounded-lg !border-2 !border-green-500 !bg-[#eeffe5] 
                   
                    text-sm bg-white cursor-pointer"
                        placeholder="Select time"
                      />
                      <button
                        type="button"
                        onClick={openTimePicker}
                        className="absolute inset-y-0 right-2 flex items-center z-10"
                        aria-label="Open time picker"
                      >
                        <span className="bg-[#2FB130] bg-date px-2 py-2">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 26 26"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M24.905 14.518C24.9677 14.0208 25 13.5142 25 13C25 6.37258 19.6274 1 13 1C6.37258 1 1 6.37258 1 13C1 19.6274 6.37258 25 13 25C13.5225 25 14.0372 24.9666 14.542 24.9018M13 5.8V13L17.4861 15.243M21.4 25V17.8M17.8 21.4H25"
                              stroke="white"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                        </span>
                      </button>
                    </div>
                  </div>
                  {scheduleDate && scheduleTime && (
                    <div
                      className="md:col-span-2 px-3 pt-3 pb-3 rounded-lg border"
                      style={{ background: "#ff", borderColor: "#1D2027" }}
                    >
                      <div className="flex items-start space-x-2">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: "#79DB79" }}
                        >
                          <Clock className="w-3 h-3 text-black" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-[#000] mb-0">
                            Scheduled for
                          </p>
                          <p className="text-xs text-[#000] font-semibold mb-0 pb-0">
                            {formatDateTimeWithUppercaseAMPM(
                              new Date(`${scheduleDate}T${scheduleTime}`)
                            )}{" "}
                            IST
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-6 bg-white">
              <div className="flex items-center justify-end space-x-3 gap-2">
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setScheduleDate("");
                    setScheduleTime("");
                  }}
                  className=" can-btnss px-4 py-2 bg-[#EAEAEA] hover:bg-[#EAEAEA] rounded-lg transition-all duration-200 font-medium text-sm text-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSchedule}
                      disabled={
                        isPublishing || scheduling || !scheduleDate || !scheduleTime || !(new Date(`${scheduleDate}T${scheduleTime}`).getTime() > Date.now())
                      }
                  className={`can-btnss px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 text-sm ${
                        isPublishing || scheduling || !scheduleDate || !scheduleTime || !(new Date(`${scheduleDate}T${scheduleTime}`).getTime() > Date.now())
                      ? "bg-gray-300 cursor-not-allowed text-gray-500"
                      : "bg-[#2FB130] hover:bg-[#2FB130] text-white shadow-md hover:shadow-lg"
                  }`}
                >
                  {scheduling ? (
                    <>
                      <LoadingSpinner size="w-3 h-3" />
                      <span>Scheduling...</span>
                    </>
                  ) : (
                    <>
                      <span>Schedule</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Time Picker Modal with AM/PM */}
      {showTimePicker && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowTimePicker(false);
            }
          }}
        >
          {/* Close Button */}
          <button
            onClick={() => setShowTimePicker(false)}
            className="absolute top-4 right-4 text-white text-2xl font-bold z-[10001] hover:text-gray-300 transition-colors"
            style={{ top: "16px", right: "16px" }}
          >
            ×
          </button>

          <div 
            className="bg-white rounded-lg shadow-lg w-full max-w-sm relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-4 py-4">
              <h3 className="font-semibold text-black text-lg m-0">
                Set time
              </h3>
            </div>

            {/* Time Input Fields */}
            <div className="px-4 pb-4 flex gap-3">
              {/* Hour Field */}
              <div className="flex-1 relative">
                <div className="relative">
                  <input
                    type="text"
                    value={selectedHour}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black cursor-pointer focus:outline-none"
                    style={{ fontSize: '14px' }}
                    onClick={() => setHourDropdownOpen(!hourDropdownOpen)}
                  />
                  <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
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
                  </div>
                </div>

                {/* Hour Dropdown */}
                {hourDropdownOpen && (
                  <div style={{ scrollbarWidth: "none" }} ref={hourDropdownRef} className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                      <div 
                        key={hour} 
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-center"
                        onClick={() => {
                          setSelectedHour(hour);
                          setHourDropdownOpen(false);
                        }}
                      >
                        {hour}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Minutes Field */}
              <div className="flex-1 relative">
                <div className="relative">
                  <input
                    type="text"
                    value={selectedMinute.toString().padStart(2, '0')}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black cursor-pointer focus:outline-none"
                    style={{ fontSize: '14px' }}
                    onClick={() => setMinuteDropdownOpen(!minuteDropdownOpen)}
                  />
                  <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
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
                  </div>
                </div>

                {/* Minutes Dropdown */}
                {minuteDropdownOpen && (
                  <div style={{ scrollbarWidth: "none" }} ref={minuteDropdownRef} className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                    {Array.from({ length: 60 }, (_, i) => i).map((minute) => (
                      <div 
                        key={minute} 
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-center"
                        onClick={() => {
                          setSelectedMinute(minute);
                          setMinuteDropdownOpen(false);
                        }}
                      >
                        {minute.toString().padStart(2, '0')}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* AM/PM Field */}
              <div className="flex-1 relative">
                <div className="relative">
                  <input
                    type="text"
                    value={isAM ? 'AM' : 'PM'}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-black cursor-pointer focus:outline-none"
                    style={{ fontSize: '14px' }}
                    onClick={() => setAmpmDropdownOpen(!ampmDropdownOpen)}
                  />
                  <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
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
                  </div>
                </div>

                {/* AM/PM Dropdown */}
                {ampmDropdownOpen && (
                  <div style={{ scrollbarWidth: "none" }} ref={ampmDropdownRef} className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-24 overflow-y-auto">
                    <div 
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-center"
                      onClick={() => {
                        setIsAM(true);
                        setAmpmDropdownOpen(false);
                      }}
                    >
                      AM
                    </div>
                    <div 
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-center"
                      onClick={() => {
                        setIsAM(false);
                        setAmpmDropdownOpen(false);
                      }}
                    >
                      PM
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-4 flex gap-3 justify-center border-t border-gray-200">
              <button
                onClick={() => setShowTimePicker(false)}
                className="px-5 py-2 text-sm font-medium cursor-pointer transition-all duration-200 border-none min-w-20"
                style={{
                  backgroundColor: "#EAEAEA",
                  color: "#021E22",
                  borderRadius: "9px",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleTimeSelection}
                className="px-5 py-2 text-sm font-medium cursor-pointer transition-all duration-200 border-none min-w-20"
                style={{
                  backgroundColor: "#84E084",
                  color: "#021E22",
                  borderRadius: "9px",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Draft Modal */}
      <DeleteDraftModal
        isOpen={showDeleteModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        isLoading={deletingDraft}
      />

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <div className="alfred-confirmation-modal">
          <div className="alfred-confirmation-modal-content">
            {/* Close Button */}
            <button
              onClick={handleCancelConfirmation}
              className="alfred-confirmation-modal-close"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              {/* Icon */}
              <div className="alfred-confirmation-modal-icon">
                <svg
                  width="86"
                  height="86"
                  viewBox="0 0 86 86"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="43" cy="43" r="43" fill="#CFF3DE" />
                  <path
                    d="M63 30L35.5 57L23 44.7273"
                    stroke="#26AE26"
                    stroke-width="4"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>

              {/* Title */}
              <h3 className="alfred-confirmation-modal-title">
                {confirmationTitle}
              </h3>

              {/* Message */}
              <p className="alfred-confirmation-modal-message">
                {confirmationMessage}
              </p>

              {/* Buttons */}
              <div className="alfred-confirmation-modal-buttons">
                <button
                  onClick={handleCancelConfirmation}
                  className="alfred-confirmation-modal-cancel"
                >
                  {confirmationCancelText}
                </button>
                <button
                  onClick={handleConfirmation}
                  className="alfred-confirmation-modal-confirm"
                >
                  {confirmationConfirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Popup */}
      <PricingPopup
        isOpen={showPricingPopup}
        onClose={() => setShowPricingPopup(false)}
        credits={50}
        maxCredits={100}
        availablePlans={availablePlans}
        plan={plan}
      />

      {/* Duplicate Platform Selection Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
          <div className="rounded-2xl shadow-2xl border w-full max-w-md bg-white">
            <div className= {availablePlatforms.length > 0 ? "p-6" : "pt-2 ps-2 pe-2 pb-3"}>
              <div className={availablePlatforms.length > 0 ? "flex items-center justify-between mb-4" : "flex items-center justify-between"}>
             {availablePlatforms.length > 0 ? <h3 className="text-lg font-semibold" style={{color:"#022C33"}}>
                  Duplicate Post
                </h3>: <div></div>}
                <button
                  onClick={handleCloseDuplicateModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {availablePlatforms.length > 0 && <p className="text-sm mb-6" style={{color:"#022C33"}}>
                Choose where you want to share this post again:
              </p>}
              
              <div className="space-y-3">
                {availablePlatforms.map((platform) => {
                  const platformIcon = getPlatformIcon(platform);
                  return (
                    <button
                      key={platform}
                      onClick={() => handlePlatformSelect(platform)}
                      disabled={duplicating}
                      className="w-full p-3 text-left rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                          {platformIcon ? (
                            <img 
                              src={platformIcon} 
                              alt={platform}
                              className="w-6 h-6 object-contain"
                            />
                          ) : (
                            <span className="text-sm font-medium  capitalize" style={{color:"#022C33"}}>
                              {platform.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="font-medium text-gray-900 capitalize">
                          {platform}
                        </span>
                      </div>
                    </button>
                  );
                })}
                
                {availablePlatforms.length === 0 && (
                  <div className="text-center d-flex flex-column align-items-center justify-content-center py-2">
                     <h3 className="text-lg font-semibold" style={{color:"#022C33"}}>
                        Duplicate Post
                      </h3>
                    <p className="  pt-3  mb-0" style={{fontSize:"15px",width:"80%",color:"#022C33"}}>
                    This post has already been shared on all available platforms.
                    </p>
                    <p className=" pt-1 " style={{fontSize:"13px",width:"90%",color:"#022C33"}}>
                    No additional platforms are available for duplication.
                    </p>
                  </div>
                )}
              </div>
              
              <div className={availablePlatforms.length > 0 ? "flex justify-end mt-6" : "flex justify-center mt-1"}>
                <button
                  onClick={handleCloseDuplicateModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  style={{
                    backgroundColor: availablePlatforms.length > 0 ? "#EAEAEA" : "#84E084",
                    color:"#021E22" ,
                    borderRadius:"5px"
                  }}
                >
                  {availablePlatforms.length > 0 ? "Cancel" : "Got It"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Media Preview Modal */}
      {showMediaPreview && (
        <div 
          className="fixed inset-0 z-5000000000000 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={handleCloseMediaPreview}
        >
          {/* White container with content */}
          <div 
            className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 flex items-center justify-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleCloseMediaPreview}
              className="absolute top-2 right-2 z-50 w-4 h-4 flex items-center justify-center rounded-full transition-colors"
              title="Close preview"
            >
              <X className="w-4 h-4 text-gray-700" />
            </button>

            {/* Media content */}
            <div className="w-full flex items-center justify-center mt-1">
              {previewMediaType === 'video' ? (
                <video
                  src={previewMediaUrl}
                  controls
                  className="max-w-full max-h-[400px] rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={previewMediaUrl}
                  alt="Preview"
                  className="max-w-full max-h-[400px] object-contain rounded-lg"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditContentModal;

{
  /* Schedule Modal */
}
// {showScheduleModal && (
// <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-60 p-4">
{
  /* <div
            className="rounded-2xl shadow-2xl border w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            style={{ background: "#121318", borderColor: "#1D2027" }}
          > */
}
{
  /* Header */
}
{
  /* <div
              className="relative p-5 text-white"
              style={{
                background: "linear-gradient(180deg, #7EDD7E 0%, #57C957 100%)",
              }}
            >
              <div
                className="absolute inset-0"
                style={{ background: "rgba(0,0,0,0.05)" }}
              ></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center border"
                    style={{
                      background: "rgba(0,0,0,0.1)",
                      borderColor: "rgba(255,255,255,0.3)",
                    }}
                  >
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Schedule Your Post</h3>
                    <p className="text-black/70 text-xs">
                      Choose the perfect time to reach your audience
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setScheduleDate("");
                    setScheduleTime("");
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white transition-all duration-200 border"
                  style={{
                    background: "rgba(0,0,0,0.1)",
                    borderColor: "rgba(255,255,255,0.3)",
                  }}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div> */
}

{
  /* Modal Body */
}
{
  /* <div className="p-5 space-y-5" style={{ background: "#121318" }}> */
}
{
  /* Suggested Times */
}
{
  /* {suggestedTimes.length > 0 && (
                <div
                  className="rounded-xl p-4 shadow-lg border"
                  style={{ background: "#1D2027", borderColor: "#1D2027" }}
                >
                  <div className="flex items-center space-x-2 mb-3">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center"
                      style={{
                        background:
                          "linear-gradient(180deg, #7EDD7E 0%, #57C957 100%)",
                      }}
                    >
                      <Clock className="w-3 h-3 text-black" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-100">
                      AI Suggested Best Times
                    </h4>
                    <div
                      className="px-2 py-0.5 text-xs font-medium rounded-full"
                      style={{
                        background: "rgba(23,88,23,0.3)",
                        color: "#79DB79",
                      }}
                    >
                      Optimized
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {suggestedTimes.slice(0, 4).map((time, index) => {
                      const date = new Date(time);
                      const isToday =
                        date.toDateString() === new Date().toDateString();
                      const isTomorrow =
                        date.toDateString() ===
                        new Date(
                          Date.now() + 24 * 60 * 60 * 1000
                        ).toDateString();

                      let dayLabel = date.toLocaleDateString("en-US", {
                        weekday: "short",
                      });
                      if (isToday) dayLabel = "Today";
                      else if (isTomorrow) dayLabel = "Tomorrow";

                      return (
                        <button
                          key={index}
                          onClick={() => handleSuggestedTimeClick(time)}
                          className={`group p-3 rounded-lg transition-all duration-200 text-left border ${
                            selectedSuggestedTime === time
                              ? "ring-2 ring-[#79DB79] border-[#175817] bg-[#121318]"
                              : ""
                          }`}
                          style={{
                            background: "#121318",
                            borderColor:
                              selectedSuggestedTime === time
                                ? "#175817"
                                : "#1D2027",
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xs font-semibold text-gray-100">
                              {dayLabel}
                            </div>
                            {index < 2 && (
                              <div
                                className="w-1.5 h-1.5 rounded-full animate-pulse"
                                style={{ background: "#79DB79" }}
                              ></div>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mb-1">
                            {date.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </div>
                          <div
                            className="text-xs font-semibold"
                            style={{ color: "#79DB79" }}
                          >
                            {date.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )} */
}

{
  /* Custom Date/Time - two-column layout to reduce height */
}
{
  /* <div
                className="rounded-xl p-4 shadow-lg border"
                style={{ background: "#1D2027", borderColor: "#1D2027" }}
              >
                <div className="flex items-center space-x-2 mb-3">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(180deg, #7EDD7E 0%, #57C957 100%)",
                    }}
                  >
                    <svg
                      className="w-3 h-3 text-black"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                      />
                    </svg>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-100">
                    Custom Schedule
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-300">
                      Date
                    </label>
                    <div className="relative">
                      <input
                        id="modalScheduleDateInput"
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full pr-9 px-3 py-2 rounded-lg focus:outline-none transition-all duration-200 text-sm"
                        style={{
                          background: "#121318",
                          border: "1px solid #1D2027",
                          color: "#E5E7EB",
                          colorScheme: 'dark'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById(
                            "modalScheduleDateInput"
                          );
                          if (el && typeof el.showPicker === "function") {
                            el.showPicker();
                          } else {
                            el?.focus();
                          }
                        }}
                        className="absolute inset-y-0 right-2 flex items-center"
                        aria-label="Open date picker"
                      >
                        <Calendar
                          className="w-4 h-4"
                          style={{ color: "#79DB79" }}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-300">
                      Time
                    </label>
                    <div className="relative">
                      <input
                        id="modalScheduleTimeInput"
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full pr-9 px-3 py-2 rounded-lg focus:outline-none transition-all duration-200 text-sm"
                        style={{
                          background: "#121318",
                          border: "1px solid #1D2027",
                          color: "#E5E7EB",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById(
                            "modalScheduleTimeInput"
                          );
                          if (el && typeof el.showPicker === "function") {
                            el.showPicker();
                          } else {
                            el?.focus();
                          }
                        }}
                        className="absolute inset-y-0 right-2 flex items-center"
                        aria-label="Open time picker"
                      >
                        <Clock
                          className="w-4 h-4"
                          style={{ color: "#79DB79" }}
                        />
                      </button>
                    </div>
                  </div>
                </div>
                {scheduleDate && scheduleTime && (
                  <div
                    className="md:col-span-2 p-3 rounded-lg border"
                    style={{ background: "#121318", borderColor: "#1D2027" }}
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "#79DB79" }}
                      >
                        <Clock className="w-3 h-3 text-black" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-100">
                          Scheduled for
                        </p>
                          <p className="text-xs text-gray-300 font-semibold">
                            {formatDateTimeWithUppercaseAMPM(
                            new Date(`${scheduleDate}T${scheduleTime}`)
                            )}{" "}
                            IST
                          </p>
                      </div>
                    </div>
                  </div>
                )}
              </div> */
}
{
  /* </div> */
}

{
  /* Footer */
}
{
  /* <div
              className="backdrop-blur-sm border-t p-4"
              style={{ background: "#121318", borderColor: "#1D2027" }}
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setScheduleDate("");
                    setScheduleTime("");
                  }}
                  className="px-4 py-2 bg-[#1D2027] hover:bg-[#121318] rounded-lg transition-all duration-200 font-medium text-sm text-gray-300 border border-[#1D2027]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSchedule}
                  disabled={
                    scheduling ||
                    !scheduleDate ||
                    !scheduleTime ||
                    isOverLimit()
                  }
                  className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 text-sm ${
                    scheduling ||
                    !scheduleDate ||
                    !scheduleTime ||
                    isOverLimit()
                      ? "bg-[#1D2027] cursor-not-allowed text-gray-500 border border-[#1D2027]"
                      : "text-black shadow-md hover:shadow-lg border border-[#175817]"
                  }`}
                  style={
                    scheduling ||
                    !scheduleDate ||
                    !scheduleTime ||
                    isOverLimit()
                      ? undefined
                      : {
                          background:
                            "linear-gradient(180deg, #7EDD7E 0%, #57C957 100%)",
                        }
                  }
                >
                  {scheduling ? (
                    <>
                      <div className="animate-spin rounded-full w-3 h-3 border-2 border-current border-t-transparent"></div>
                      <span>Scheduling...</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Schedule Post</span>
                    </>
                  )}
                </button>
              </div>
            </div> */
}
{
  /* </div> */
}
{
  /* </div> */
}
{
  /* )} */
}
