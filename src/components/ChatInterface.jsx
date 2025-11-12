import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { useChatHistory } from "../contexts/ChatHistoryContext";
import { useAyrshareConnection } from "../contexts/AyrshareConnectionContext";
import "./ConnectAccountPopup.css";
import {
  Send,
  Upload,
  Edit3,
  Share2,
  RefreshCw,
  Target,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Clock,
  X,
  CheckCircle,
  Zap,
  ClipboardCopy,
  ClipboardCheck,
  ImagePlus,
  Image,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import PricingPopup from "./PricingPopup";
import {
  getSocialConnectionsApi,
  analyzeImageApi,
  sendChatMessageApi,
  checkChatBlockStatusApi,
  checkImageLimitApi,
  uploadImageApi,
  uploadVideoApi,
  uploadMediaApi,
  generateImageApi,
  publishContentApi,
  getPublishUrlApi,
  reschedulePostApi,
  schedulePostApi,
  getSuggestedTimesApi,
  unschedulePostApi,
  saveDraftApi,
  updateContentApi,
  upsertDraftVersionApi,
  getSchedulePostsApi,
  BASE_URL,
} from "../api/api";
import EditContentModal from "./EditContentModal";
import MarkdownRenderer from "./MarkdownRenderer";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import global from "../assets/global.png";
import {
  getAyrshareProfile,
  getAyrshareConnectedAccounts,
  postToAyrshare,
  scheduleAyrsharePost,
  generateAyrshareJWT,
  unscheduleAyrsharePost,
  updateScheduledPost,
} from "../api/api.js";
import { loadProfileFromStorage } from "../utils/ayrshareStorage.js";

// Use shared MarkdownRenderer from components folder

// Utility function for timezone conversion
import {
  convertLocalTimeToUTC,
  convertUTCToLocal,
  getCurrentTimezone,
  formatTimeForDisplay,
} from "../utils/timezoneUtils";

const ChatInterface = ({ onNavigateToBilling, onNavigateToSocial, onNavigateToPosts }) => {
  const MAX_INPUT_LENGTH = 2000;
  const { user, isAuthenticated } = useAuth();
  const {
    messages,
    setMessages,
    currentContent,
    setCurrentContent,
    publishSuccessMap,
    setPublishSuccessMap,
    editingContent,
    setEditingContent,
    draftSuccessMap,
    setDraftSuccessMap,
    currentSessionId,
    setCurrentSessionId,
    clearChatHistory,
    updatePublishSuccessMap,
  } = useChatHistory();
  console.log("messages", messages);
  const [input, setInput] = useState("");
  const [showScrollbar, setShowScrollbar] = useState(false);
  const { chatLoading, setChatLoading, loadingImages, addLoadingImage, removeLoadingImage, uploading, setUploading } = useAyrshareConnection(); // Loading states from context - persist across tab switches
  const loading = chatLoading; // Alias for backward compatibility
  const [selectedPlatform, setSelectedPlatform] = useState("linkedin");
  const [socialConnections, setSocialConnections] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  // Ayrshare integration state
  const [ayrshareProfile, setAyrshareProfile] = useState(null);
  const [ayrshareConnections, setAyrshareConnections] = useState([]);
  const [ayrshareLoading, setAyrshareLoading] = useState(false);

  const [previewMode, setPreviewMode] = useState(false);

  const [editedContent, setEditedContent] = useState("");
  const [editedHashtags, setEditedHashtags] = useState([]);
  const [copiedUrl, setCopiedUrl] = useState(false); // For tracking URL copy state
  const [copiedMessageId, setCopiedMessageId] = useState(null); // For copy-to-clipboard on AI messages
  const { publishing, publishingContentId, setPublishingState, clearPublishingState } = useAyrshareConnection(); // Publishing state from context - persists across tab switches
  const [showScheduleModal, setShowScheduleModal] = useState(false); // For schedule modal
  const [scheduleDate, setScheduleDate] = useState(""); // For schedule date
  const [scheduleTime, setScheduleTime] = useState(""); // For schedule time
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [isAM, setIsAM] = useState(true);
  const [hourDropdownOpen, setHourDropdownOpen] = useState(false);
  const [minuteDropdownOpen, setMinuteDropdownOpen] = useState(false);
  const [ampmDropdownOpen, setAmpmDropdownOpen] = useState(false);
  const hourDropdownRef = useRef(null);
  const minuteDropdownRef = useRef(null);
  const ampmDropdownRef = useRef(null);
  const [scheduling, setScheduling] = useState(false); // For tracking scheduling state
  const [publishedPosts, setPublishedPosts] = useState(new Set()); // Track published posts
  const [scheduledPosts, setScheduledPosts] = useState(new Set()); // Track scheduled posts

  // Pricing popup state
  const [showPricingPopup, setShowPricingPopup] = useState(false);
  const [chatBlocked, setChatBlocked] = useState(false);
  const [availablePlans, setAvailablePlans] = useState([]);

  // Confirmation modal states
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null); // 'publish', 'schedule', 'unschedule'
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [confirmationContent, setConfirmationContent] = useState(null); // Content to act upon
  const [confirmationTitle, setConfirmationTitle] = useState("");
  const [confirmationConfirmText, setConfirmationConfirmText] = useState("");
  const [confirmationCancelText, setConfirmationCancelText] = useState("");

  // Function to check for published posts and update UI
  const checkForPublishedPosts = useCallback(async () => {
    try {
      const response = await axios.get("/content/published-posts");
      const scheduledPosts = response?.data.posts || [];

      // Find posts that have been published
      const newlyPublished = scheduledPosts.filter(
        (post) =>
          post.post_url !== null &&
          !publishedPosts.has(`${post.content_id}-${post.platform}`)
      );

      // Update publishSuccessMap for newly published posts
      if (newlyPublished.length > 0) {
        newlyPublished.forEach((post) => {
          const contentId = post.content_id;
          const platform = post.platform;

          // Use the utility function to update publishSuccessMap
          updatePublishSuccessMap(contentId, platform, {
            success: true,
            message: "Post published successfully!",
            postUrl: post.post_url,
            isScheduled: false, // Now it's published
            isPublished: true, // Mark as published
            publishedAt: post.published_at,
            testMode: false,
          });
        });

        // Update published posts tracking
        setPublishedPosts((prev) => {
          const newSet = new Set(prev);
          newlyPublished.forEach((post) => {
            newSet.add(`${post.content_id}-${post.platform}`);
          });
          return newSet;
        });
      }
    } catch (error) {
      console.error("Error checking for published posts:", error);
    }
  }, [publishedPosts, updatePublishSuccessMap]);

  // Function to check for scheduled posts and update UI
  const checkForScheduledPosts = useCallback(async () => {
    try {
      const response = await getSchedulePostsApi();
      const scheduledPostsData = response?.data.scheduled_posts || [];

      // Find posts that are newly scheduled
      const newlyScheduled = scheduledPostsData.filter(
        (post) =>
          post.scheduled_time !== null &&
          !scheduledPosts.has(`${post.content_id}-${post.platform}`)
      );

      // Update publishSuccessMap for newly scheduled posts
      if (newlyScheduled.length > 0) {
        newlyScheduled.forEach((post) => {
          const contentId = post.content_id;
          const platform = post.platform;

          // Use the utility function to update publishSuccessMap
          updatePublishSuccessMap(contentId, platform, {
            success: true,
            message: "Post scheduled successfully!",
            postUrl: null, // No URL yet for scheduled posts
            isScheduled: true, // Mark as scheduled
            isPublished: false, // Not published yet
            scheduledTime: post.scheduled_time,
            testMode: false,
            scheduledPostId: post.id, // Store the scheduled post ID
            ayrsharePostId: post.ayrshare_postId || null,
            ayrsharePostDetails: post.ayrshare_post_details || null,
            profileKey: post.profile_key || null,
            scheduleId: post.schedule_id || post.id,
          });
        });

        // Update scheduled posts tracking
        setScheduledPosts((prev) => {
          const newSet = new Set(prev);
          newlyScheduled.forEach((post) => {
            newSet.add(`${post.content_id}-${post.platform}`);
          });
          return newSet;
        });
      }
    } catch (error) {
      console.error("Error checking for scheduled posts:", error);
    }
  }, [scheduledPosts, updatePublishSuccessMap]);

  // Check for published posts periodically
  useEffect(() => {
    const interval = setInterval(checkForPublishedPosts, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [checkForPublishedPosts]);
  
  // Check if publishing completed when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible - check for completed publishing operations
        if (publishingContentId) {
          // There's a publishing operation in progress
          const successInfo = publishSuccessMap[publishingContentId]?.[selectedPlatform];
          if (successInfo && successInfo.success) {
            // Publishing completed successfully while tab was hidden, clear the publishing state
            clearPublishingState();
          } else {
            // Still publishing or status unknown, check the server for status
            checkForPublishedPosts();
          }
        } else {
          // No active publishing, but check anyway in case publishing completed while tab was hidden
          // This ensures success messages appear even if publishingContentId was cleared
          checkForPublishedPosts();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also check on mount if there's a pending publishing operation
    if (publishingContentId) {
      const successInfo = publishSuccessMap[publishingContentId]?.[selectedPlatform];
      if (successInfo && successInfo.success) {
        clearPublishingState();
      } else {
        checkForPublishedPosts();
      }
    }
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [publishingContentId, selectedPlatform, publishSuccessMap, clearPublishingState, checkForPublishedPosts]);
  
  // Periodically check if publishing completed while publishing state is active
  useEffect(() => {
    if (!publishingContentId) return;
    
    const checkInterval = setInterval(() => {
      // Check if the content has been successfully published
      const successInfo = publishSuccessMap[publishingContentId]?.[selectedPlatform];
      if (successInfo && successInfo.success) {
        // Publishing completed successfully, clear the publishing state
        clearPublishingState();
        clearInterval(checkInterval);
      } else {
        // Still publishing, check the server for status
        checkForPublishedPosts();
      }
    }, 3000); // Check every 3 seconds while publishing
    
    return () => clearInterval(checkInterval);
  }, [publishingContentId, selectedPlatform, publishSuccessMap, clearPublishingState, checkForPublishedPosts]);

  // Check for scheduled posts periodically
  useEffect(() => {
    const interval = setInterval(checkForScheduledPosts, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [checkForScheduledPosts]);

  // Update current time every minute to refresh elapsed time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

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
      const [hour, minute] = scheduleTime.split(":");
      const hour24 = parseInt(hour);
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      setSelectedHour(hour12);
      setSelectedMinute(parseInt(minute));
      setIsAM(hour24 < 12);
    }
    setShowTimePicker(true);
  };
  const [suggestedTimes, setSuggestedTimes] = useState([]); // For suggested posting times
  const [selectedSuggestedTime, setSelectedSuggestedTime] = useState(null); // Highlight selected suggested time
  const [reschedulePostId, setReschedulePostId] = useState(null); // Scheduled post ID when rescheduling
  const [regeneratingContentId, setRegeneratingContentId] = useState(null); // Track image regeneration loading
  const [savingDraft, setSavingDraft] = useState(false); // For tracking draft saving state
  const [showDraftModal, setShowDraftModal] = useState(false); // For simple draft saved modal
  const [savedDrafts, setSavedDrafts] = useState(() => {
    try {
      const raw = localStorage?.getItem("simbli_saved_draft_ids");
      if (raw) {
        const ids = JSON?.parse(raw);
        if (Array.isArray(ids)) {
          return new Set(ids.map((id) => String(id)));
        }
      }
    } catch (_) {}
    return new Set();
  }); // Track which content IDs have been saved as drafts
  const [currentTime, setCurrentTime] = useState(new Date()); // For updating elapsed time

  // Persist saved drafts whenever they change
  useEffect(() => {
    try {
      localStorage?.setItem(
        "simbli_saved_draft_ids",
        JSON?.stringify(Array.from(savedDrafts))
      );
    } catch (_) {}
  }, [savedDrafts]);

  // Auto-populate savedDrafts for content that is already saved to draft on original platform
  useEffect(() => {
    const newSavedDrafts = new Set(savedDrafts);
    let hasChanges = false;

    messages.forEach((message) => {
      if (message.type === "ai" && message.content) {
        const content = message.content;
        const contentId = String(content.id);
        
        // If content is on original platform, add to savedDrafts
        if (content.original_platform === selectedPlatform && !savedDrafts.has(contentId)) {
          newSavedDrafts.add(contentId);
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      setSavedDrafts(newSavedDrafts);
    }
  }, [messages, selectedPlatform, savedDrafts]);

  // Function to calculate human-readable elapsed time
  const getElapsedTime = (timestamp) => {
    if (!timestamp) {
      console.log("ChatInterface: No timestamp provided");
      return "Just now";
    }
    console.log("ChatInterface timestamppppp", typeof timestamp, { timestamp });
    // Use current time directly instead of state to ensure accuracy
    const now = new Date();
    // Ensure timestamp is properly parsed - if it's a string without timezone info, treat it as UTC
    let messageTime;
    if (typeof timestamp === "string") {
      // If timestamp doesn't have timezone info, append 'Z' to treat it as UTC
      const timestampStr = timestamp.includes("Z")
        ? timestamp
        : timestamp + "Z";
      messageTime = new Date(timestampStr);
    } else {
      messageTime = new Date(timestamp);
    }

    // Check if the date is valid
    if (isNaN(messageTime.getTime())) {
      return "Just now";
    }

    const diffInSeconds = Math.floor((now - messageTime) / 1000);

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

  // Function to detect platform from user input
  const detectPlatformFromInput = (inputText) => {
    if (!inputText || typeof inputText !== "string") return null;

    const text = inputText.toLowerCase();

    // First, check for explicit platform creation patterns (highest priority)
    // These patterns indicate the user wants to CREATE content FOR a specific platform
    const creationPatterns = {
      linkedin: [
        /\b(?:create|write|make|generate|draft|compose).*?(?:linkedin|linked in)\s+post\b/i,
        /\b(?:linkedin|linked in)\s+post\s+about\b/i,
        /\bpost\s+(?:on|to)\s+(?:linkedin|linked in)\b/i,
        /\bprofessional\s+post\s+(?:about|on)\b/i,
      ],
      twitter: [
        /\b(?:create|write|make|generate|draft|compose).*?(?:twitter|tweet|x)\s+post\b/i,
        /\b(?:twitter|tweet|x)\s+(?:post\s+)?about\b/i,
        /\bpost\s+(?:on|to)\s+(?:twitter|x)\b/i,
        /\btweet\s+about\b/i,
      ],
      instagram: [
        /\b(?:create|write|make|generate|draft|compose).*?instagram\s+post\b/i,
        /\binstagram\s+post\s+about\b/i,
        /\bpost\s+(?:on|to)\s+(?:instagram|insta|ig)\b/i,
        /\b(?:insta|ig)\s+post\s+about\b/i,
      ],
      facebook: [
        /\b(?:create|write|make|generate|draft|compose).*?(?:facebook|fb)\s+post\b/i,
        /\b(?:facebook|fb)\s+post\s+about\b/i,
        /\bpost\s+(?:on|to)\s+(?:facebook|fb)\b/i,
        /\bfb\s+post\s+about\b/i,
      ],
    };

    // Check creation patterns first (highest priority)
    for (const [platform, patterns] of Object.entries(creationPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return platform;
        }
      }
    }

    // Platform-specific action keywords (medium priority)
    const actionKeywords = {
      linkedin: [
        "linkedin post",
        "linked in post",
        "professional network post",
        "business network post",
        "career post",
        "professional update",
      ],
      twitter: [
        "twitter post",
        "tweet",
        "x post",
        "twitter thread",
        "x thread",
        "tweet about",
        "twitter update",
      ],
      instagram: [
        "instagram post",
        "insta post",
        "ig post",
        "instagram story",
        "visual post",
        "photo post",
      ],
      facebook: [
        "facebook post",
        "fb post",
        "facebook update",
        "fb update",
        "social media post",
      ],
    };

    // Check for action-based platform mentions
    for (const [platform, keywords] of Object.entries(actionKeywords)) {
      for (const keyword of keywords) {
        const regex = new RegExp(
          `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
          "i"
        );
        if (regex.test(text)) {
          return platform;
        }
      }
    }

    // General platform mentions (lower priority - only if no action context)
    const generalPlatformKeywords = {
      linkedin: ["linkedin", "linked in"],
      twitter: ["twitter", "x.com"],
      instagram: ["instagram", "insta"],
      facebook: ["facebook", "fb"],
    };

    // Only check general mentions if they appear in a creation context
    const hasCreationIntent =
      /\b(?:create|write|make|generate|draft|compose|post)\b/i.test(text);
    if (hasCreationIntent) {
      for (const [platform, keywords] of Object.entries(
        generalPlatformKeywords
      )) {
        for (const keyword of keywords) {
          const regex = new RegExp(
            `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
            "i"
          );
          if (regex.test(text)) {
            return platform;
          }
        }
      }
    }

    // Context-based detection (lowest priority)
    const contextKeywords = {
      linkedin: [
        "professional",
        "career",
        "business",
        "networking",
        "industry",
        "corporate",
        "work",
        "job",
        "company",
        "leadership",
      ],
      twitter: [
        "trending",
        "hashtag",
        "viral",
        "breaking news",
        "quick update",
        "short post",
        "brief",
      ],
      instagram: [
        "visual",
        "photo",
        "image",
        "aesthetic",
        "lifestyle",
        "creative",
        "artistic",
        "visual content",
      ],
      facebook: [
        "community",
        "friends",
        "family",
        "social",
        "personal update",
        "life update",
      ],
    };

    // Only use context-based detection if there's clear creation intent
    if (hasCreationIntent) {
      const contextScores = {};
      for (const [platform, keywords] of Object.entries(contextKeywords)) {
        contextScores[platform] = 0;
        for (const keyword of keywords) {
          const regex = new RegExp(
            `\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
            "i"
          );
          if (regex.test(text)) {
            contextScores[platform]++;
          }
        }
      }

      // Return platform with highest context score (minimum 2 matches required)
      const maxScore = Math.max(...Object.values(contextScores));
      if (maxScore >= 2) {
        return Object.keys(contextScores).find(
          (platform) => contextScores[platform] === maxScore
        );
      }
    }

    return null; // No platform detected
  };

  // New state for image analysis - integrated with chat
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);

  // New state for video upload
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  // State for edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalEditingContent, setModalEditingContent] = useState(null);

  // State for media preview modal
  const [showMediaPreview, setShowMediaPreview] = useState(false);
  const [previewMediaUrl, setPreviewMediaUrl] = useState(null);
  const [previewMediaType, setPreviewMediaType] = useState(null); // 'image' or 'video'

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const imageAnalysisFileInputRef = useRef(null);
  const navigate = useNavigate();

  const texts = [
    "Thinking...",
    "Brewing your ideas…",
    "Just a sec…",
    "Tweaking the details…",
    "Loading inspiration, just for you…",
    "Aligning words with your style…",
    "Alfred is getting creative…",
    "Shaping a post in your unique voice…",
    "Almost ready to dazzle your audience…",
    "Tweaking ideas for maximum impact…",
    "Content is getting its glow-up…",
    "Aligning words with your style…",
    "Creating magic, one post at a time…",
    "Getting your post ready…",
    "Nearly there, stay tuned…",
    "Final touches…"
  ];
  const [currentText, setCurrentText] = useState(texts[0]);

  useEffect(() => {
    if (!loading) return;

    let index = 0;
    const interval = setInterval(() => {
      if (index < texts.length - 1) {
        index += 1;
        setCurrentText(texts[index]);
      } else {
        clearInterval(interval);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [loading]);

  // Lightweight IndexedDB image cache so user-uploaded previews persist across refresh
  const CHAT_IMAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // keep for ~7 days
  const imageCache = {
    open: () =>
      new Promise((resolve, reject) => {
        try {
          const request = window.indexedDB.open("simbli_chat_images", 1);
          request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains("images")) {
              const store = db.createObjectStore("images", { keyPath: "key" });
              store.createIndex("timestamp", "timestamp", { unique: false });
            }
          };
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        } catch (err) {
          resolve(null);
        }
      }),
    put: async (key, blob) => {
      try {
        const db = await imageCache.open();
        if (!db) return false;
        return await new Promise((resolve, reject) => {
          const tx = db.transaction("images", "readwrite");
          tx.objectStore("images").put({ key, blob, timestamp: Date.now() });
          tx.oncomplete = () => resolve(true);
          tx.onerror = () => reject(tx.error);
        });
      } catch (_) {
        return false;
      }
    },
    get: async (key) => {
      try {
        const db = await imageCache.open();
        if (!db) return null;
        return await new Promise((resolve, reject) => {
          const tx = db.transaction("images", "readonly");
          const req = tx.objectStore("images").get(key);
          req.onsuccess = () => resolve(req.result?.blob || null);
          req.onerror = () => reject(req.error);
        });
      } catch (_) {
        return null;
      }
    },
    cleanup: async (maxAgeMs) => {
      try {
        const db = await imageCache.open();
        if (!db) return false;
        return await new Promise((resolve) => {
          const tx = db.transaction("images", "readwrite");
          const store = tx.objectStore("images");
          const allReq = store.getAll();
          allReq.onsuccess = () => {
            const now = Date.now();
            (allReq.result || []).forEach((rec) => {
              if (!rec?.timestamp || now - rec.timestamp > maxAgeMs) {
                try {
                  store.delete(rec.key);
                } catch (_) {}
              }
            });
            resolve(true);
          };
          allReq.onerror = () => resolve(false);
        });
      } catch (_) {
        return false;
      }
    },
  };

  // Function to check if user email is in the special list for 25MB uploads
  const isSpecialUserForLargeUploads = (userEmail) => {
    console.log(`isSpecialUserForLargeUploads: ${userEmail}`);
    // Add specific email IDs that can upload 25MB files
    const specialEmails = [
      "crvenk@gmail.com",
      "crv@dci.in",
      "test@simbli.ai"
      // "mohamadhuashik.sherali@dci.in"
      // Add more email addresses as needed
    ];
    
    return specialEmails.includes(userEmail?.toLowerCase());
  };

  const generateImageKey = () =>
    window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `img_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  // Regeneration badge helpers (persist across components for a short window)
  const getRegeneratedMap = () => {
    try {
      return JSON?.parse(
        localStorage?.getItem("simbli_regenerated_map") || "{}"
      );
    } catch (_) {
      return {};
    }
  };
  const setRegeneratedMark = (contentId) => {
    try {
      const map = getRegeneratedMap();
      map[String(contentId)] = Date.now();
      localStorage?.setItem("simbli_regenerated_map", JSON?.stringify(map));
    } catch (_) {}
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

  // const ensurePlatformConnected = async (platform) => {
  //   try {
  //     const token = localStorage?.getItem("access-token");
  //     const headers = token ? { Authorization: `Bearer ${token}` } : {};
  //     const resp = await axios.get("/auth/social-connections", { headers });
  //     const normalize = (p) =>
  //       typeof p === "string"
  //         ? p.toLowerCase()
  //         : (p?.value || p || "").toString().toLowerCase();
  //     const list = Array.isArray(resp.data) ? resp.data : [];
  //     const found = list.find((c) => normalize(c.platform) === platform);
  //     const connected = Boolean(found?.is_connected ?? found?.connected);
  //     if (connected) return true;

  //     await Swal.fire({
  //       text: `You have not connected your ${
  //         platform === "twitter"
  //           ? "X"
  //           : platform.charAt(0).toUpperCase() + platform.slice(1)
  //       } account yet. Connect now to publish or schedule.`,
  //       background: "#09090B",
  //       color: "#E5E7EB",
  //       showCancelButton: true,
  //       confirmButtonText: "Connect",
  //       cancelButtonText: "Cancel",
  //       buttonsStyling: false,
  //       width: 460,
  //       customClass: {
  //         popup: "swal2-popup-custom",
  //         confirmButton: "swal2-confirm-custom",
  //         cancelButton: "swal2-cancel-custom",
  //       },
  //     });
  //     // If confirmed, redirect to Social tab
  //     const result = await Swal.getPopup(); // getPopup does not return result; adjust: we need the result from first fire
  //     // Instead capture result directly
  //     return false;
  //   } catch (e) {
  //     // On error, still route user to connections flow
  //     return false;
  //   }
  // };

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

  // Fetch Ayrshare profile and connections
  const fetchAyrshareData = async () => {
    try {
      setAyrshareLoading(true);
      console.log("Fetching Ayrshare data...");

      // Try to load from localStorage first
      const storedProfile = loadProfileFromStorage();
      if (storedProfile) {
        console.log("Loaded Ayrshare profile from storage:", storedProfile);
        setAyrshareProfile(storedProfile);
        await loadAyrshareConnections();
        return;
      }

      // If no stored profile, try to get from API
      console.log("No stored profile, fetching from API...");
      const profileResponse = await getAyrshareProfile();
      if (profileResponse.data) {
        console.log("Loaded Ayrshare profile from API:", profileResponse.data);
        setAyrshareProfile(profileResponse.data);
        await loadAyrshareConnections();
      } else {
        console.log("No Ayrshare profile found in API response");
      }
    } catch (err) {
      console.log("Could not load Ayrshare profile:", err);
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

      if (response?.data && response?.data.accounts) {
        console.log("Ayrshare connected accounts:", response?.data.accounts);

        // Filter out invalid accounts
        const validAccounts = response?.data.accounts.filter((account) => {
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

        console.log("Valid Ayrshare accounts after filtering:", validAccounts);
        setAyrshareConnections(validAccounts);
      } else {
        console.log("No accounts found in Ayrshare response:", response?.data);
        setAyrshareConnections([]);
      }
    } catch (err) {
      console.log("Could not load Ayrshare connections:", err);
      setAyrshareConnections([]);
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

    if (found && found.is_connected && found.profile_info) {
      // Use platform-specific profile data from the API response
      const profileInfo = found.profile_info;
      console.log("Profile info for", selectedPlatform, ":", profileInfo);

      if (selectedPlatform === "linkedin") {
        setUserProfile({
          name:
            profileInfo.name ||
            (profileInfo.given_name && profileInfo.family_name
              ? `${profileInfo.given_name} ${profileInfo.family_name}`
              : profileInfo.given_name || profileInfo.family_name || "User"),
          title: profileInfo.headline || "Social Media User",
          company: profileInfo.company || "Building Simbli's AI Agent Suite",
          platform: selectedPlatform,
          profileImage:
            profileInfo.picture || profileInfo.profile_picture_url || null,
          isConnected: true,
        });
      } else if (selectedPlatform === "twitter") {
        setUserProfile({
          name: profileInfo.name || "User",

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
        title: "Social Media User",
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
        ayrshareConnections: ayrshareConnections?.length,
        isAyrshareConnected,
        platform,
        accounts: ayrshareConnections.map((a) => ({
          platform: a.platform,
          is_active: a.is_active,
        })),
      });

      if (isAyrshareConnected) return true;

      // Fallback to original social connections check
      const token = localStorage?.getItem("access-token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const resp = await axios.get("/auth/social-connections", { headers });
      const normalize = (p) =>
        typeof p === "string"
          ? p.toLowerCase()
          : (p?.value || p || "").toString().toLowerCase();
      const list = Array.isArray(resp.data) ? resp.data : [];
      const found = list.find((c) => normalize(c.platform) === platform);
      const connected = Boolean(found?.is_connected ?? found?.connected);

      console.log(`Original social connections check for ${platform}:`, {
        found,
        connected,
        list: list.map((c) => ({
          platform: c.platform,
          is_connected: c.is_connected,
        })),
      });

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
          const closeBtn = document.getElementById("swal-close-btn");
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
        onNavigateToSocial();
        // navigate(`/dashboard?tab=social`);
      }
      return false;
    } catch (err) {
      onNavigateToSocial();
      // navigate(`/dashboard?tab=social`);
      return false;
    }
  };

  // Helper function to clean content text from raw JSON
  const cleanContentText = (contentText) => {
    if (!contentText) return "No content available";

    // Check if content is raw JSON and handle it
    if (typeof contentText === "string" && contentText.trim().startsWith("{")) {
      try {
        // First try a direct parse
        const parsed = JSON?.parse(contentText);
        const text = parsed.content_text || "";
        // Unescape any stray backslash-escaped quotes or slashes
        return text
          .replace(/\\n/g, "\n")
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'")
          .replace(/\\\\/g, "\\");
      } catch (e) {
        // Try regex extraction as fallback
        const match = contentText.match(
          /"content_text":\s*"([\s\S]*?)"\s*(,|\})/
        );
        if (match) {
          const raw = match[1];
          return raw
            .replace(/\\n/g, "\n")
            .replace(/\\r/g, "")
            .replace(/\\"/g, '"')
            .replace(/\\'/g, "'")
            .replace(/\\\\/g, "\\");
        }
        return "Content display error - please regenerate content";
      }
    }
    console.log("CleanedCont",contentText)
    return contentText;
  };

  // Strict sanitizer: remove markdown symbols, escape sequences and slashes, keep lists/numbering
  const sanitizePlainText = (text) => {
    if (!text) return "";
    let out = String(text);
    // Decode common escaped sequences first
    console.log("out--",out)
    out = out.replace(/\\n/g, "\n").replace(/\\r/g, "").replace(/\\t/g, " ");
    // Preserve http(s):// temporarily
    console.log("out--",out)
    out = out.replace(/https?:\/\//g, (m) => m.replace("://", "__PROTOCOL__"));
    // Remove remaining backslashes and double forward slashes
    console.log("out--",out)
    out = out.replace(/\\+/g, "");
    console.log("out--",out)
    out = out.replace(/\/\/+?/g, " ");
    console.log("out--",out)
    // Restore protocols
    out = out.replace(/__PROTOCOL__/g, "://");
    console.log("out--",out)
    // Strip markdown headings at start of line
    // out = out.replace(/^\s*#{1,6}\s*/gm, "");
    console.log("out--",out)
    // Strip bold/italic/backticks/underscore emphasis markers
    out = out.replace(/\*\*([^*]+)\*\*/g, "$1");
    console.log("out--",out)
    out = out.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1");
    console.log("out--",out)
    out = out.replace(/__([^_]+)__/g, "$1");
    console.log("out--",out)
    out = out.replace(/_([^_]+)_/g, "$1");
    out = out.replace(/`+/g, "");
    console.log("out--",out)
    // Remove hashtags from content text (handle both "#AI" and "# AI")
    out = out.replace(/#\s*[a-zA-Z0-9_]+/g, "");
    console.log("out--",out)
    // Normalize bullets: convert leading '-' or '*' to '• '
    out = out.replace(/^\s*[\*-]\s+/gm, "• ");
    console.log("out--",out)
    // Collapse excessive spaces
    out = out.replace(/[ \t]+/g, " ");
    console.log("out--",out)
    return out.trim();
  };

  // Helper function to format content for UI display with proper structure
  // Keeps markdown formatting but adds proper line breaks for structure
  const formatContentForUI = (contentText) => {
    if (!contentText) return "No content available";

    // Clean the content first
    const cleanedContent = sanitizePlainText(cleanContentText(contentText));
    // Add proper grammatical structure and line breaks
    let result = cleanedContent;
    // Fix cases where number marker is separated from its text by one or more line breaks
    result = result.replace(/(\d+\.)\s*(?:\r?\n)+\s+/g, "$1 ");
    // Ensure each numbered item starts on a new line
    // Handles "1. A 2. B" and similar compact forms
    result = result
      .replace(/(\d+\.\s+[^,]*?),\s*(?=\d+\.)/g, "$1\n") // split when comma-separated
      .replace(/([^\n])\s*(\d+\.\s+)/g, "$1\n$2"); // split when just spaced

    // Add line break after the last numbered point if it's followed by text
    // Pattern: "3. Point. Some text" -> "3. Point.\n\nSome text"
    result = result.replace(/(\d+\.\s+[^.]*\.)\s*([A-Z])/g, "$1\n$2");

    // Fix cases where bullet marker is separated from its text by one or more line breaks
    result = result.replace(/(•)\s*(?:\r?\n)+\s+/g, "$1 ");

    // Ensure each bullet starts on its own line
    // Split comma-separated bullets and inline bullets
    result = result
      .replace(/(•\s+[^•]*?),\s*(?=•)/g, "$1\n") // comma-separated
      .replace(/(?<!\n)\s*•\s+/g, "\n• "); // inline bullets

    // Add line break before bullet points if they're in a sentence
    // Pattern: "include: • Point" -> "include:\n• Point"
    result = result.replace(/([a-z]):\s*(•)/g, "$1:\n$2");

    // Clean up the result
    result = result.trim();

    // Remove excessive empty lines (max 2 consecutive)
    result = result.replace(/\n{3,}/g, "\n\n");

    return result;
  };

  // Remove any hashtags present in the provided hashtags array from the given text
  // Handles "#Tag", "# Tag", and standalone "Tag" occurrences.
  const stripProvidedHashtags = (text, hashtags) => {
    console.log("text",text)
 console.log("hashtags",hashtags)
    if (!text) return text;
    const tags = Array.isArray(hashtags)
      ? hashtags
          .map((h) => String(h || "").replace(/^#\s*/, ""))
          .filter((t) => t.length > 0)
      : [];
      if (tags.length === 0) return text;
      console.log("tags",tags)

    let out = String(text);
     console.log("out",out)

    tags.forEach((tag) => {
      const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
       console.log("escaped",escaped)
      // Remove with hash (e.g., "#Tag" or "# Tag")
      out = out.replace(new RegExp(`#\\s*${escaped}\\b`, "gi"), "");
    console.log("out----",out)

      // Remove standalone token when it appears as a separate word/line
      // out = out.replace(new RegExp(`(^|\\s)${escaped}\\b`, "g"), "$1");
       console.log("out===",out)

    });

    // Normalize spaces and blank lines after removals
    out = out
      .replace(/[\t ]+/g, " ")
      .replace(/^\s*$/gm, "")
      .replace(/\n{3,}/g, "\n\n");
      
      console.log("Finalout",out)

    return out.trim();
  };

  const removeHashtags = (text) => {
  if (!text) return "";

  // Remove all hashtags (#tag or # tag)
  let out = text.replace(/#\s*\S+/g, "");

  // Normalize spaces and blank lines
  out = out
    .replace(/[\t ]+/g, " ")      // multiple spaces/tabs → single space
    .replace(/^\s*$/gm, "")       // remove empty lines
    .replace(/\n{3,}/g, "\n\n");  // max 2 consecutive newlines

  return out.trim();
};

  // Helper function to format content for all social media platforms
  // Removes all markdown formatting while maintaining structure and readability
  const formatContentForSocialMedia = (contentText) => {
    console.log("contentText",contentText)
    if (!contentText) return "No content available";

    // Clean the content first
    const cleanedContent = sanitizePlainText(cleanContentText(contentText));
    console.log('cleanedContent',cleanedContent)
    // Already sanitized above
    let processedContent = cleanedContent;

    // Add proper grammatical structure and line breaks
    let result = processedContent;
    // Fix cases where number marker is separated from its text by one or more line breaks
    result = result.replace(/(\d+\.)\s*(?:\r?\n)+\s+/g, "$1 ");
   console.log("result-1",result)
    // Ensure each numbered item starts on a new line
    result = result
      .replace(/(\d+\.\s+[^,]*?),\s*(?=\d+\.)/g, "$1\n\n") // comma-separated
      .replace(/([^\n])\s*(\d+\.\s+)/g, "$1\n\n$2"); // inline
      console.log("result-2",result)

    // Add line break after the last numbered point if it's followed by text
    // Pattern: "3. Point. Some text" -> "3. Point.\n\nSome text"
    result = result.replace(/(\d+\.\s+[^.]*\.)\s*([A-Z])/g, "$1\n\n$2");
console.log("result-3",result)
    // Fix cases where bullet marker is separated from its text by one or more line breaks
    result = result.replace(/(•)\s*(?:\r?\n)+\s+/g, "$1 ");
console.log("result-4",result)
    // Ensure each bullet starts on its own line
    result = result
      .replace(/(•\s+[^•]*?),\s*(?=•)/g, "$1\n") // comma-separated
      .replace(/(?<!\n)\s*•\s+/g, "\n• "); // inline bullets
console.log("result-5",result)
    // Add line break before bullet points if they're in a sentence
    // Pattern: "include: • Point" -> "include:\n• Point"
    result = result.replace(/([a-z]):\s*(•)/g, "$1:\n$2");
console.log("result-6",result)
    // Clean up the result
    result = result.trim();
console.log("result-7",result)
    // Remove excessive empty lines (max 2 consecutive)
    result = result.replace(/\n{3,}/g, "\n\n");
    console.log("result-8",result)
    return result;
  };

  // Twitter/X char limit helpers for chat interface
  const getChatCurrentCharCount = () => {
    try {
      const base = currentContent?.content_text || "";
      return formatContentForSocialMedia(base).length;
    } catch (_) {
      return 0;
    }
  };
  const isChatOverTwitterLimit =
    selectedPlatform === "twitter" && getChatCurrentCharCount() > 280;

  // Per-message helpers
  const isTwitterOverLimitFor = (text) => {
    try {
      return (
        selectedPlatform === "twitter" &&
        formatContentForSocialMedia(text || "").length > 280
      );
    } catch (_) {
      return false;
    }
  };
  const getTwitterCharCountFor = (text) => {
    try {
      return formatContentForSocialMedia(text || "").length;
    } catch (_) {
      return 0;
    }
  };

  // Validate selected schedule is strictly in the future (not present/past)
  const isFutureSchedule = (() => {
    try {
      if (!scheduleDate || !scheduleTime) return false;
      const selected = new Date(`${scheduleDate}T${scheduleTime}`);
      if (isNaN(selected.getTime())) return false;
      return selected.getTime() > Date.now();
    } catch (_) {
      return false;
    }
  })();

  const platforms = [
    {
      value: "linkedin",
      label: "LinkedIn",
      color: "bg-[#0A66C3]",
      directPublish: true,
    },
    {
      value: "twitter",
      label: "X",
      color: "bg-black",
      directPublish: true,
    },
    {
      value: "instagram",
      label: "Instagram",
      color: "bg-pink-600",
      directPublish: true,
    },
    {
      value: "facebook",
      label: "Facebook",
      color: "bg-[#0A66C3]",
      directPublish: true,
    },
  ];

  const scrollToBottom = () => {
    // Try multiple scroll containers and methods to ensure we reach the absolute bottom
    const scrollContainers = [
      document.querySelector(".overflow-y-auto"),
      document.querySelector("main"),
      document.querySelector("body"),
      document.documentElement,
    ].filter(Boolean);

    // Method 1: Try each scroll container
    scrollContainers.forEach((container) => {
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });

    // Method 2: Force scroll to bottom with a small offset to ensure we're at the very end
    setTimeout(() => {
      scrollContainers.forEach((container) => {
        if (container) {
          container.scrollTop = container.scrollHeight + 100;
        }
      });
    }, 10);

    // Method 3: Also use scrollIntoView as backup
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 50);

    // Method 4: Use window.scrollTo as final fallback
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-scroll to bottom when component mounts (every visit)
  useEffect(() => {
    // Multiple attempts with increasing delays to ensure content is fully rendered
    const timers = [
      setTimeout(() => scrollToBottom(), 100),
      setTimeout(() => scrollToBottom(), 300),
      setTimeout(() => scrollToBottom(), 500),
    ];

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []); // Empty dependency array means this runs only on mount

  // Clean up blob URLs after messages are updated
  useEffect(() => {
    // No-op: we purposely keep blob URLs alive while message is visible.
    // Periodically clean old cached images.
    imageCache.cleanup(CHAT_IMAGE_TTL_MS).catch(() => {});
  }, [messages]);

  // Restore user-uploaded images from IndexedDB on mount (after refresh)
  useEffect(() => {
    const restoreAllUserImagesFromCache = async () => {
      try {
        const withImages = (messages || []).filter(
          (m) => m?.type === "user" && m?.hasImage && m?.imageKey
        );
        if (withImages.length === 0) return;
        const updated = await Promise.all(
          withImages.map(async (m) => {
            try {
              const blob = await imageCache.get(m.imageKey);
              if (!blob) return null;
              const url = URL.createObjectURL(blob);
              return { id: m.id, url };
            } catch (_) {
              return null;
            }
          })
        );
        const map = new Map(updated.filter(Boolean).map((r) => [r.id, r.url]));
        if (map.size > 0) {
          setMessages((prev) =>
            prev.map((m) =>
              map.has(m.id) ? { ...m, imageUrl: map.get(m.id) } : m
            )
          );
        }
      } catch (_) {}
    };
    restoreAllUserImagesFromCache();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch social connections on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchSocialConnections();
      fetchAyrshareData();
    }
  }, [isAuthenticated]);

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
    if (ayrshareConnections?.length > 0) {
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

  // Manual refresh function for Ayrshare connections
  const refreshAyrshareConnections = async () => {
    console.log("Manually refreshing Ayrshare connections...");
    if (ayrshareProfile) {
      await loadAyrshareConnections();
    } else {
      await fetchAyrshareData();
    }
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

  // Helper function to collect media URLs from currentContent (unified approach using image_url)
  const getMediaUrlsFromContent = (content) => {
    const mediaUrls = [];
    if (content?.image_url) {
      const mediaUrl = buildMediaUrl(content.image_url);
      console.log("Media URL transformation:", {
        original: content.image_url,
        processed: mediaUrl,
      });
      if (mediaUrl) mediaUrls.push(mediaUrl);
    }
    console.log("Media URLs:", mediaUrls);
    return mediaUrls;
  };

  // Fallback: if a user message image fails to load, try to restore from cache
  const handleUserImageError = async (message) => {
    try {
      if (!message?.imageKey) return;
      const blob = await imageCache.get(message.imageKey);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, imageUrl: url } : m))
      );
    } catch (_) {}
  };
  const [plan, setPlan] = useState();
  // const handleSendMessage = async () => {
  //   if (!input.trim() || loading) return;
  //   if (input.length > MAX_INPUT_LENGTH) return;

  //   // Check if user is blocked from chatting
  //   try {
  //     console.log("Checking chat block status...");
  //     const blockStatusResponse = await checkChatBlockStatusApi();
  //     console.log("Chat block status response:", blockStatusResponse.data);

  //     const { chat_blocked, available_plans, plan } =
  //       blockStatusResponse.data?.data;

  //     if (chat_blocked) {
  //       console.log(
  //         "User is blocked from chatting. Available plans:",
  //         available_plans
  //       );
  //       setChatBlocked(true);
  //       setAvailablePlans(available_plans || []);
  //       setPlan(plan);
  //       setShowPricingPopup(true);
  //       return; // Stop execution if user is blocked
  //     }
  //   } catch (error) {
  //     console.error("Error checking chat block status:", error);
  //     // Continue with normal flow if API call fails
  //   }

  //   // Store image data before clearing state
  //   const currentUploadedImage = uploadedImage;
  //   const currentImagePreview = imagePreview;

  //   // Persist user image to IndexedDB so it survives refresh; tag message with key
  //   let imageKey = null;
  //   if (currentUploadedImage) {
  //     try {
  //       imageKey = generateImageKey();
  //       await imageCache.put(imageKey, currentUploadedImage);
  //     } catch (_) {
  //       /* ignore */
  //     }
  //   }

  //   const userMessage = {
  //     id: Date.now(),
  //     type: "user",
  //     content: input,
  //     timestamp: new Date().toISOString(),
  //     hasImage: !!currentUploadedImage,
  //     imageUrl: currentImagePreview,
  //     imageKey,
  //   };

  //   setMessages((prev) => [...prev, userMessage]);

  //   // Detect platform from user input and auto-select it
  //   const detectedPlatform = detectPlatformFromInput(input);
  //   if (detectedPlatform && detectedPlatform !== selectedPlatform) {
  //     setSelectedPlatform(detectedPlatform);
  //     console.log(
  //       `Platform auto-detected: ${detectedPlatform} from input: "${input}"`
  //     );
  //   }

  //   setInput("");
  //   setLoading(true);
  //   // Don't reset publishSuccessMap - keep previous success states
  //   setCopiedUrl(false); // Reset copy state
  //   setPublishing(false); // Reset publishing state

  //   // Clear image preview immediately when user submits
  //   setUploadedImage(null);
  //   setImagePreview(null);

  //   // Don't revoke the URL immediately - let the image render first
  //   // We'll clean it up after the message is displayed

  //   try {
  //     // Store input before clearing for the API call
  //     const userInput = input || userMessage.content;

  //     let response;

  //     // Check if we have an image uploaded - if so, use image analysis API
  //     if (currentUploadedImage) {
  //       setAnalyzingImage(true);

  //       // Create FormData for image analysis
  //       const formData = new FormData();
  //       formData.append("image", currentUploadedImage);
  //       formData.append("user_prompt", userInput);
  //       formData.append("platform", selectedPlatform);
  //       if (currentSessionId && /^\d+$/.test(String(currentSessionId))) {
  //         formData.append("session_id", String(currentSessionId));
  //       }

  //       // Send to image analysis API (use authenticated route when logged in)
  //       response = await analyzeImageApi(formData);

  //       // Image already cleared above, just stop analyzing
  //       setAnalyzingImage(false);

  //       if (response?.data.success) {
  //         // Add AI response with analysis
  //         const aiMessage = {
  //           id: Date.now() + 1,
  //           type: "ai",
  //           content: response?.data.image_analysis,
  //           timestamp: new Date().toISOString(),
  //           messageType: "image_analysis", // Mark this as image analysis
  //           suggestions: [
  //             "Create a LinkedIn post based on this analysis",
  //             "Generate relevant hashtags for this image",
  //             "Suggest content ideas for different platforms",
  //             "Analyze another image",
  //             "Ask for specific content recommendations",
  //           ],
  //           // Store the image analysis context
  //           imageAnalysisContext: {
  //             hasImage: true,
  //             userPrompt: userInput,
  //             platform: selectedPlatform,
  //             sessionId: currentSessionId,
  //           },
  //         };

  //         // Store this message in localStorage for persistence
  //         try {
  //           const existingMessages = JSON?.parse(
  //             localStorage?.getItem("simbli_chat_messages") || "[]"
  //           );
  //           const updatedMessages = [...existingMessages, aiMessage];
  //           localStorage?.setItem(
  //             "simbli_chat_messages",
  //             JSON?.stringify(updatedMessages)
  //           );
  //         } catch (error) {
  //           console.error(
  //             "Failed to store image analysis in localStorage:",
  //             error
  //           );
  //         }

  //         // If backend returned a new session_id, capture it so subsequent messages link to it
  //         try {
  //           if (
  //             response?.data?.session_id &&
  //             String(response?.data.session_id).length > 0
  //           ) {
  //             setCurrentSessionId(String(response?.data.session_id));
  //           }
  //         } catch {}

  //         setMessages((prev) => [...prev, aiMessage]);
  //       } else {
  //         // Handle error response
  //         const errorMessage = {
  //           id: Date.now() + 1,
  //           type: "error",
  //           content:
  //             response?.data.image_analysis ||
  //             "Failed to analyze image. Please try again.",
  //           timestamp: new Date().toISOString(),
  //           messageType: "chat",
  //         };

  //         setMessages((prev) => [...prev, errorMessage]);
  //       }
  //     } else {
  //       // Regular chat - use Groq API
  //       // Find the most recent image analysis message in the conversation
  //       const lastImageAnalysis = [...messages]
  //         .reverse()
  //         .find(
  //           (m) =>
  //             m?.messageType === "image_analysis" &&
  //             m?.imageAnalysisContext?.hasImage
  //         );
  //       const hasImageAnalysisContext = Boolean(lastImageAnalysis);

  //       // If we have image analysis context, include it in the request
  //       const requestData = {
  //         message: userInput,
  //         session_id: currentSessionId,
  //         userInput: userInput,
  //       };

  //       if (hasImageAnalysisContext) {
  //         requestData.image_analysis_context = {
  //           has_image: true,
  //           user_prompt: lastImageAnalysis.imageAnalysisContext.userPrompt,
  //           platform: lastImageAnalysis.imageAnalysisContext.platform,
  //           analysis_content: lastImageAnalysis.content,
  //         };
  //       }
  //       response = await sendChatMessageApi(requestData);

  //       const chatResponse = response?.data;
  //       console.log("chatResponse", chatResponse);
  //       // Update session ID if it's a new session
  //       if (!currentSessionId && chatResponse.session_id) {
  //         setCurrentSessionId(chatResponse.session_id);
  //       }

  //       // Store suggestions with the message
  //       const messageSuggestions = chatResponse.suggestions || [];

  //       // Handle different response types
  //       if (
  //         chatResponse.message_type === "content" &&
  //         chatResponse?.generated_content
  //       ) {
  //         // Content was generated - display as content message
  //         const generatedContent = chatResponse?.generated_content;

  //         // Check if this is an image regeneration (update existing message)
  //         const isImageRegeneration =
  //           userInput.toLowerCase().includes("regenerate image") ||
  //           userInput.toLowerCase().includes("new image") ||
  //           userInput.toLowerCase().includes("different image") ||
  //           userInput.toLowerCase().includes("change image");

  //         if (isImageRegeneration) {
  //           // For image regeneration, create a NEW content message with the same text but new image
  //           const regeneratedContent = {
  //             ...generatedContent,
  //             // Ensure we have the exact same text and hashtags from the original content
  //             content_text:
  //               generatedContent?.content_text || "Content text not available",
  //             hashtags: generatedContent?.hashtags || [],
  //             // The image_url is already updated in generatedContent
  //             isRegenerated: true, // Mark this as regenerated content
  //           };

  //           const aiMessage = {
  //             id: Date.now() + 1,
  //             type: "ai",
  //             content: regeneratedContent,
  //             timestamp: new Date().toISOString(),
  //             messageType: "content",
  //             suggestions: messageSuggestions,
  //           };

  //           setMessages((prev) => [...prev, aiMessage]);
  //           setCurrentContent(regeneratedContent);
  //           setEditedContent(
  //             regeneratedContent?.content_text ||
  //               "Content generation error - please try again"
  //           );
  //           setEditedHashtags(regeneratedContent?.hashtags || []);
  //         } else {
  //           // Regular content generation
  //           const aiMessage = {
  //             id: Date.now() + 1,
  //             type: "ai",
  //             content: generatedContent,
  //             timestamp: new Date().toISOString(),
  //             messageType: "content",
  //             suggestions: messageSuggestions,
  //           };

  //           setMessages((prev) => [...prev, aiMessage]);
  //           setCurrentContent(generatedContent);
  //           setEditedContent(
  //             generatedContent?.content_text ||
  //               "Content generation error - please try again"
  //           );
  //           setEditedHashtags(generatedContent?.hashtags || []);
  //         }
  //       } else {
  //         // Regular chat response
  //         const aiMessage = {
  //           id: Date.now() + 1,
  //           type: "ai",
  //           content: chatResponse.content,
  //           timestamp: new Date().toISOString(),
  //           messageType: "chat",
  //           suggestions: messageSuggestions,
  //         };

  //         setMessages((prev) => [...prev, aiMessage]);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Chat error:", error);

  //     // Add error message to chat
  //     let errorContent =
  //       "Sorry, I encountered an error while processing your message. Please try again.";

  //     if (
  //       error.response?.status === 503 &&
  //       error.response?.data?.detail?.includes("Image analysis service")
  //     ) {
  //       errorContent =
  //         "Image analysis service is currently unavailable. Please check your Gemini API configuration or try again later.";
  //     } else if (
  //       error.message ===
  //       "User not authenticated. Please log in to use the chat."
  //     ) {
  //       errorContent =
  //         "Please log in to use the chat. You need to be authenticated to send messages.";
  //     } else if (error.response?.status === 401) {
  //       errorContent = "Authentication failed. Please log in again.";
  //     } else if (error.response?.status === 500) {
  //       errorContent = "Server error. Please try again later.";
  //     } else if (error.response?.status === 400) {
  //       errorContent =
  //         error.response?.data?.detail ||
  //         "Invalid request. Please check your input and try again.";
  //     }

  //     const errorMessage = {
  //       id: Date.now() + 1,
  //       type: "error",
  //       content: errorContent,
  //       timestamp: new Date().toISOString(),
  //       messageType: "chat",
  //       suggestions: [],
  //     };
  //     setMessages((prev) => [...prev, errorMessage]);

  //     // Image already cleared above, just stop analyzing if needed
  //     if (currentUploadedImage) {
  //       setAnalyzingImage(false);
  //     }
  //   } finally {
  //     setLoading(false);
  //   }
  // };



const handleSendMessage = async () => {
  if (!input.trim() || loading) return;
  if (input.length > MAX_INPUT_LENGTH) return;

  // Check if user is blocked from chatting
  try {
    const blockStatusResponse = await checkChatBlockStatusApi();
    const { chat_blocked, available_plans, plan } =
      blockStatusResponse.data?.data;

    if (chat_blocked) {
      setChatBlocked(true);
      setAvailablePlans(available_plans || []);
      setPlan(plan);
      setShowPricingPopup(true);
      return;
    }
  } catch (error) {
    console.error("Error checking chat block status:", error);
  }

  // Save uploaded image and preview before clearing
  const currentUploadedImage = uploadedImage;
  const currentImagePreview = imagePreview;

  // Cache image in IndexedDB
  let imageKey = null;
  if (currentUploadedImage) {
    try {
      imageKey = generateImageKey();
      await imageCache.put(imageKey, currentUploadedImage);
    } catch (_) {}
  }

  // Create user message
  const userMessage = {
    id: Date.now(),
    type: "user",
    content: input,
    timestamp: new Date().toISOString(),
    hasImage: !!currentUploadedImage,
    imageUrl: currentImagePreview,
    imageKey,
  };
  setMessages((prev) => [...prev, userMessage]);

  // Auto-detect platform
  const detectedPlatform = detectPlatformFromInput(input);
  if (detectedPlatform && detectedPlatform !== selectedPlatform) {
    setSelectedPlatform(detectedPlatform);
  }

  // Reset states
  setInput("");
  setShowScrollbar(false);
  setChatLoading(true); // Use context state - persists across tab switches
  setCopiedUrl(false);
  // Don't clear publishing state here - let it persist until publishing completes
  // clearPublishingState();
  setUploadedImage(null);
  setImagePreview(null);
  
  // Reset textarea height to normal after sending
  setTimeout(() => {
    const textarea = document.querySelector('textarea[placeholder*="Ask"]');
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = "20px"; // Reset to normal single line height
    }
  }, 0);

  try {
    const userInput = input || userMessage.content;
    let formData;
    let requestData;

    if (currentUploadedImage) {
      formData = new FormData();
      formData.append("message", userInput);
      formData.append("session_id", currentSessionId || "");
      formData.append("platform", selectedPlatform || "");
      formData.append("image", currentUploadedImage);
    } else {
      requestData = {
        message: userInput,
        session_id: currentSessionId,
        userInput: userInput,
      };
    }

    // Attach image analysis context if available
    const lastImageAnalysis = [...messages]
      .reverse()
      .find(
        (m) =>
          m?.messageType === "image_analysis" &&
          m?.imageAnalysisContext?.hasImage
      );

    if (lastImageAnalysis && formData) {
      formData.append(
        "image_analysis_context",
        JSON.stringify({
          has_image: true,
          user_prompt: lastImageAnalysis.imageAnalysisContext.userPrompt,
          platform: lastImageAnalysis.imageAnalysisContext.platform,
          analysis_content: lastImageAnalysis.content,
        })
      );
    }

    const apiSendingData = currentUploadedImage ? formData : requestData;
    const response = await sendChatMessageApi(apiSendingData);
    const chatResponse = response?.data;
    console.log("chatResponse",chatResponse)
    // Update session ID
    if (!currentSessionId && chatResponse.session_id) {
      setCurrentSessionId(chatResponse.session_id);
    }

    const messageSuggestions = chatResponse.suggestions || [];

    // 🟢 Handle content responses
    if (
      chatResponse.message_type === "content" &&
      chatResponse.generated_content
    ) {
      const generatedContent = chatResponse.generated_content;
      const userLower = userInput.toLowerCase();

      const isImageRegeneration =
        userLower.includes("regenerate image") ||
        userLower.includes("new image") ||
        userLower.includes("different image") ||
        userLower.includes("change image");

      if (isImageRegeneration) {
        // New regenerated content message
        const regeneratedContent = {
          ...generatedContent,
          content_text:
            generatedContent?.content_text || "Content text not available",
          hashtags: generatedContent?.hashtags || [],
          isRegenerated: true,
        };

        const aiMessage = {
          id: Date.now() + 1,
          type: "ai",
          conversational : chatResponse?.conversational,
          content: regeneratedContent,
          timestamp: new Date().toISOString(),
          messageType: "content",
          suggestions: messageSuggestions,
        };
console.log("aiMessages",aiMessage)
        setMessages((prev) => [...prev, aiMessage]);
        setCurrentContent(regeneratedContent);
        setEditedContent(regeneratedContent.content_text);
        setEditedHashtags(regeneratedContent.hashtags);
      } else {
        // Normal content message
        const aiMessage = {
          id: Date.now() + 1,
          type: "ai",
          content: generatedContent,
          conversational : chatResponse?.conversational,
          timestamp: new Date().toISOString(),
          messageType: "content",
          suggestions: messageSuggestions,
        };
console.log("aiMessages",aiMessage)
        setMessages((prev) => [...prev, aiMessage]);
        setCurrentContent(generatedContent);
        setEditedContent(generatedContent.content_text || "");
        setEditedHashtags(generatedContent.hashtags || []);
      }
    } else {
      // 🟡 Regular chat message
      const aiMessage = {
        id: Date.now() + 1,
        type: "ai",
        content: chatResponse.content,
        conversational : chatResponse?.conversational,
        timestamp: new Date().toISOString(),
        messageType: "chat",
        suggestions: messageSuggestions,
      };
console.log("aiMessages",aiMessage)
      setMessages((prev) => [...prev, aiMessage]);
    }
  } catch (error) {
    console.error("Chat error:", error);
    const errorContent =
      error.response?.data?.detail ||
      "Sorry, I encountered an error while processing your message. Please try again.";

    const errorMessage = {
      id: Date.now() + 1,
      type: "error",
      content: errorContent,
      timestamp: new Date().toISOString(),
      messageType: "chat",
      suggestions: [],
    };
    setMessages((prev) => [...prev, errorMessage]);
  } finally {
    setChatLoading(false); // Use context state - persists across tab switches
  }
};

  const handleImageUpload = async (file) => {
    console.log("handleImageUpload", file);
    if (!currentContent) {
      return;
    }
    setUploading(true);

    // Check file size based on user email
    const isSpecialUser = isSpecialUserForLargeUploads(user?.email);
     console.log("isSpecialUser",isSpecialUser)
    const maxSize = isSpecialUser ? 100 * 1024 * 1024 : 15 * 1024 * 1024; // 25MB for special users, 5MB for others
    const maxSizeMB = isSpecialUser ? 100 : 15;
    
    if (file.size > maxSize) {
      // alert(
      //   `File size must be less than ${maxSizeMB}MB. Your file is ${(
      //     file.size /
      //     (1024 * 1024)
      //   ).toFixed(2)}MB.`
      // );
      setUploading(false);
      return;
    }

    // Create a preview URL for immediate display
    const previewUrl = URL.createObjectURL(file);

    // Update currentContent immediately with preview
    setCurrentContent((prev) => ({
      ...prev,
      image_url: previewUrl,
    }));

    // Update the message in the messages array to show the uploaded image immediately
    setMessages((prev) =>
      prev.map((msg) =>
        msg.type === "ai" && msg.content.id === currentContent?.id
          ? {
              ...msg,
              content: {
                ...msg.content,
                image_url: previewUrl,
              },
            }
          : msg
      )
    );

    // Upload to server
    const formData = new FormData();
    formData.append("file", file);

    try {
      // const response = await uploadImageApi(currentContent?.id, formData);
      const response = await uploadMediaApi(currentContent?.id, formData);

      // Update with actual server URL
      const serverUrl = response?.data.image_url;
      setCurrentContent((prev) => ({
        ...prev,
        image_url: serverUrl,
      }));

      // Update messages with server URL
      setMessages((prev) =>
        prev.map((msg) =>
          msg.type === "ai" && msg.content.id === currentContent?.id
            ? {
                ...msg,
                content: {
                  ...msg.content,
                  image_url: serverUrl,
                },
              }
            : msg
        )
      );
      setUploading(false);
    } catch (error) {
      // Revert to original image on error
      setCurrentContent((prev) => ({
        ...prev,
        image_url: currentContent?.image_url,
      }));
      setUploading(false);
    }
  };

  const handleVideoUpload = async (file) => {
    if (!currentContent) {
      return;
    }
    setUploading(true);

    // Check file size based on user email
    const isSpecialUser = isSpecialUserForLargeUploads(user?.email);
     console.log("isSpecialUser",isSpecialUser)
    const maxSize = isSpecialUser ? 100 * 1024 * 1024 : 15 * 1024 * 1024; // 25MB for special users, 5MB for others
    const maxSizeMB = isSpecialUser ? 100 : 15;
    
    if (file.size > maxSize) {
      // alert(
      //   `File size must be less than ${maxSizeMB}MB. Your file is ${(
      //     file.size /
      //     (1024 * 1024)
      //   ).toFixed(2)}MB.`
      // );
      setUploading(false);
      return;
    }

    // Create a preview URL for immediate display
    const previewUrl = URL.createObjectURL(file);

    // Update currentContent immediately with preview
    setCurrentContent((prev) => ({
      ...prev,
      image_url: previewUrl,
    }));

    // Update the message in the messages array to show the uploaded video immediately
    setMessages((prev) =>
      prev.map((msg) =>
        msg.type === "ai" && msg.content.id === currentContent?.id
          ? {
              ...msg,
              content: {
                ...msg.content,
                image_url: previewUrl,
              },
            }
          : msg
      )
    );

    // Upload to server
    const formData = new FormData();
    formData.append("file", file);

    try {
      // const response = await uploadVideoApi(currentContent?.id, formData);
      const response = await uploadMediaApi(currentContent?.id, formData);
      // Update with actual server URL
      const serverUrl = response?.data.image_url;
      setCurrentContent((prev) => ({
        ...prev,
        image_url: serverUrl,
      }));

      // Update messages with server URL
      setMessages((prev) =>
        prev.map((msg) =>
          msg.type === "ai" && msg.content.id === currentContent?.id
            ? {
                ...msg,
                content: {
                  ...msg.content,
                  image_url: serverUrl,
                },
              }
            : msg
        )
      );
      setUploading(false);
    } catch (error) {
      // Revert to original media on error
      setCurrentContent((prev) => ({
        ...prev,
        image_url: currentContent?.image_url,
      }));
      setUploading(false);
    }
  };

  // Function to handle image file selection for analysis
  const handleImageFileSelect = (file) => {
    if (file && file.type.startsWith("image/")) {
      // Check file size based on user email
      const isSpecialUser = isSpecialUserForLargeUploads(user?.email);
      const maxSize = isSpecialUser ? 100 * 1024 * 1024 : 15 * 1024 * 1024; // 25MB for special users, 5MB for others
      const maxSizeMB = isSpecialUser ? 100 : 15;
      
      if (file.size > maxSize) {
        // alert(
        //   `File size must be less than ${maxSizeMB}MB. Your file is ${(
        //     file.size /
        //     (1024 * 1024)
        //   ).toFixed(2)}MB.`
        // );
        return;
      }

      setUploadedImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      // Don't clear input - let user type their prompt
    }
  };

  const handleGenerateImage = async () => {
    if (!currentContent) {
      return;
    }

    try {
      const response = await generateImageApi(currentContent?.id);
      setCurrentContent((prev) => ({
        ...prev,
        image_url: response?.data.image_url,
      }));
    } catch (error) {
      // Handle error silently
    }
  };

  const handleRegenerateImage = async (contentId) => {
    if (regeneratingContentId) return;
    
    // Check if user is blocked from generating images
    try {
      const imageLimitResponse = await checkImageLimitApi();
      const { image_limit_reached } = imageLimitResponse.data?.data;

      if (image_limit_reached) {
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

    setRegeneratingContentId(contentId);
    try {
      const response = await generateImageApi(contentId);

      // Update the message in the messages array
      setMessages((prev) =>
        prev.map((msg) =>
          msg.type === "ai" && msg.content.id === contentId
            ? {
                ...msg,
                content: {
                  ...msg.content,
                  image_url: response?.data.image_url,
                  isRegenerated: true,
                },
              }
            : msg
        )
      );

      // Update currentContent if it's the same
      if (currentContent?.id === contentId) {
        setCurrentContent((prev) => ({
          ...prev,
          image_url: response?.data.image_url,
          isRegenerated: true,
        }));
      }
      // Record regeneration for consistent badge display
      setRegeneratedMark(contentId);
    } catch (error) {
      // Handle error silently
    } finally {
      setRegeneratingContentId(null);
    }
  };

  const handlePublish = async (contentOverride) => {
    const contentToPublish = contentOverride || currentContent;
    if (!contentToPublish || publishingContentId === contentToPublish?.id) return; // Prevent multiple clicks per item

    // Guard: Block publish for X if content exceeds 280 chars
    try {
      const formattedForCount = formatContentForSocialMedia(
        contentToPublish?.content_text || ""
      );
      if (selectedPlatform === "twitter" && formattedForCount.length > 280) {
        return; // UI buttons are disabled already; this is a safety guard
      }
    } catch (_) {}

    setPublishingState(true, contentToPublish?.id); // Start publishing state - persists across tab switches

    try {
      // Refresh Ayrshare connections to ensure we have latest data
      if (ayrshareProfile) {
        await refreshAyrshareConnections();
      }

      // Ensure platform is connected before publishing
      const ok = await promptConnectIfNeeded(selectedPlatform);
      if (!ok) {
        clearPublishingState();
        return;
      }

      // For all social media platforms, format content to plain text while maintaining structure
      const formattedContent = {
        ...contentToPublish,
        content_text: formatContentForSocialMedia(contentToPublish?.content_text),
        hashtags: contentToPublish?.hashtags,
      };

      // Always add hashtags to the content text for Ayrshare (remove any existing hashtags first)
      if (contentToPublish?.hashtags && contentToPublish?.hashtags.length > 0) {
        const normalizedTags = contentToPublish?.hashtags
          .map((h) => (String(h).startsWith("#") ? String(h) : `#${String(h)}`))
          .join(" ");

        // Remove any existing hashtags from content text to avoid duplicates
        const contentWithoutHashtags = formattedContent.content_text
          .replace(/#\s*[a-zA-Z0-9_]+/g, "")
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
      if (ayrshareProfile && ayrshareConnections?.length > 0) {
        try {
          // Collect media URLs from currentContent
          const mediaUrls = getMediaUrlsFromContent(contentToPublish);
          // const mediaUrls = [
          //   "https://fastly.picsum.photos/id/354/1080/1080.jpg?hmac=y_pY2-y14V1kLVR-mYZvo3EguRMAWgZ7ssXgcIWdbGI",
          // ];
          // const mediaUrls = ["https://cdn.pixabay.com/video/2023/09/23/181977-867576065_tiny.mp4"];
          // const mediaUrls = ["https://cdn.pixabay.com/video/2023/09/23/181977-867576065_tiny.mp4","https://fastly.picsum.photos/id/354/1080/1080.jpg?hmac=y_pY2-y14V1kLVR-mYZvo3EguRMAWgZ7ssXgcIWdbGI"];

          console.log("Attempting Ayrshare publishing:", {
            profile_key: ayrshareProfile.profile_key,
            platform: selectedPlatform,
            connections: ayrshareConnections?.length,
            mediaUrls: mediaUrls,
            currentContent: {
              id: contentToPublish?.id,
              hasMedia: !!contentToPublish?.image_url,
              originalMediaUrl: contentToPublish?.image_url,
              processedMediaUrls: mediaUrls,
            },
          });

          console.log("Formatted content for Ayrshare:", formattedContent);
          // Call Ayrshare API to <publish></publish>
          const ayrshareResponse = await postToAyrshare(
            contentToPublish?.id,
            ayrshareProfile.profile_key,
            formattedContent.content_text,
            mediaUrls.length > 0 ? mediaUrls : null, // media parameter with image/video URLs
            [selectedPlatform], // platforms parameter
            formattedContent.hashtags // hashtags parameter
          );

          console.log(
            "Ayrshare API call completed with response:",
            ayrshareResponse
          );

          if (ayrshareResponse?.data) {
            // Successfully published via Ayrshare
            console.log(
              "Ayrshare publishing successful:",
              ayrshareResponse?.data
            );

            // Extract postUrl from platforms response
            let postUrl = null;
            console.log(
              "Ayrshare response platforms:",
              ayrshareResponse?.data.platforms
            );

            if (
              ayrshareResponse?.data.platforms &&
              ayrshareResponse?.data.platforms[selectedPlatform]
            ) {
              // Check if it's a direct URL or an object with postUrl
              const platformData =
                ayrshareResponse?.data.platforms[selectedPlatform];
              if (typeof platformData === "string") {
                postUrl = platformData;
              } else if (
                typeof platformData === "object" &&
                platformData.postUrl
              ) {
                postUrl = platformData.postUrl;
              } else if (typeof platformData === "object" && platformData.url) {
                postUrl = platformData.url;
              }
            }

            console.log("Extracted postUrl:", postUrl);

            setPublishSuccessMap((prev) => ({
              ...prev,
              [contentToPublish?.id]: {
                ...prev[contentToPublish?.id],
                [selectedPlatform]: {
                  success: true,
                  message: "Content published successfully via Ayrshare!",
                  postUrl: postUrl,
                  platform: selectedPlatform,
                  contentId: contentToPublish?.id,
                  testMode: false,
                  ayrsharePublished: true,
                },
              },
            }));
            return; // Exit early on success
          }
        } catch (ayrshareError) {
          console.log(
            "Ayrshare publishing failed, falling back to original method:",
            ayrshareError
          );
          // Continue to fallback method
        }
      } else {
        console.log("Ayrshare not available:", {
          hasProfile: !!ayrshareProfile,
          connectionsCount: ayrshareConnections?.length,
        });
      }

      console.log("Ayrshare publish response fallback:", ayrshareResponse);
      return;

      // Fallback to original publishing method
      const response = await axios.post(
        `/content/publish/${selectedPlatform}/${contentToPublish?.id}`,
        {
          // Send the formatted content for all platforms
          formatted_content: formattedContent,
        }
      );

      if (response?.data.success) {
        // Successfully published directly - show UI success message
        setPublishSuccessMap((prev) => ({
          ...prev,
          [contentToPublish?.id]: {
            ...prev[contentToPublish?.id], // Keep existing platform states
            [selectedPlatform]: {
              success: true,
              message:
                response?.data.message || "Content published successfully!",
              postUrl: response?.data.post_url,
              platform: response?.data.platform,
              contentId: contentToPublish?.id,
              testMode: response?.data.test_mode || false,
              linkedinError: response?.data.linkedin_error || null,
            },
          },
        }));
      } else {
        // Platform not supported for direct publishing, redirect to manual publish
        if (response?.data.publish_url) {
          window.open(response?.data.publish_url, "_blank");
        }
      }
    } catch (error) {
      console.error("Publishing error:", error);

      if (
        error.response?.status === 400 &&
        error.response?.data.detail?.includes("not connected")
      ) {
        // LinkedIn not connected - handle silently or show fallback
      } else if (
        error.response?.status === 401 &&
        error.response?.data.detail?.includes("token expired")
      ) {
        // Token expired - handle silently or show fallback
      } else {
        // Fallback to manual publishing
        try {
          const fallbackResponse = await getPublishUrlApi(selectedPlatform);
          const publishUrl = fallbackResponse.data.publish_url;
          window.open(publishUrl, "_blank");
        } catch (fallbackError) {
          // Handle error silently
        }
      }
    } finally {
      clearPublishingState(); // Clear publishing state - persists across tab switches until explicitly cleared
    }
  };

  const handleSchedule = async () => {
    if (!currentContent || scheduling || !scheduleDate || !scheduleTime) return;
    // Enforce future-only scheduling
    try {
      const selected = new Date(`${scheduleDate}T${scheduleTime}`);
      if (!(selected.getTime() > Date.now())) {
        Swal.fire({
          icon: "warning",
          title: "Invalid time",
          text: "Please choose a future date and time.",
          confirmButtonText: "OK",
          confirmButtonColor: "#2FB130",
        });
        return;
      }
    } catch (_) {
      return;
    }

    // Guard: Block schedule for X if content exceeds 280 chars
    try {
      const formattedForCount = formatContentForSocialMedia(
        currentContent?.content_text || ""
      );
      if (selectedPlatform === "twitter" && formattedForCount.length > 280) {
        return; // UI should also disable button; this is safety
      }
    } catch (_) {}

    setScheduling(true);

    try {
      console.log("reschedulePostId schedule:", reschedulePostId);

      // Ensure platform is connected before scheduling
      const ok = await promptConnectIfNeeded(selectedPlatform);
      if (!ok) {
        setScheduling(false);
        return;
      }

      // For all social media platforms, format content to plain text while maintaining structure
      const formattedContent = {
        ...currentContent,
        content_text: formatContentForSocialMedia(currentContent?.content_text),
        hashtags: currentContent?.hashtags,
      };

      // Always add hashtags to the content text for Ayrshare (remove any existing hashtags first)
      if (currentContent?.hashtags && currentContent?.hashtags.length > 0) {
        const normalizedTags = currentContent?.hashtags
          .map((h) => (String(h).startsWith("#") ? String(h) : `#${String(h)}`))
          .join(" ");

        // Remove any existing hashtags from content text to avoid duplicates
        const contentWithoutHashtags = formattedContent.content_text
          .replace(/#\s*[a-zA-Z0-9_]+/g, "")
          .trim();

        // Add hashtags to the cleaned content
        // formattedContent.content_text = `${contentWithoutHashtags}\n\n${normalizedTags}`;
        formattedContent.content_text = `${contentWithoutHashtags}`;
        console.log(
          "Formatted content for Ayrshare content text:",
          formattedContent.content_text
        );
      }

      // Convert local time to UTC for Ayrshare API
      const { local: localDateTime, utc: scheduleDateTimeUTC } =
        convertLocalTimeToUTC(scheduleDate, scheduleTime);

      // Try Ayrshare scheduling first if profile is available
      if (ayrshareProfile && ayrshareConnections?.length > 0) {
        try {
          let ayrshareResponse;

          if (reschedulePostId) {
            // Update existing scheduled post
            console.log("Updating scheduled post with ID:", reschedulePostId);
            ayrshareResponse = await updateScheduledPost(
              currentContent?.id,
              reschedulePostId,
              ayrshareProfile.profile_key,
              localDateTime, // Send local time to backend for proper timezone conversion
              Intl.DateTimeFormat().resolvedOptions().timeZone
            );
          } else {
            // Create new scheduled post
            console.log("Creating new scheduled post");
            // Collect media URLs from currentContent
            const mediaUrls = getMediaUrlsFromContent(currentContent);
            // const mediaUrls = [
            //   "https://cdn.pixabay.com/video/2023/09/23/181977-867576065_tiny.mp4",
            //   "https://fastly.picsum.photos/id/354/1080/1080.jpg?hmac=y_pY2-y14V1kLVR-mYZvo3EguRMAWgZ7ssXgcIWdbGI",
            // ];

            ayrshareResponse = await scheduleAyrsharePost(
              currentContent?.id,
              ayrshareProfile.profile_key,
              formattedContent.content_text,
              localDateTime, // Send local time to backend for proper timezone conversion
              mediaUrls.length > 0 ? mediaUrls : null,
              [selectedPlatform], // platforms parameter
              formattedContent.hashtags // hashtags parameter
            );
          }

          console.log("Ayrshare response schedule:", ayrshareResponse);
          if (ayrshareResponse?.data) {
            // Successfully scheduled via Ayrshare
            const ayrsharePostDetails =
              ayrshareResponse?.data.ayrshare_post_details;
            const postId = ayrshareResponse?.data.ayrshare_schedule_id;
            console.log("Ayrshare response:", ayrshareResponse?.data);
            console.log("Ayrshare post details:", ayrsharePostDetails);
            console.log("Post ID:", postId);

            setPublishSuccessMap((prev) => ({
              ...prev,
              [currentContent?.id]: {
                ...prev[currentContent?.id],
                [selectedPlatform]: {
                  success: true,
                  message: reschedulePostId
                    ? `Content rescheduled successfully via Ayrshare for ${localDateTime.toLocaleString()} (${
                        Intl.DateTimeFormat().resolvedOptions().timeZone
                      })!`
                    : `Content scheduled successfully via Ayrshare for ${localDateTime.toLocaleString()} (${
                        Intl.DateTimeFormat().resolvedOptions().timeZone
                      })!`,
                  postUrl: ayrshareResponse?.data.post_url || null,
                  platform: selectedPlatform,
                  contentId: currentContent?.id,
                  testMode: false,
                  isScheduled: true,
                  scheduledTime: localDateTime.toISOString(),
                  // Store complete Ayrshare post details from backend
                  ayrsharePostId: postId,
                  ayrsharePostDetails: ayrsharePostDetails,
                  profileKey: ayrshareProfile.profile_key, // Store profile key for unscheduling
                  // Keep scheduleId for backward compatibility
                  scheduleId: postId,
                },
              },
            }));

            // Show success modal
            setShowScheduleModal(false);
            setReschedulePostId(null); // Reset reschedule ID
            Swal.fire({
              icon: "success",
              title: reschedulePostId
                ? "Post Rescheduled Successfully!"
                : "Post Scheduled Successfully!",
              text: reschedulePostId
                ? `Your post has been rescheduled for ${localDateTime.toLocaleString()} (${
                    Intl.DateTimeFormat().resolvedOptions().timeZone
                  })`
                : "Your content is now scheduled and will be published at the set time. You can view, edit, or unschedule it from 'My Posts'.",
              confirmButtonText: "Great!",
              confirmButtonColor: "#2FB130",
              timer: 3000,
              timerProgressBar: true,
            });
            return; // Exit early on success
          }
        } catch (ayrshareError) {
          console.log(
            "Ayrshare scheduling failed, falling back to original method:",
            ayrshareError
          );
          // Continue to fallback method
        }
      }
      console.log("Ayrshare schedule response fallback:", ayrshareResponse);
      return;
      // Fallback to original scheduling method
      // Use the already converted local time and UTC time from above
      const scheduledDateTime = scheduleDateTimeUTC.toISOString();
      let response;
      if (reschedulePostId) {
        // Reschedule existing scheduled post
        response = await reschedulePostApi(reschedulePostId, scheduledDateTime);
      } else {
        // Create a new schedule
        response = await schedulePostApi(
          selectedPlatform,
          currentContent?.id,
          scheduledDateTime,
          formattedContent,
          formattedContent.hashtags
        );
      }

      console.log("Response schedule ttttt:", response);
      // Show success message
      setPublishSuccessMap((prev) => ({
        ...prev,
        [currentContent?.id]: {
          ...prev[currentContent?.id], // Keep existing platform states
          [selectedPlatform]: {
            success: true,
            message:
              response?.data.message ||
              (reschedulePostId
                ? "Content rescheduled successfully!"
                : "Content scheduled successfully!"),
            postUrl: null,
            platform: selectedPlatform,
            contentId: currentContent?.id,
            isScheduled: true,
            scheduledTime: scheduledDateTime,
            testMode: response?.data.test_mode || false,
            schedulerError: response?.data.scheduler_error || null,
            // Preserve or set scheduledPostId for future reschedule/unschedule actions
            scheduledPostId:
              reschedulePostId ||
              response?.data.id ||
              prev[currentContent?.id]?.[selectedPlatform]?.scheduledPostId,
          },
        },
      }));

      // Close modal and reset form
      setShowScheduleModal(false);
      setScheduleDate("");
      setScheduleTime("");
      setReschedulePostId(null);
    } catch (error) {
      console.error("Scheduling error:", error);
      // You could show an error message here
    } finally {
      setScheduling(false);
    }
  };

  const handleSaveToDraft = async (content) => {
    if (!content || savingDraft) return; // Prevent multiple clicks

    setSavingDraft(true);
    try {
      // Check if this is the original platform
      const isOriginalPlatform = content?.original_platform === selectedPlatform || 
                                 (content?.original_platform === null);
      
      console.log("Is original platform:", isOriginalPlatform);
      console.log("Original platform:", content?.original_platform);
      console.log("Current platform:", selectedPlatform);

      let response = null;
  console.log("HII")
        const cleanedResponse = formatContentForSocialMedia(content.content_text)

      // If this is the original platform, update the main content table
      if (isOriginalPlatform) {
        console.log("Updating original content in alfred_content table");
        console.log("cleanedResponse111",content.content_text)
        console.log("cleanedResponse222",cleanedResponse)
        response = await updateContentApi(
          content.id,
          // content.content_text,
          cleanedResponse,
          content.hashtags || [],
          selectedPlatform,
          content?.original_platform === null ? selectedPlatform : null
        );
        console.log("Save response:", response?.data);
        
        // If original_platform was null, update it in messages/state
        if (content?.original_platform === null) {
          console.log("Setting original_platform to:", selectedPlatform);
          
          // Update the message in the messages array
          setMessages((prevMessages) => 
            prevMessages.map((msg) => 
              msg.type === "ai" && msg.content.id === content.id
                ? {
                    ...msg,
                    content: {
                      ...msg.content,
                      original_platform: selectedPlatform
                    }
                  }
                : msg
            )
          );
        }
      }
     
      // Prepare content data for draft version
      const contentData = {
        // content_text: content.content_text,
        content_text: cleanedResponse,
        hashtags: content.hashtags || [],
        image_url: content.image_url || null,
        video_url: content.video_url || null,
        is_video: content.is_video || false,
        userInput: content.userInput || null,
        image_description: content.image_description || null,
        platform_specific_tips: content.platform_specific_tips || null,
        prompt: content.prompt || null,
        domain: content.domain || null,
        session_id: content.session_id || null
      };

      // Always upsert to draft version table
      try {
        const draftVersionResponse = await upsertDraftVersionApi(
          content.id,
          selectedPlatform,
          contentData
        );
        console.log("Draft version upserted:", draftVersionResponse.data);
        console.log("Action performed:", draftVersionResponse.data.action);
      } catch (draftError) {
        console.error("Error upserting draft version:", draftError);
        // Don't block the main save operation if draft version upsert fails
      }

      // Call the old API to maintain backward compatibility (only if not original platform)
      if (!isOriginalPlatform) {
        const oldResponse = await saveDraftApi(content.id, selectedPlatform);
        if (oldResponse?.data.success) {
          // Add content ID to saved drafts set
          setSavedDrafts((prev) => new Set([...prev, String(content.id)]));
        }
      } else if (response?.data.success) {
        // Add content ID to saved drafts set
        setSavedDrafts((prev) => new Set([...prev, String(content.id)]));
      }

      // Show simple modal popup
      setShowDraftModal(true);

      // Auto-hide modal after 3 seconds
      setTimeout(() => {
        setShowDraftModal(false);
      }, 3000);
    } catch (error) {
      console.error("Draft saving error:", error);
      // You could show an error message here
    } finally {
      setSavingDraft(false);
    }
  };

  const openScheduleModal = async (content) => {
    console.log("Open schedule modal", { content });
    const entry = publishSuccessMap[content.id]?.[selectedPlatform];
    console.log("Unschedule - Entry:", entry);
    setCurrentContent(content);
    // Ensure platform is connected; if not, route to social tab
    const ok = await promptConnectIfNeeded(selectedPlatform);
    console.log("ok schedule:", ok);
    if (!ok) return;
    setShowScheduleModal(true);
    // If already scheduled for this platform, prefill and set reschedule mode
    const schedEntry = publishSuccessMap[content.id]?.[selectedPlatform];
    if (schedEntry?.isScheduled && schedEntry?.scheduledTime) {
      try {
        const date = new Date(schedEntry.scheduledTime);
        setScheduleDate(date.toISOString().split("T")[0]);
        setScheduleTime(date.toTimeString().slice(0, 5));
      } catch (_) {}
      setReschedulePostId(schedEntry.scheduleId || null);
    } else {
      setReschedulePostId(null);
    }
    // Load suggested times
    try {
      const response = await getSuggestedTimesApi();
      setSuggestedTimes(response?.data.suggested_times);
    } catch (error) {
      console.error("Failed to load suggested times:", error);
    }
  };

  const handleUnschedule = async (contentId) => {
    try {
      const entry = publishSuccessMap[contentId]?.[selectedPlatform];
      console.log("Unschedule - Entry:", entry);
      const postId = entry?.ayrsharePostId || entry?.scheduleId; // Use ayrsharePostId first, fallback to scheduleId
      const profileKey = ayrshareProfile?.profile_key;
      console.log("Unschedule - Post ID:", postId);
      console.log("Unschedule - Profile Key:", profileKey);
      if (!postId) {
        console.error("No post ID found for unscheduling");
        return;
      }
      if (!profileKey) {
        console.error("No profile key found for unscheduling");
        return;
      }

      // Call Ayrshare unschedule API
      await unscheduleAyrsharePost(contentId, postId, profileKey);

      // Remove the scheduled state entry entirely so initial state shows again
      setPublishSuccessMap((prev) => {
        const next = { ...prev };
        const perContent = { ...(next[contentId] || {}) };
        delete perContent[selectedPlatform];
        if (Object.keys(perContent).length === 0) {
          delete next[contentId];
        } else {
          next[contentId] = perContent;
        }
        return next;
      });

      // Reset modal state if open
      setShowScheduleModal(false);
      setReschedulePostId(null);

      // Show success message and then show original buttons
      Swal.fire({
        icon: "success",
        title: "Post Unscheduled!",
        text: "Your content is no longer scheduled for publishing. You can now publish it immediately or save it as a draft.",
        confirmButtonText: "OK",
        confirmButtonColor: "#2FB130",
        timer: 4000,
        timerProgressBar: true,
        customClass: {
          popup: "verify-swal-popup",
          title: "verify-swal-title",
          text: "verify-swal-text",
          content: "verify-swal-content",
          confirmButton: "verify-swal-confirm-button",
          icon: "verify-swal-error-icon",
        },
      }).then(() => {
        // The success modal will automatically disappear and show original buttons
        // because we removed the scheduled state from publishSuccessMap
      });
    } catch (error) {
      console.error("Unschedule error:", error);
      Swal.fire({
        icon: "error",
        title: "Unschedule Failed",
        timer: 4000,
        timerProgressBar: true,
        text: "Failed to unschedule the post. Please try again.",
        confirmButtonText: "OK",
        confirmButtonColor: "#2FB130",
      });
    }
  };

  const handleSuggestedTimeClick = (suggestedTime) => {
    const date = new Date(suggestedTime);
    const localISODate = date.toISOString().split("T")[0]; // YYYY-MM-DD
    const localISOTime = date.toTimeString().slice(0, 5); // HH:MM

    setScheduleDate(localISODate);
    setScheduleTime(localISOTime);
    setSelectedSuggestedTime(suggestedTime);
  };

  const handleSaveChanges = async () => {
    if (!currentContent) return;

    try {
      const response = await updateContentApi(
        currentContent?.id,
        editedContent,
        editedHashtags
      );

      setCurrentContent(response?.data);

      // Update the message in the messages array
      setMessages((prev) =>
        prev.map((msg) =>
          msg.type === "ai" && msg.content.id === currentContent?.id
            ? {
                ...msg,
                content: {
                  ...msg.content,
                  content_text: editedContent,
                  hashtags: editedHashtags,
                },
              }
            : msg
        )
      );

      setEditingContent(false);
    } catch (error) {
      // Handle error silently
    }
  };

  const addHashtag = (hashtag) => {
    if (!editedHashtags.includes(hashtag)) {
      setEditedHashtags((prev) => [...prev, hashtag]);
    }
  };

  const removeHashtag = (hashtag) => {
    setEditedHashtags((prev) => prev.filter((h) => h !== hashtag));
  };

  // Confirmation modal handlers
  const showConfirmation = (action, content) => {
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
    setConfirmationContent(content);
    setShowConfirmationModal(true);
  };

  const handleConfirmation = async () => {
    if (!confirmationAction || !confirmationContent) return;

    setShowConfirmationModal(false);

    switch (confirmationAction) {
      case "publish":
        await handlePublish(confirmationContent);
        break;
      case "schedule":
        await openScheduleModal(confirmationContent);
        break;
      case "unschedule":
        await handleUnschedule(confirmationContent.id);
        break;
    }

    setConfirmationAction(null);
    setConfirmationMessage("");
    setConfirmationContent(null);
  };

  const handleCancelConfirmation = () => {
    setShowConfirmationModal(false);
    setConfirmationAction(null);
    setConfirmationMessage("");
    setConfirmationTitle("");
    setConfirmationConfirmText("");
    setConfirmationCancelText("");
    setConfirmationContent(null);
  };

  // Spinner component for loading state
  const LoadingSpinner = ({ size = "w-4 h-4" }) => (
    <div
      className={`animate-spin rounded-full ${size} border-2 border-[#79DB79] border-t-transparent`}
    ></div>
  );

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

  const handleCopyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      // Reset the copy state after 2 seconds
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
      // Fallback for older browsers
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

  // Copy AI message content (chat/content/image-analysis) to clipboard
  const handleCopyMessageContent = async (msg) => {
    try {
      let textToCopy = "";
      if (typeof msg?.content === "string") {
        textToCopy = msg.content;
      } else if (
        msg?.content &&
        (msg.content.content_text || Array.isArray(msg.content.hashtags))
      ) {
        const baseText = msg.content.content_text || "";
        const hashtags = Array.isArray(msg.content.hashtags)
          ? msg.content.hashtags
          : [];
        const normalizedTags = hashtags
          .map((h) => (String(h).startsWith("#") ? String(h) : `#${String(h)}`))
          .join(" ");
        textToCopy = `${baseText}${
          normalizedTags ? `\n\n${normalizedTags}` : ""
        }`;
      } else {
        // Fallback to safe string
        textToCopy =
          typeof msg?.content !== "undefined" ? String(msg.content) : "";
      }

      await navigator.clipboard.writeText(textToCopy);
      setCopiedMessageId(msg?.id ?? null);
      setTimeout(() => setCopiedMessageId(null), 1500);
    } catch (err) {
      // Silently ignore
    }
  };

  const removeUploadedImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
  };

  // Handler for opening edit modal
  const handleOpenEditModal = (content, platform) => {
    // Prevent opening edit modal during publishing
    if (publishing || publishingContentId) {
      return;
    }
    setModalEditingContent(content, platform);
    setShowEditModal(true);
  };

  // Handler for closing edit modal
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setModalEditingContent(null);
  };

  // Handler for updating content from edit modal
  const handleContentUpdate = (updatedContent) => {
    // Handle deletion case
    if (updatedContent === null) {
      // Close the modal after successful deletion
      setShowEditModal(false);
      setModalEditingContent(null);
      return;
    }

    // Update the message in the messages array
    setMessages((prev) =>
      prev.map((msg) =>
        msg.type === "ai" && msg?.content?.id === updatedContent?.id
          ? { ...msg, content: updatedContent }
          : msg
      )
    );

    // Update currentContent if it's the same
    if (currentContent?.id === updatedContent.id) {
      setCurrentContent(updatedContent);
    }
  };

  // Handler for opening media preview modal
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

  console.log("Messages reponsssss:", messages);

  return (
    <>
      <div
        className="min-h-full d-flex flex-column"
        style={{ maxHeight: "100%", height: "100%" }}
      >
        <div className="w-full relative flex-1">
          {/* Hidden File Input for Content Image Upload */}
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

          {/* Hidden File Input for Content Video Upload */}
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

          {/* Hidden File Input for Image Analysis */}
          <input
            type="file"
            ref={imageAnalysisFileInputRef}
            onChange={(e) => {
              if (e.target.files[0]) {
                handleImageFileSelect(e.target.files[0]);
              }
            }}
            accept="image/*"
            className="hidden"
          />

          {/* Markdown Content Styles */}
          <style>{`
        .markdown-content h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          border-bottom: 1px solid #1D2027;
          padding-bottom: 0.5rem;
        }
        .markdown-content h2 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 0.75rem;
        }
        .markdown-content h3 {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .markdown-content strong {
          font-weight: 700 !important;
          font-size: 15px;
          /*background-color: rgba(59, 130, 246, 0.1) !important;*/
          padding: 0.125rem 0.25rem !important;
          border-radius: 0.25rem !important;
        }
        .markdown-content em {
          font-style: italic !important;
          font-size: inherit;
          /*background-color: rgba(156, 163, 175, 0.1) !important;*/
          padding: 0.125rem 0.25rem !important;
          border-radius: 0.25rem !important;
        }
        .markdown-content p {
          margin-bottom: 0.75rem;
          line-height: 1.6;
        }
        .markdown-content br {
          margin-bottom: 0.5rem;
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
          min-width: 2rem;
          flex-shrink: 0;
        }
        .markdown-content .list-item .bullet {
          font-size: 1.125rem;
          margin-top: 0.125rem;
          flex-shrink: 0;
        }
        .markdown-content .list-item .content {
          line-height: 1.6;
          flex: 1;
        }
        
        /* Additional list styling for better spacing */
        .markdown-content ol {
          list-style: none;
          padding-left: 0;
          margin: 0.75rem 0;
        }
        
        .markdown-content ul {
          list-style: none;
          padding-left: 0;
          margin: 0.75rem 0;
        }
        
        .markdown-content li {
          margin-bottom: 0.5rem;
        }
        
        /* Ensure numbered lists have proper spacing */
        .markdown-content .list-item.numbered {
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid #1D2027;
        }
        
        .markdown-content .list-item.numbered:last-child {
          border-bottom: none;
        }
        
        /* Ensure bulleted lists have proper spacing */
        .markdown-content .list-item.bulleted {
          gap: 0.75rem;
          margin-bottom: 0.75rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid #1D2027;
        }
        
                 .markdown-content .list-item.bulleted:last-child {
           border-bottom: none;
         }
         
                   /* Typing Animation for Welcome Message */
          .typing-animation {
            overflow: hidden;
            white-space: nowrap;
            animation: typing 2s steps(40, end);
            font-size:15px !important;
          }
          .simbli-texts{
          font-size:"16px"}
          @keyframes typing {
            from { width: 0; }
            to { width: 100%; }
          }
          
          @keyframes glow {
            0% {
              box-shadow: 0 0 20px rgba(132, 224, 132, 0.3), inset 0 0 20px rgba(132, 224, 132, 0.1);
            }
            100% {
              box-shadow: 0 0 30px rgba(132, 224, 132, 0.6), inset 0 0 30px rgba(132, 224, 132, 0.2);
            }
          }
          /* Green accordion styling */
          .alfred-acc {
            background: #fffff;
            border: none;
            box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;
          }
          .alfred-acc > summary {
            list-style: none; /* hide default disclosure marker */
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
           
          }
          .alfred-acc > summary::-webkit-details-marker { display: none; }
          .alfred-acc-icon {
            display: inline-flex;
            transition: transform 0.2s ease;
          }
          .alfred-acc[open] .alfred-acc-icon { transform: rotate(180deg); }
       `}</style>

          {/* Chat Messages Container */}
          <div
            className="p-2 md:p-2 pb-5 md:pb-4 py-5 bg-white  chat-message-over  my-4 mx-lg-4 mx-2"
            style={{ height: "100%" }}
          >
            {/* Clear Chat Button - Show when there are messages */}
            {/* {messages.length > 0 && (
          <div className="flex justify-start mb-4 pt-4">
            <button
              onClick={clearChatHistory}
              className="cla-new flex items-center space-x-2 px-3 py-1.5   rounded-lg transition-all duration-200 "
              title="Clear chat history"
            >
              <X className="w-3 h-3" /> 
              <span className="clear-chat">New Chat</span> 
            </button>
          </div>
        )} */}

            {messages.length === 0 ? (
              <div className="text-center text-gray-300 pt-4 pb-4">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#E0FFE3] backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                  <img src="/simbli.png" alt="Simbli" className="w-8 h-8" />
                </div>

                {/* Personalized Welcome Message - Professional Typing Animation */}
                <div className="mb-2 text-center ">
                  <div className="inline-flex flex-col items-center space-y-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-md text-[#262626] font-medium typing-animation">
                        Hi {user?.name || user?.username || "there"}!
                      </span>
                    </div>
                    <h3 className="text-lg font-bold tracking-tight welcome-gradient">
                      You're In! Welcome to Alfred.
                    </h3>
                  </div>
                </div>

                <p
                  className="text-[#262626] text-md leading-relaxed max-w-md mx-auto mb-0 pb-0"
                  style={{ fontWeight: "500", fontSize: "16px" }}
                >
                  Your AI-Powered Social Media Content Agent is Ready.
                </p>
                <p className="text-[#686868] text-sm mt-1 max-w-md mx-auto">
                  Start A Conversation To Create Amazing Social Media Content
                  With Perfect Hashtags And Strategy.
                </p>
              </div>
            ) : (
              <div className="space-y-6 p-4  overall-chatss">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.type === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`${
                        message.type === "user" ? "user-chat" : "response-chat"
                      } px-4 md:px-6 py-3 md:py-4 rounded-2xl shadow-sm ${
                        message.type === "user"
                          ? "text-[#1F1F1F]"
                          : message.type === "error"
                          ? "bg-red-900/20 text-red-300 border border-red-900/30"
                          : "bg-white backdrop-blur-sm text-black border border-gray-200"
                      }`}
                      style={
                        message.type === "user"
                          ? {
                              background: "#F5FFF8",
                              border: "1px solid #84E084",
                            }
                          : undefined
                      }
                    >
                      {message.type === "ai" ? (
                        <div className="space-y-4">
                          {/* Social Media Post Header */}
                          <div className="mb-4">
                            {/* AI Generated Badge - Top Left */}
                            <div className="flex flex-col sm:flex-row justify-between items-start mb-3">
                              <span
                                className="text-sm ai-gen-cards px-3 py-2 rounded-full font-medium"
                                style={{
                                  background:
                                    "linear-gradient(90deg, #FFF4D6 0%, #D0FFC2 100%)",
                                }}
                              >
                                AI Generated
                              </span>

                              {/* Action Icons - Top Right */}
                              <div className="flex items-center mt-lg-0 mt-3 space-x-2 edit-content bg-white shadow-sm px-2 py-1">
                                {/* Edit Content Icon (shown first when content) */}
                                {message.messageType === "content" && !publishSuccessMap[message.content.id]?.[selectedPlatform] && (
                                  <button
                                    onClick={() =>
                                      handleOpenEditModal(
                                        message.content,
                                        selectedPlatform
                                      )
                                    }
                                    disabled={publishing || publishingContentId}
                                    className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                                    title={publishing || publishingContentId ? "Cannot edit while publishing" : "Edit Content"}
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 22 22"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        d="M10 3.12132H5.8C4.11984 3.12132 3.27976 3.12132 2.63803 3.4483C2.07354 3.73592 1.6146 4.19487 1.32698 4.75935C1 5.40109 1 6.24117 1 7.92132V16.3213C1 18.0014 1 18.8415 1.32698 19.4833C1.6146 20.0477 2.07354 20.5067 2.63803 20.7943C3.27976 21.1213 4.11984 21.1213 5.8 21.1213H14.2C15.8802 21.1213 16.7202 21.1213 17.362 20.7943C17.9265 20.5067 18.3854 20.0477 18.673 19.4833C19 18.8415 19 18.0014 19 16.3213V12.1213M6.99997 15.1213H8.67452C9.1637 15.1213 9.4083 15.1213 9.6385 15.066C9.8425 15.017 10.0376 14.9362 10.2166 14.8266C10.4184 14.7029 10.5914 14.5299 10.9373 14.184L20.5 4.62132C21.3284 3.7929 21.3284 2.44975 20.5 1.62132C19.6716 0.792899 18.3284 0.792889 17.5 1.62132L7.93723 11.184C7.59133 11.5299 7.41838 11.7029 7.29469 11.9047C7.18504 12.0837 7.10423 12.2787 7.05523 12.4828C6.99997 12.713 6.99997 12.9576 6.99997 13.4468V15.1213Z"
                                        stroke="black"
                                        stroke-width="1.7"
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                      />
                                    </svg>
                                  </button>
                                )}
                                {/* Copy message content */}
                                <button
                                  onClick={() =>
                                    handleCopyMessageContent(message)
                                  }
                                  disabled={publishing || publishingContentId}
                                  className={`w-8 h-8 bg-white rounded-lg flex items-center justify-center ${
                                    copiedMessageId === message.id
                                      ? "text-green-600"
                                      : "text-gray-600"
                                  } transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white`}
                                  title={
                                    publishing || publishingContentId
                                      ? "Cannot copy while publishing"
                                      : copiedMessageId === message.id
                                      ? "Copied!"
                                      : "Copy content"
                                  }
                                >
                                  {copiedMessageId === message.id ? (
                                    // ✅ Copied (tick inside document)
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 19 22"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        d="M17 11.5V5.8C17 4.11984 17 3.27976 16.673 2.63803C16.3854 2.07354 15.9265 1.6146 15.362 1.32698C14.7202 1 13.8802 1 12.2 1H5.8C4.11984 1 3.27976 1 2.63803 1.32698C2.07354 1.6146 1.6146 2.07354 1.32698 2.63803C1 3.27976 1 4.11984 1 5.8V16.2C1 17.8802 1 18.7202 1.32698 19.362C1.6146 19.9265 2.07354 20.3854 2.63803 20.673C3.27976 21 4.11982 21 5.79993 21H9M11.5 18L13.5 20L18 15.5"
                                        stroke="black"
                                        strokeWidth="1.7"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  ) : (
                                    // 🧾 Default Copy icon with inner lines
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 20 22"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                    >
                                      <path
                                        d="M4 6.8C4 5.11984 4 4.27976 4.32698 3.63803C4.6146 3.07354 5.07354 2.6146 5.63803 2.32698C6.27976 2 7.11984 2 8.8 2H15.2C16.8802 2 17.7202 2 18.362 2.32698C18.9265 2.6146 19.3854 3.07354 19.673 3.63803C20 4.27976 20 5.11984 20 6.8V17.2C20 18.8802 20 19.7202 19.673 20.362C19.3854 20.9265 18.9265 21.3854 18.362 21.673C17.7202 22 16.8802 22 15.2 22H8.8C7.11984 22 6.27976 22 5.63803 21.673C5.07354 21.3854 4.6146 20.9265 4.32698 20.362C4 19.7202 4 18.8802 4 17.2V6.8Z"
                                        stroke="black"
                                        strokeWidth="1.7"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                      {/* Inner lines to make it look like text */}
                                      <line
                                        x1="7"
                                        y1="9"
                                        x2="13"
                                        y2="9"
                                        stroke="black"
                                        strokeWidth="1"
                                        strokeLinecap="round"
                                      />
                                      <line
                                        x1="7"
                                        y1="12"
                                        x2="15"
                                        y2="12"
                                        stroke="black"
                                        strokeWidth="1"
                                        strokeLinecap="round"
                                      />
                                      <line
                                        x1="7"
                                        y1="15"
                                        x2="11"
                                        y2="15"
                                        stroke="black"
                                        strokeWidth="1"
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                  )}
                                </button>
                                {message.messageType === "content" && !publishSuccessMap[message.content.id]?.[selectedPlatform] && (
                                  <>
                                    {/* Regenerate AI Image Icon */}
                                    <button
                                      onClick={() =>
                                        handleRegenerateImage(
                                          message.content.id
                                        )
                                      }
                                      disabled={
                                        publishing ||
                                        publishingContentId ||
                                        uploading ||
                                        regeneratingContentId ===
                                        message.content.id
                                      }
                                      className={`w-8 h-8 bg-white rounded-lg flex items-center justify-center transition-colors ${
                                        publishing ||
                                        publishingContentId ||
                                        regeneratingContentId ===
                                        message.content.id
                                          ? "text-gray-400 cursor-not-allowed opacity-50"
                                          : "text-gray-600"
                                      }`}
                                      title={
                                        publishing || publishingContentId
                                          ? "Cannot regenerate while publishing"
                                          : "Regenerate AI Image"
                                      }
                                    >
                                      {regeneratingContentId ===
                                      message.content.id ? (
                                        <div className="animate-spin rounded-full w-4 h-4 border-2 border-current border-t-transparent"></div>
                                      ) : (
                                        <svg
                                          width="16"
                                          height="16"
                                          viewBox="0 0 22 20"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <path
                                            d="M1.12109 8C1.12109 8 1.24241 7.15076 4.75713 3.63604C8.27185 0.12132 13.9703 0.12132 17.4851 3.63604C18.7303 4.88131 19.5344 6.40072 19.8973 8M1.12109 8V2M1.12109 8H7.12109M21.1211 12C21.1211 12 20.9998 12.8492 17.4851 16.364C13.9703 19.8787 8.27185 19.8787 4.75713 16.364C3.51185 15.1187 2.70778 13.5993 2.34492 12M21.1211 12V18M21.1211 12H15.1211"
                                            stroke="black"
                                            stroke-width="1.7"
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                          />
                                        </svg>
                                        //  <svg width="16" height="16" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        // <path d="M10.5 2H5.8C4.11984 2 3.27976 2 2.63803 2.32698C2.07354 2.6146 1.6146 3.07354 1.32698 3.63803C1 4.27976 1 5.11984 1 6.8V15.2C1 16.8802 1 17.7202 1.32698 18.362C1.6146 18.9265 2.07354 19.3854 2.63803 19.673C3.27976 20 4.11984 20 5.8 20H15C15.93 20 16.395 20 16.7765 19.8978C17.8117 19.6204 18.6204 18.8117 18.8978 17.7765C19 17.395 19 16.93 19 16M17 7V1M14 4H20M8.5 7.5C8.5 8.60457 7.60457 9.5 6.5 9.5C5.39543 9.5 4.5 8.60457 4.5 7.5C4.5 6.39543 5.39543 5.5 6.5 5.5C7.60457 5.5 8.5 6.39543 8.5 7.5ZM12.99 10.9181L4.53115 18.608C4.05536 19.0406 3.81747 19.2568 3.79643 19.4442C3.77819 19.6066 3.84045 19.7676 3.96319 19.8755C4.10478 20 4.42628 20 5.06929 20H14.456C15.8951 20 16.6147 20 17.1799 19.7582C17.8894 19.4547 18.4547 18.8894 18.7582 18.1799C19 17.6147 19 16.8951 19 15.456C19 14.9717 19 14.7296 18.9471 14.5042C18.8805 14.2208 18.753 13.9554 18.5733 13.7264C18.4303 13.5442 18.2412 13.3929 17.8631 13.0905L15.0658 10.8527C14.6874 10.5499 14.4982 10.3985 14.2898 10.3451C14.1061 10.298 13.9129 10.3041 13.7325 10.3627C13.5279 10.4291 13.3486 10.5921 12.99 10.9181Z" stroke="black" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
                                        // </svg>
                                      )}
                                    </button>

                                    {/* Upload Custom Image Icon */}
                                    <button
                                      onClick={() => {
                                        setCurrentContent(message.content);
                                        fileInputRef.current?.click();
                                      }}
                                      disabled={
                                        publishing ||
                                        publishingContentId ||
                                        (uploading && currentContent?.id === message.content.id)
                                      }
                                      className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                                      title={
                                        publishing || publishingContentId
                                          ? "Cannot upload while publishing"
                                          : "Upload Custom Image"
                                      }
                                    >
                                      <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 21 21"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          d="M10.5 2H5.8C4.11984 2 3.27976 2 2.63803 2.32698C2.07354 2.6146 1.6146 3.07354 1.32698 3.63803C1 4.27976 1 5.11984 1 6.8V15.2C1 16.8802 1 17.7202 1.32698 18.362C1.6146 18.9265 2.07354 19.3854 2.63803 19.673C3.27976 20 4.11984 20 5.8 20H15C15.93 20 16.395 20 16.7765 19.8978C17.8117 19.6204 18.6204 18.8117 18.8978 17.7765C19 17.395 19 16.93 19 16M17 7V1M14 4H20M8.5 7.5C8.5 8.60457 7.60457 9.5 6.5 9.5C5.39543 9.5 4.5 8.60457 4.5 7.5C4.5 6.39543 5.39543 5.5 6.5 5.5C7.60457 5.5 8.5 6.39543 8.5 7.5ZM12.99 10.9181L4.53115 18.608C4.05536 19.0406 3.81747 19.2568 3.79643 19.4442C3.77819 19.6066 3.84045 19.7676 3.96319 19.8755C4.10478 20 4.42628 20 5.06929 20H14.456C15.8951 20 16.6147 20 17.1799 19.7582C17.8894 19.4547 18.4547 18.8894 18.7582 18.1799C19 17.6147 19 16.8951 19 15.456C19 14.9717 19 14.7296 18.9471 14.5042C18.8805 14.2208 18.753 13.9554 18.5733 13.7264C18.4303 13.5442 18.2412 13.3929 17.8631 13.0905L15.0658 10.8527C14.6874 10.5499 14.4982 10.3985 14.2898 10.3451C14.1061 10.298 13.9129 10.3041 13.7325 10.3627C13.5279 10.4291 13.3486 10.5921 12.99 10.9181Z"
                                          stroke="black"
                                          strokeWidth="1.7"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </svg>
                                    </button>

                                    {/* Upload Custom Video Icon */}
                                    <button
                                      onClick={() => {
                                        setCurrentContent(message.content);
                                        videoInputRef.current?.click();
                                      }}
                                      disabled={
                                        publishing ||
                                        publishingContentId ||
                                        (uploading && currentContent?.id === message.content.id)
                                      }
                                      className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                                      title={
                                        publishing || publishingContentId
                                          ? "Cannot upload while publishing"
                                          : "Upload Custom Video"
                                      }
                                    >
                                      <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 28 20"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          d="M27 5.7111C27 4.86437 27 4.44102 26.8323 4.24497C26.6868 4.07488 26.4684 3.9846 26.2451 4.00216C25.9877 4.02238 25.6878 4.32175 25.088 4.92047L20 9.99997L25.088 15.0795C25.6878 15.6782 25.9877 15.9776 26.2451 15.9979C26.4684 16.0153 26.6868 15.925 26.8323 15.7549C27 15.559 27 15.1355 27 14.2888V5.7111Z"
                                          stroke="black"
                                          stroke-width="1.7"
                                          stroke-linecap="round"
                                          stroke-linejoin="round"
                                        />
                                        <path
                                          d="M1 7.17143C1 5.01122 1 3.93112 1.41417 3.10604C1.77849 2.38027 2.35982 1.7902 3.07484 1.4204C3.8877 1 4.9518 1 7.08 1H13.92C16.0483 1 17.1123 1 17.9252 1.4204C18.6402 1.7902 19.2215 2.38027 19.5858 3.10604C20 3.93112 20 5.01122 20 7.17143V12.8286C20 14.9888 20 16.0688 19.5858 16.894C19.2215 17.6198 18.6402 18.2098 17.9252 18.5796C17.1123 19 16.0483 19 13.92 19H7.08C4.9518 19 3.8877 19 3.07484 18.5796C2.35982 18.2098 1.77849 17.6198 1.41417 16.894C1 16.0688 1 14.9888 1 12.8286V7.17143Z"
                                          stroke="black"
                                          stroke-width="1.7"
                                          stroke-linecap="round"
                                          stroke-linejoin="round"
                                        />
                                      </svg>
                                    </button>

                                    {/* Save as Draft Icon */}
                                    <button
                                      onClick={() =>
                                        handleSaveToDraft(message.content)
                                      }
                                      disabled={
                                        publishing ||
                                        publishingContentId ||
                                        savingDraft ||
                                        savedDrafts.has(
                                          String(message.content.id)
                                        )
                                      }
                                      className={`w-8 h-8 bg-white rounded-lg flex items-center justify-center transition-colors ${
                                        publishing ||
                                        publishingContentId ||
                                        savingDraft ||
                                        savedDrafts.has(
                                          String(message.content.id)
                                        )
                                          ? "text-gray-400 cursor-not-allowed opacity-50"
                                          : "text-gray-900 hover:text-gray-900 hover:bg-gray-50"
                                      }`}
                                      title={
                                        publishing || publishingContentId
                                          ? "Cannot save while publishing"
                                          : savedDrafts.has(
                                              String(message.content.id)
                                            )
                                          ? "Already saved as draft"
                                          : savingDraft
                                          ? "Saving..."
                                          : "Save as draft"
                                      }
                                    >
                                      <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 22 22"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          d="M5.44444 1V4.77778C5.44444 5.40006 5.44444 5.7112 5.56554 5.94888C5.67208 6.15794 5.84206 6.32792 6.05112 6.43446C6.2888 6.55556 6.59995 6.55556 7.22222 6.55556H14.7778C15.4001 6.55556 15.7112 6.55556 15.9489 6.43446C16.158 6.32792 16.3279 6.15794 16.4344 5.94888C16.5556 5.7112 16.5556 5.40006 16.5556 4.77778V2.11111M16.5556 21V13.8889C16.5556 13.2666 16.5556 12.9554 16.4344 12.7178C16.3279 12.5087 16.158 12.3388 15.9489 12.2322C15.7112 12.1111 15.4001 12.1111 14.7778 12.1111H7.22222C6.59995 12.1111 6.2888 12.1111 6.05112 12.2322C5.84206 12.3388 5.67208 12.5087 5.56554 12.7178C5.44444 12.9554 5.44444 13.2666 5.44444 13.8889V21M21 8.02831V15.6667C21 17.5336 21 18.4669 20.6367 19.18C20.3171 19.8072 19.8072 20.3171 19.18 20.6367C18.4669 21 17.5336 21 15.6667 21H6.33333C4.46649 21 3.53307 21 2.82003 20.6367C2.19282 20.3171 1.68289 19.8072 1.36331 19.18C1 18.4669 1 17.5336 1 15.6667V6.33333C1 4.46649 1 3.53307 1.36331 2.82003C1.68289 2.19282 2.19282 1.68289 2.82003 1.36331C3.53307 1 4.46649 1 6.33333 1H13.9717C14.5152 1 14.787 1 15.0428 1.0614C15.2694 1.11583 15.4862 1.20562 15.6851 1.32747C15.9093 1.46489 16.1016 1.65706 16.4859 2.0414L19.9586 5.51416C20.3429 5.8985 20.5351 6.09067 20.6726 6.31492C20.7943 6.51374 20.8841 6.73051 20.9386 6.95727C21 7.21301 21 7.48478 21 8.02831Z"
                                          stroke="currentColor"
                                          stroke-width="1.7"
                                          stroke-linecap="round"
                                          stroke-linejoin="round"
                                        />
                                      </svg>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Message Content */}
                          {message.messageType === "content" ? (
                            <div>
                              {/* User Profile Section - Above Content (Only show when connected) */}
                              {userProfile?.isConnected && (
                                <div className="mb-4  rounded-xl  ">
                                  <div className="flex items-start space-x-3">
                                    {/* Profile Avatar */}
                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm">
                                      {userProfile?.profileImage ? (
                                        <img
                                          src={userProfile.profileImage}
                                          alt={userProfile.name}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.target.style.display = "none";
                                            e.target.nextSibling.style.display =
                                              "flex";
                                          }}
                                        />
                                      ) : null}
                                      <div
                                        className="w-full h-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center"
                                        style={{
                                          display: userProfile?.profileImage
                                            ? "none"
                                            : "flex",
                                        }}
                                      >
                                        <span className="text-white font-bold text-md simbli-texts">
                                          {(
                                            userProfile?.name ||
                                            user?.name ||
                                            "U"
                                          )
                                            .charAt(0)
                                            .toUpperCase()}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Profile Details */}
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2">
                                        <h4 className="text-sm font-bold text-gray-900">
                                          {userProfile?.name ||
                                            user?.name ||
                                            "User"}
                                        </h4>
                                        <div className="flex items-center space-x-1"></div>
                                      </div>
                                      <p className="text-xs text-gray-600 mb-0 pb-0">
                                        Social Media User
                                            {/* {userProfile?.title ||
                                              "Social Media User"} */}
                                        {/* {userProfile?.company &&
                                          ` • ${userProfile.company}`} */}
                                      </p>
                                      <span className="text-xs text-gray-500 flex items-center">
                                        {getElapsedTime(message.timestamp)} •{" "}
                                        <img
                                          className="ms-1"
                                          src={global}
                                          style={{
                                            objectFit: "contain",
                                            width: "10px",
                                            height: "10px",
                                          }}
                                        ></img>
                                        {/* {ayrshareProfile && ayrshareConnections?.length > 0 && (
                                      <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                        Ayrshare Ready
                                      </span>
                                    )} */}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Content Text */}
                              <div className="text-black leading-relaxed text-sm">
                                <div className="flex items-start space-x-2">
                                  <span className="text-lg"></span>
                                  <div
                                    className="flex-1"
                                    style={{
                                      fontFamily:
                                        "SF Pro Display sans-serif !important",
                                      overflowWrap: "break-word",
                                      wordBreak: "break-word",
                                    }}
                                  >
                                    <MarkdownRenderer
                                      enableInline={false}
                                      content={
                                        formatContentForUI(
                                          stripProvidedHashtags(
                                            message.content.content_text,
                                            message.content.hashtags
                                          )
                                        ) || "No content text available"
                                      }
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Hashtags */}
                              <div className="flex flex-wrap gap-2 mt-3">
                                {(message.content.hashtags || []).map(
                                  (hashtag, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-3 py-1 bg-[#EBF3FF] text-[#1A75BF] hash-tags text-sm rounded-full"
                                    >
                                      <span className="mr-1">#</span>
                                      {hashtag.replace("#", "")}
                                    </span>
                                  )
                                )}
                              </div>

                              {/* Media Display - Unified logic using image_url for both video and image content */}
                              {message.content.image_url ? (
                                (() => {
                                  // Helper function to determine if media is video based on file extension
                                  const isVideoFile = (url) => {
                                    if (!url) return false;
                                    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.m4v'];
                                    const lowerUrl = url.toLowerCase();
                                    console.log("lowerUrl",lowerUrl)
                                    return videoExtensions.some(ext => lowerUrl.includes(ext));
                                  };

                                  const mediaUrl = message.content.image_url.startsWith("http")
                                    ? message.content.image_url
                                    : `${BASE_URL}${message.content.image_url}`;

                                  const isVideo = isVideoFile(message.content.image_url);

                                  return isVideo ? (
                                    /* Video Display */
                                    <div className="mt-4 relative" style={{ width: "350px", height: "auto", minHeight: "200px" }}>
                                      <video
                                        src={mediaUrl}
                                        controls
                                        className="w-full max-w-full sm:max-w-2xl rounded-xl border border-[#1D2027] shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                                        style={{ height: "auto" ,width:"350px"}}
                                        onClick={() => handleOpenMediaPreview(mediaUrl, 'video')}
                                        onLoadStart={() => {
                                          addLoadingImage(message.content.id); // Use context - persists across tab switches
                                        }}
                                        onLoadedData={() => {
                                          removeLoadingImage(message.content.id); // Use context - persists across tab switches
                                        }}
                                        onError={() => {
                                          removeLoadingImage(message.content.id); // Use context - persists across tab switches
                                        }}
                                      >
                                        Your browser does not support the video tag.
                                      </video>
                                      
                                      {/* Video Loading Spinner Overlay */}
                                      {loadingImages.has(message.content.id) && (
                                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-100 rounded-xl">
                                          <div className="flex flex-col items-center space-y-3">
                                            <div className="animate-spin rounded-full w-8 h-8 border-2 border-[#79DB79] border-t-transparent"></div>
                                            <span className="text-gray-600 text-sm font-medium">Loading video...</span>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Upload Loading Overlay */}
                                       {uploading && currentContent?.id === message.content.id && (
                                        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 rounded-xl" style={{width:"350px"}}>
                                          <div className="flex flex-col items-center space-y-3">
                                            <div className="animate-spin rounded-full w-8 h-8 border-2 border-[#79DB79] border-t-transparent"></div>
                                            <span className="text-white text-sm font-medium">Uploading...</span>
                                          </div>
                                        </div>
                                      )} 
                                    </div>
                                  ) : (
                                    /* Image Display */
                                    <div className="mt-4 relative" style={{ width: "350px", height: "auto", minHeight: "200px" }}>
                                      <img
                                        src={mediaUrl}
                                        alt=""
                                        className={`w-full max-w-full sm:max-w-2xl rounded-xl border border-[#1D2027] shadow-sm cursor-pointer hover:opacity-90 transition-opacity ${
                                          regeneratingContentId ===
                                            message.content.id
                                            ? "opacity-50"
                                            : ""
                                        }`}
                                        style={{ width: "350px", height: "auto" }}
                                        onClick={() => handleOpenMediaPreview(mediaUrl, 'image')}
                                        onLoadStart={() => {
                                          addLoadingImage(message.content.id); // Use context - persists across tab switches
                                        }}
                                        onLoad={() => {
                                          removeLoadingImage(message.content.id); // Use context - persists across tab switches
                                        }}
                                        onError={() => {
                                          removeLoadingImage(message.content.id); // Use context - persists across tab switches
                                        }}
                                      />
                                      
                                      {/* Regenerating Overlay */}
                                      {regeneratingContentId ===
                                        message.content.id && (
                                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 rounded-xl" style={{width: "350px"}}>
                                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#79DB79] border-t-transparent"></div>
                                        </div>
                                      )}
                                     
                                      {/* Image Loading Spinner Overlay */}
                                      {loadingImages.has(message.content.id) && (
                                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-gray-100 rounded-xl">
                                          <div className="flex flex-col items-center space-y-3">
                                            <div className="animate-spin rounded-full w-8 h-8 border-2 border-[#79DB79] border-t-transparent"></div>
                                            <span className="text-gray-600 text-sm font-medium">Loading image...</span>
                                          </div>
                                        </div>
                                      )}
                                     
                                      {/* {(message.content.isRegenerated ||
                                        isRecentlyRegenerated(
                                          message.content.id
                                        )) && !loadingImages.has(message.content.id) && (
                                        <span
                                          className="absolute bottom-5 left-58 z-20 px-2 py-1  font-semibold rounded-full "
                                          style={{
                                            background: "#ffff",
                                            color: "#84E084",
                                            border: "2px solid #84E084 ",
                                            fontSize: "14px",
                                          }}
                                        >
                                          Regenerated
                                        </span>
                                      )} */}
                                      
                                      {/* Upload Loading Overlay */}
                                       {uploading && currentContent?.id === message.content.id && (
                                        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 rounded-xl">
                                          <div className="flex flex-col items-center space-y-3">
                                            <div className="animate-spin rounded-full w-8 h-8 border-2 border-[#79DB79] border-t-transparent"></div>
                                            <span className="text-white text-sm font-medium">Uploading...</span>
                                          </div>
                                        </div>
                                      )} 
                                    </div>
                                  );
                                })()
                              ) : null}
                                {message.conversational && (
                                <div className="mt-4  rounded-xl  shadow-sm"
                               >
                                  <div className="flex items-center mb-2">
                                  
                                  </div>
                                  <div className=" text-gray-700 leading-relaxed" >
                                    {(() => {
                                      const text = String(message.conversational)
                                        .replace(/\\n/g, '\n')
                                        .replace(/`/g, '');

                                      const renderBold = (line, baseKey) => {
                                        const nodes = [];
                                        let keyIndex = 0;
                                        const regex = /(\*\*([^*]+)\*\*|__([^_]+)__)/g;
                                        let lastIndex = 0;
                                        let match;
                                        while ((match = regex.exec(line)) !== null) {
                                          if (match.index > lastIndex) {
                                            nodes.push(line.slice(lastIndex, match.index));
                                          }
                                          const boldText = match[2] || match[3] || '';
                                          nodes.push(<strong key={`${baseKey}-b${keyIndex++}`}>{boldText}</strong>);
                                          lastIndex = regex.lastIndex;
                                        }
                                        if (lastIndex < line.length) {
                                          nodes.push(line.slice(lastIndex));
                                        }
                                        return nodes.length > 0 ? nodes : line;
                                      };

                                      // Build sections: lines ending with ':' are headings
                                      const lines = text.split('\n');
                                      const sections = [];
                                      let current = null;
                                      lines.forEach((line) => {
                                        if (line.trim().endsWith(':')) {
                                          if (current) sections.push(current);
                                          current = { title: line.trim(), body: [] };
                                        } else {
                                          if (!current) current = { title: "Here’s Why This Post Delivers", body: [] };
                                          current.body.push(line);
                                        }
                                      });
                                      if (current) sections.push(current);

                                      return sections.map((sec, idx) => (
                                        <details key={`sec-${idx}`} className="alfred-acc rounded-lg mb-2">
                                          <summary className="head-conversational cursor-pointer  select-none px-3 py-3 text-sm  text-gray-900">
                                            {sec.title}
                                            <svg 
                                              className="alfred-acc-icon" 
                                              width="14" 
                                              height="8" 
                                              viewBox="0 0 14 8" 
                                              fill="none" 
                                              xmlns="http://www.w3.org/2000/svg"
                                            >
                                              <path 
                                                d="M0.75 0.75L6.75 6.75L12.75 0.75" 
                                                stroke="#515151" 
                                                strokeWidth="1.5" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round"
                                              />
                                            </svg>
                                          </summary>
                                          <div className="px-3 pb-3 pt-3 whitespace-pre-line text-sm text-gray-700">
                                            {sec.body.length === 0
                                              ? null
                                              : sec.body
                                                  .join('\n')
                                                  .split('\n')
                                                  .map((ln, i) => (
                                                    <span key={`ln-${idx}-${i}`}>{renderBold(ln, `ln-${idx}-${i}`)}{i < sec.body.length - 1 ? '\n' : ''}</span>
                                                  ))}
                                          </div>
                                        </details>
                                      ));
                                    })()}
                                  </div>
                                </div>
                              )}

                              {/* Success Message - Show when content is published or scheduled */}
                              {publishSuccessMap[message.content.id] &&
                                publishSuccessMap[message.content.id][
                                  selectedPlatform
                                ] && (
                                  <div className="mt-4 p-6 py-7 rounded-2xl  shadow-lg border-[#0000] bg-white max-w-md">
                                    {/* Professional Header */}
                                    <div className="text-center">
                                      {/* Professional Icon */}
                                      <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center shadow-md bg-[#84E084]">
                                        {/* {publishSuccessMap[message.content.id][
                                      selectedPlatform
                                    ].isPublished ? (
                                      <CheckCircle className="w-8 h-8 text-[#173E44]" />
                                    ) : publishSuccessMap[message.content.id][
                                        selectedPlatform
                                      ].isScheduled ? (
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

                                      <h3 className="text-xl font-bold text-[#173E44] mb-2">
                                        <p className="publish-screens mb-0 pb-0">
                                          {publishSuccessMap[
                                            message.content.id
                                          ][selectedPlatform].isPublished
                                            ? "Successfully Published"
                                            : publishSuccessMap[
                                                message.content.id
                                              ][selectedPlatform].isScheduled
                                            ? "Successfully Scheduled"
                                            : "Successfully Published"}
                                        </p>
                                        <p className="publish-post-p pt-1">
                                          {!publishSuccessMap[
                                            message.content.id
                                          ][selectedPlatform].isScheduled
                                            ? "Your post has been published and is now live!"
                                            : "Post scheduled and will be automatically published"}
                                        </p>
                                        {/* <div className="flex items-center justify-center space-x-2 mt-2">
                                      {publishSuccessMap[message.content.id][
                                        selectedPlatform
                                      ].testMode && (
                                          <span
                                            className="px-2 py-1 text-xs font-medium rounded-full border"
                                            style={{
                                              background:
                                                "rgba(245, 158, 11, 0.15)",
                                              color: "#F59E0B",
                                              borderColor:
                                                "rgba(245, 158, 11, 0.3)",
                                            }}
                                          >
                                            TEST MODE
                                          </span>
                                        )}
                                      {(publishSuccessMap[message.content.id][
                                        selectedPlatform
                                      ].ayrsharePublished ||
                                        publishSuccessMap[message.content.id][
                                          selectedPlatform
                                        ].ayrshareScheduled) && (
                                          <span
                                            className="px-2 py-1 text-xs font-medium rounded-full border"
                                            style={{
                                              background: "rgba(34, 197, 94, 0.15)",
                                              color: "#22C55E",
                                              borderColor: "rgba(34, 197, 94, 0.3)",
                                            }}
                                          >
                                            AYRSHARE
                                          </span>
                                        )}
                                    </div> */}
                                      </h3>

                                      {/* Platform Badge */}
                                      <div className="flex items-center justify-center mb-2">
                                        <div
                                          className={`text-white px-3 py-1 rounded-lg flex items-center space-x-2 ${
                                            selectedPlatform === "linkedin"
                                              ? "bg-[#0A66C3]"
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
                                                className="w-3 h-3 text-white "
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                              >
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                              </svg>
                                            </div>
                                          ) : selectedPlatform ===
                                            "facebook" ? (
                                            <div className="w-5 h-5 bg-[#1877F2] rounded flex items-center justify-center">
                                              <svg
                                                className="w-3 h-3 text-white "
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                              >
                                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                              </svg>
                                            </div>
                                          ) : selectedPlatform ===
                                            "instagram" ? (
                                            <div className="w-5 h-5 bg-[#CF2972] rounded flex items-center justify-center">
                                              <svg
                                                className="w-3 h-3 text-white"
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                              >
                                                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.186 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                              </svg>
                                            </div>
                                          ) : (
                                            <div className="w-5 h-5 bg-gray-600 rounded flex items-center justify-center">
                                              <span className="text-white text-xs font-bold">
                                                {selectedPlatform
                                                  .charAt(0)
                                                  .toUpperCase()}
                                              </span>
                                            </div>
                                          )}
                                          <span className="font-medium text-md ">
                                            {selectedPlatform === "linkedin"
                                              ? "LinkedIn"
                                              : selectedPlatform === "twitter"
                                              ? "X"
                                              : selectedPlatform
                                                  .charAt(0)
                                                  .toUpperCase() +
                                                selectedPlatform.slice(1)}
                                          </span>
                                        </div>
                                      </div>
                                      {console.log(
                                        "scheduledTime isScheduled",
                                        {
                                          id: message.content.id,
                                          time: publishSuccessMap[
                                            message.content.id
                                          ][selectedPlatform].scheduledTime,
                                        }
                                      )}

                                      {/* Show different buttons based on published vs scheduled */}
                                      {publishSuccessMap[message.content.id][
                                        selectedPlatform
                                      ].isScheduled ? (
                                        <div className="mt-4">
                                          {/* Scheduled time display above buttons */}
                                          {publishSuccessMap[
                                            message.content.id
                                          ][selectedPlatform].scheduledTime && (
                                            <div className="flex items-center justify-center space-x-2 text-gray-600 mb-4">
                                              <Clock className="w-4 h-4" />
                                              <span className="text-sm font-medium">
                                                {formatDateTimeWithUppercaseAMPM(
                                                  new Date(
                                                    publishSuccessMap[
                                                      message.content.id
                                                    ][
                                                      selectedPlatform
                                                    ].scheduledTime
                                                  ),
                                                  { dateStyle: "medium" }
                                                )}{" "}
                                                IST
                                              </span>
                                            </div>
                                          )}

                                          {/* Action buttons */}
                                          <div className="flex justify-center gap-3">
                                            <button
                                              onClick={() =>
                                                openScheduleModal(
                                                  message.content
                                                )
                                              }
                                              disabled={publishing || publishingContentId}
                                              className="px-4 py-3 bg-[#84E084] unchane-times text-[#000] rounded-lg text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#84E084]"
                                            >
                                              Change Time
                                            </button>
                                            <button
                                              onClick={() =>
                                                showConfirmation(
                                                  "unschedule",
                                                  message.content
                                                )
                                              }
                                              disabled={publishing || publishingContentId}
                                              className="px-4 py-3 unchane-times bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-100"
                                            >
                                              Unschedule
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex justify-center space-x-3 gap-2">
                                          <button
                                            onClick={() =>
                                              window.open(
                                                publishSuccessMap[
                                                  message.content.id
                                                ][selectedPlatform].postUrl,
                                                "_blank"
                                              )
                                            }
                                            className="flex chat-message-over items-center space-x-2 px-4 py-2 bg-[#84E084] text-[#000] rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-medium text-sm hover:bg-green-600"
                                          >
                                            <ExternalLink className="w-4 h-4" />
                                            <span>View Post</span>
                                          </button>

                                          <button
                                            onClick={() =>
                                              handleCopyUrl(
                                                publishSuccessMap[
                                                  message.content.id
                                                ][selectedPlatform].postUrl
                                              )
                                            }
                                            className={`flex chat-message-over items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg text-sm border ${
                                              copiedUrl
                                                ? "bg-green-500 text-white border-green-500"
                                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                            }`}
                                          >
                                            {copiedUrl ? (
                                              <>
                                                <Check className="w-4 h-4" />
                                                <span>Copied!</span>
                                              </>
                                            ) : (
                                              <>
                                                <Copy className="w-4 h-4" />
                                                <span>Copy Link</span>
                                              </>
                                            )}
                                          </button>
                                        </div>
                                      )}

                                      {/* Test Mode Error Details */}
                                      {publishSuccessMap[message.content.id][
                                        selectedPlatform
                                      ].testMode &&
                                        (publishSuccessMap[message.content.id][
                                          selectedPlatform
                                        ].linkedinError ||
                                          publishSuccessMap[message.content.id][
                                            selectedPlatform
                                          ].schedulerError) && (
                                          <div
                                            className="mt-3 p-3 rounded-lg border"
                                            style={{
                                              background: "#121318",
                                              borderColor: "#1D2027",
                                            }}
                                          >
                                            <div className="flex items-center space-x-2 mb-2">
                                              <svg
                                                className="w-4 h-4 text-yellow-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                              </svg>
                                              <span className="text-xs font-semibold text-yellow-400">
                                                Test Details
                                              </span>
                                            </div>
                                            <p className="text-xs text-yellow-300">
                                              {publishSuccessMap[
                                                message.content.id
                                              ][selectedPlatform]
                                                .linkedinError ||
                                                publishSuccessMap[
                                                  message.content.id
                                                ][selectedPlatform]
                                                  .schedulerError}
                                            </p>
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                )}

                              {/* Modern Action Buttons - Only show when not editing and not published to current platform */}
                              {!editingContent &&
                                (!publishSuccessMap[message.content.id] ||
                                  !publishSuccessMap[message.content.id][
                                    selectedPlatform
                                  ]) && (
                                  <div className="mt-4 flex flex-col items-center">
                                    {/* Prominent counter/warning ABOVE buttons for X */}
                                    {selectedPlatform === "twitter" && (() => {
                                      const originalPlatform = message.content?.original_platform;
                                      const isDifferentPlatform = originalPlatform && originalPlatform !== selectedPlatform;
                                      
                                      if (isDifferentPlatform) return null;
                                      
                                      return (
                                        <div
                                          className="mb-2 flex items-center justify-center space-x-2"
                                          aria-live="polite"
                                        >
                                          {isTwitterOverLimitFor(
                                            message?.content?.content_text
                                          ) && (
                                            <>
                                              <span
                                                className={`inline-block px-2 py-1 text-xs font-medium rounded-md border`}
                                                style={{
                                                  color: "#F87171",
                                                  borderColor:
                                                    "rgba(248,113,113,0.3)",
                                                  background:
                                                    "rgba(239,68,68,0.08)",
                                                }}
                                              >
                                                {`Character limit exceed ${getTwitterCharCountFor(
                                                  message?.content?.content_text
                                                )}/280`}
                                              </span>
                                              <button
                                                onClick={() =>
                                                  handleOpenEditModal(
                                                    message.content
                                                  )
                                                }
                                                disabled={publishing || publishingContentId}
                                                className="w-8 h-8 bg-[#fff] rounded-full flex items-center justify-center text-[#79DB79] hover:bg-[#1D2027] transition-colors shadow-sm border border-[#175817] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#fff]"
                                                title={publishing || publishingContentId ? "Cannot edit while publishing" : "Edit Content"}
                                                aria-label="Edit Content"
                                              >
                                                <svg
                                                  className="w-4 h-4"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                  />
                                                </svg>
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      );
                                    })()}
                                    {/* OPTION 1: Compact Split Button (CURRENT) */}
                                    {/* Check if content was originally saved to a different platform */}
                                    {(() => {
                                      const originalPlatform = message.content?.original_platform;
                                      const isDifferentPlatform = originalPlatform && originalPlatform !== selectedPlatform;
                                      
                                      if (isDifferentPlatform) {
                                        return (
                                          <div className="flex flex-col bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                                            <div className="flex items-center space-x-2 text-green-700 text-sm">
                                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                              </svg>
                                              <span>
                                                Your post was saved to <strong>{originalPlatform}</strong>.
                                                <br />
                                                To share it on <strong>{selectedPlatform}</strong>, open it from{" "}
                                                <button 
                                                  onClick={() => onNavigateToPosts()}
                                                  className="underline hover:text-green-800 font-medium cursor-pointer"
                                                >
                                                  My Posts
                                                </button>{" "}
                                                and select <strong>Duplicate</strong>.
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      }
                                      
                                      return (
                                        <div className="flex flex-col md:flex-row bg-[#ffffff] rounded-lg border border-[#1D2027] shadow-sm overflow-hidden">
                                          <button
                                            onClick={() => {
                                              showConfirmation(
                                                "publish",
                                                message.content
                                              );
                                            }}
                                            disabled={
                                              publishing ||
                                              isTwitterOverLimitFor(
                                                message?.content?.content_text
                                              )
                                            }
                                            className={`pub-btns px-3 py-2 flex items-center space-x-2 text-xs font-medium transition-all duration-200 ${
                                              publishingContentId === message.content.id ||
                                              isTwitterOverLimitFor(
                                                message?.content?.content_text
                                              )
                                                ? "bg-[#ffff] text-[#000] cursor-not-allowed"
                                                : "text-[#000000] bg-[#7DDD7D]"
                                            } `}
                                            style={
                                              publishing ||
                                              isTwitterOverLimitFor(
                                                message?.content?.content_text
                                              )
                                                ? undefined
                                                : {
                                                    background:
                                                      "linear-gradient(180deg, #7EDD7E 0%, #57C957 100%) !important",
                                                  }
                                            }
                                          >
                                            {publishingContentId === message.content.id ? (
                                              <>
                                                <LoadingSpinner size="w-3 h-3" />
                                                <span>Publishing...</span>
                                              </>
                                            ) : (
                                              <>
                                                {/* <Zap className="w-3 h-3" /> */}
                                                <span>Publish Now</span>
                                              </>
                                            )}
                                          </button>
                                          {(selectedPlatform === "linkedin" ||
                                            selectedPlatform === "twitter" ||
                                            selectedPlatform === "instagram" ||
                                            selectedPlatform === "facebook") && (
                                            <button
                                              onClick={() =>
                                                openScheduleModal(message.content)
                                                // showConfirmation(
                                                //   "schedule",
                                                //   message.content
                                                // )
                                              }
                                              disabled={
                                                publishing ||
                                                publishingContentId ||
                                                isTwitterOverLimitFor(
                                                  message?.content?.content_text
                                                )
                                              }
                                              className="pub-btns px-3 py-2 flex items-center space-x-2 text-xs font-medium bg-[#fff] text-[#000]  transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                              <Calendar className="w-3 h-3" />
                                              <span>Schedule</span>
                                            </button>
                                          )}
                                          <button
                                            onClick={() =>
                                              handleSaveToDraft(message.content)
                                            }
                                            disabled={
                                              publishing ||
                                              publishingContentId ||
                                              savingDraft ||
                                              savedDrafts.has(message.content.id)
                                            }
                                            className="pub-btns px-3 py-2 flex items-center space-x-2 text-xs font-medium bg-[#fff] text-[#000]  transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            {savingDraft ? (
                                              <LoadingSpinner size="w-3 h-3" />
                                            ) : savedDrafts.has(
                                                String(message.content.id)
                                              ) ? (
                                              <svg
                                                className="w-3 h-3"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M5 13l4 4L19 7"
                                                />
                                              </svg>
                                            ) : (
                                              <svg
                                                className="w-3 h-3"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                                                />
                                              </svg>
                                            )}
                                            <span className="pub-btns">
                                              {savingDraft
                                                ? "Saving..."
                                                : savedDrafts.has(
                                                    String(message.content.id)
                                                  )
                                                ? (message.content?.original_platform === selectedPlatform 
                                                    ? "Saved to Draft" 
                                                    : "Saved as Draft")
                                                : "Save to Draft"}
                                            </span>
                                          </button>
                                        </div>
                                      );
                                    })()}

                                    {/* OPTION 2: Floating Action Buttons 
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => {
                                      showConfirmation('publish', message.content);
                                    }}
                                    disabled={publishing}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
                                      publishing
                                        ? 'bg-green-300 cursor-not-allowed'
                                        : 'bg-green-500 text-white hover:bg-green-600 hover:shadow-xl hover:scale-110'
                                    }`}
                                    title="Publish Now"
                                  >
                                    {publishing ? (
                                      <LoadingSpinner size="w-4 h-4" />
                                    ) : (
                                      <Zap className="w-4 h-4" />
                                    )}
                                  </button>
                                  {selectedPlatform === 'linkedin' && (
                                    <button
                                      onClick={() => openScheduleModal(message.content)}
                                      disabled={publishing}
                                      className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500 text-white hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 disabled:opacity-50"
                                      title="Schedule Post"
                                    >
                                      <Calendar className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                                */}

                                    {/* OPTION 3: Pill Buttons with Badge
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => {
                                      setCurrentContent(message.content);
                                      handlePublish();
                                    }}
                                    disabled={publishing}
                                    className={`relative px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                                      publishing
                                        ? 'bg-green-100 text-green-400 cursor-not-allowed'
                                        : 'bg-green-500 text-white hover:bg-green-600 shadow-sm hover:shadow-md'
                                    }`}
                                  >
                                    {publishing ? (
                                      <>
                                        <LoadingSpinner size="w-3 h-3" />
                                        <span>Publishing...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Zap className="w-3 h-3" />
                                        <span>Publish</span>
                                        <span className="bg-green-400 text-green-900 px-1.5 py-0.5 rounded text-xs font-bold">NOW</span>
                                      </>
                                    )}
                                  </button>
                                  {selectedPlatform === 'linkedin' && (
                                    <button
                                      onClick={() => openScheduleModal(message.content)}
                                      disabled={publishing}
                                      className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 transition-all duration-200 flex items-center space-x-1.5 shadow-sm hover:shadow-md disabled:opacity-50"
                                    >
                                      <Calendar className="w-3 h-3" />
                                      <span>Schedule</span>
                                    </button>
                                  )}
                                </div>
                                */}

                                    {/* OPTION 4: Modern Glass Cards
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => {
                                      showConfirmation('publish', message.content);
                                    }}
                                    disabled={publishing}
                                    className={`px-3 py-2 backdrop-blur-sm bg-white/80 border border-white/20 rounded-lg text-xs font-medium transition-all duration-300 flex items-center space-x-1.5 shadow-lg ${
                                      publishing
                                        ? 'text-green-400 cursor-not-allowed'
                                        : 'text-green-600 hover:bg-green-50/80 hover:shadow-xl hover:scale-105'
                                    }`}
                                  >
                                    {publishing ? (
                                      <>
                                        <LoadingSpinner size="w-3 h-3" />
                                        <span>Publishing...</span>
                                      </>
                                    ) : (
                                      <>
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <Zap className="w-3 h-3" />
                                        <span>Publish Now</span>
                                      </>
                                    )}
                                  </button>
                                  {selectedPlatform === 'linkedin' && (
                                    <button
                                      onClick={() => showConfirmation('schedule', message.content)}
                                      disabled={publishing}
                                      className="px-3 py-2 backdrop-blur-sm bg-white/80 border border-white/20 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50/80 transition-all duration-300 flex items-center space-x-1.5 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50"
                                    >
                                      <Calendar className="w-3 h-3" />
                                      <span>Schedule</span>
                                    </button>
                                  )}
                                </div>
                                */}

                                    {/* OPTION 5: Segmented Control Style
                                <div className="p-1 bg-gray-100 rounded-lg flex">
                                  <button
                                    onClick={() => {
                                      setCurrentContent(message.content);
                                      handlePublish();
                                    }}
                                    disabled={publishing}
                                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                                      publishing
                                        ? 'bg-green-200 text-green-500 cursor-not-allowed'
                                        : 'bg-green-500 text-white shadow-sm'
                                    }`}
                                  >
                                    {publishing ? (
                                      <>
                                        <LoadingSpinner size="w-3 h-3" />
                                        <span>Publishing</span>
                                      </>
                                    ) : (
                                      <>
                                        <Zap className="w-3 h-3" />
                                        <span>Publish</span>
                                      </>
                                    )}
                                  </button>
                                  {selectedPlatform === 'linkedin' && (
                                    <button
                                      onClick={() => openScheduleModal(message.content)}
                                      disabled={publishing}
                                      className="px-3 py-1.5 rounded-md text-xs font-medium bg-white text-gray-700 hover:bg-gray-50 transition-all duration-200 flex items-center space-x-1.5 disabled:opacity-50 shadow-sm"
                                    >
                                      <Calendar className="w-3 h-3" />
                                      <span>Schedule</span>
                                    </button>
                                  )}
                                </div>
                                */}
                                  </div>
                                )}

                                  {/* Conversational Field - Display in a box below the content */}
                            
                            </div>
                          ) : (
                            /* Chat message */
                            <div className="leading-relaxed text-gray-200" style={{ overflowWrap: "break-word", wordBreak: "break-word" }}>
                              {typeof message.content === "string" ? (
                                <MarkdownRenderer content={message.content} />
                              ) : (
                                "Error displaying message"
                              )}
                            </div>
                          )}

                          {/* AI Suggestions - show for both content and chat messages */}
                          {/* {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-4 pt-3">
                          <p className="text-sm text-gray-600 mb-3 font-medium">Suggestions:</p>
                          <div className="flex flex-wrap gap-2">
                            {message.suggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => setInput(suggestion)}
                                className="btn-suggest px-3 py-1.5  rounded-lg transition-colors bg-[#EBF3FF] text-[#1A75BF] hover:bg-blue-200 font-medium"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )} */}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {/* User message text */}
                          <div
                            className="leading-relaxed mb-0"
                            style={{ whiteSpace: "pre-wrap", overflowWrap: "break-word", wordBreak: "break-word" }}
                          >
                            {message.content}
                          </div>

                          {/* User message image if present */}
                          {message.hasImage && message.imageUrl && (
                            <div className="mt-3">
                              <img
                                src={message.imageUrl}
                                alt="User uploaded image"
                                className="w-full max-w-md rounded-lg border border-[#1D2027]/30 shadow-sm"
                                onError={() => handleUserImageError(message)}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-[#ffff]/90 backdrop-blur-sm border border-[#c6f5a7] px-6 py-4 rounded-2xl shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#79DB79] border-t-transparent"></div>
                        <span className="text-[#000]">{currentText}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* <div  /> */}
              </div>
            )}
          </div>

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
                className="bg-white rounded-lg shadow-lg w-full max-w-sm relative  overflow-visible"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-4 py-4">
                  <h3 className="font-semibold text-black text-lg m-0">
                    Set time
                  </h3>
                </div>

                {/* Time Input Fields */}
                <div className="px-4 pb-8 flex gap-3">
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
                      <div style={{ scrollbarWidth: "none" }}  ref={hourDropdownRef}   className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto"  >
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
                <div className="px-4 py-4 flex gap-3 justify-center  ">
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

          {/* Modern Schedule Modal */}
          {showScheduleModal && (
            // <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            //   <div
            //     className="rounded-2xl shadow-2xl border w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white"
            //     style={{
            //       scrollbarWidth: "thin",
            //       scrollbarColor: "#2FB130 #ffffff",
            //     }}
            //   >
            //     {/* Header */}
            //     <div className="p-6 border-b border-gray-200">
            //       <div className="flex items-center justify-between">
            //         <div className="flex items-start space-x-3">
            //           <div className="w-14 h-14 rounded-full flex items-center justify-center bg-[#d8fdd8]">
            //             <svg
            //               width="30"
            //               height="30"
            //               viewBox="0 0 35 38"
            //               fill="none"
            //               xmlns="http://www.w3.org/2000/svg"
            //             >
            //               <path
            //                 d="M33 18.15V13.56C33 10.7037 33 9.27559 32.4368 8.18465C31.9415 7.22502 31.1512 6.44482 30.179 5.95587C29.0737 5.4 27.627 5.4 24.7333 5.4H10.2667C7.37306 5.4 5.92625 5.4 4.82105 5.95587C3.84887 6.44482 3.05848 7.22502 2.56313 8.18465C2 9.27559 2 10.7037 2 13.56V27.84C2 30.6963 2 32.1243 2.56313 33.2154C3.05848 34.1751 3.84887 34.9552 4.82105 35.4441C5.92625 36 7.37306 36 10.2667 36H18.3611M33 15.6H2M24.3889 2V8.8M10.6111 2V8.8M27.8333 34.3V24.1M22.6667 29.2H33"
            //                 stroke="#173E44"
            //                 stroke-width="2.5"
            //                 stroke-linecap="round"
            //                 stroke-linejoin="round"
            //               />
            //             </svg>
            //           </div>
            //           <div>
            //             <h3 className="schedule-yours font-bold text-gray-900">
            //               Schedule Your Post
            //             </h3>
            //             <p className="text-gray-500 text-sm">
            //               Choose the perfect time to reach your audience
            //             </p>
            //           </div>
            //         </div>
            //         <button
            //           onClick={() => {
            //             setShowScheduleModal(false);
            //             setScheduleDate("");
            //             setScheduleTime("");
            //           }}
            //           className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
            //         >
            //           <X className="w-5 h-5" />
            //         </button>
            //       </div>

            //       {/* Platform Selection */}
            //       <div className="mt-4 flex items-center space-x-3">
            //         <div
            //           className={`flex items-center space-x-1 px-3 py-2 rounded-lg cursor-pointer transition-colors ${selectedPlatform === "linkedin"
            //               ? "bg-[#0A66C2] text-white"
            //               : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            //             }`}
            //           onClick={() => setSelectedPlatform("linkedin")}
            //         >
            //           <div className="w-5 h-5 bg-[#0A66C2] rounded flex items-center justify-center">
            //             <svg
            //               className="w-3 h-3 text-white"
            //               viewBox="0 0 24 24"
            //               fill="currentColor"
            //             >
            //               <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            //             </svg>
            //           </div>
            //           <span className="font-medium text-sm">LinkedIn</span>
            //         </div>

            //         <div
            //           className={`flex items-center space-x-1 px-3 py-2 rounded-lg cursor-pointer transition-colors ${selectedPlatform === "twitter"
            //               ? "bg-black text-white"
            //               : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            //             }`}
            //           onClick={() => setSelectedPlatform("twitter")}
            //         >
            //           <div className="w-5 h-5 bg-black rounded flex items-center justify-center">
            //             <svg
            //               className="w-3 h-3 text-white"
            //               viewBox="0 0 24 24"
            //               fill="currentColor"
            //             >
            //               <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            //             </svg>
            //           </div>
            //           <span className="font-medium text-sm">Twitter</span>
            //         </div>

            //         <div
            //           className={`flex items-center space-x-1 px-3 py-2 rounded-lg cursor-pointer transition-colors ${selectedPlatform === "instagram"
            //               ? "bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white"
            //               : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            //             }`}
            //           onClick={() => setSelectedPlatform("instagram")}
            //         >
            //           <div className="w-5 h-5 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 rounded flex items-center justify-center">
            //             <svg
            //               className="w-3 h-3 text-white"
            //               fill="currentColor"
            //               viewBox="0 0 24 24"
            //             >
            //               <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            //             </svg>
            //           </div>
            //           <span className="font-medium text-sm">Instagram</span>
            //         </div>

            //         <div
            //           className={`flex items-center space-x-1 px-3 py-2 rounded-lg cursor-pointer transition-colors ${selectedPlatform === "facebook"
            //               ? "bg-blue-600 text-white"
            //               : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            //             }`}
            //           onClick={() => setSelectedPlatform("facebook")}
            //         >
            //           <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
            //             <svg
            //               className="w-3 h-3 text-white"
            //               viewBox="0 0 24 24"
            //               fill="currentColor"
            //             >
            //               <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            //             </svg>
            //           </div>
            //           <span className="font-medium text-sm">Facebook</span>
            //         </div>
            //       </div>
            //     </div>

            //     {/* Modal Body */}
            //     <div className="p-6 space-y-6 mt-3">
            //       {/* All Suggested Best Times */}
            //       {suggestedTimes.length > 0 && (
            //         <div>
            //           <div className="flex items-center space-x-2 mb-4">
            //             <svg
            //               width="22"
            //               height="22"
            //               viewBox="0 0 22 22"
            //               fill="none"
            //               xmlns="http://www.w3.org/2000/svg"
            //             >
            //               <path
            //                 d="M20.9208 12.265C20.9731 11.8507 21 11.4285 21 11C21 5.47715 16.5228 1 11 1C5.47715 1 1 5.47715 1 11C1 16.5228 5.47715 21 11 21C11.4354 21 11.8643 20.9722 12.285 20.9182M11 5V11L14.7384 12.8692M18 21V15M15 18H21"
            //                 stroke="#173E44"
            //                 stroke-width="2"
            //                 stroke-linecap="round"
            //                 stroke-linejoin="round"
            //               />
            //             </svg>

            //             <h4 className="schedule-yours all-sugges">
            //               All Suggested Best Times
            //             </h4>
            //             <div className="opti-borer px-2 py-1 mx-3 text-xs font-medium rounded-full bg-[#EFFFEB] text-[#29AA6A]">
            //               Optimized
            //             </div>
            //           </div>
            //           <div className="grid grid-cols-4 gap-3">
            //             {suggestedTimes.slice(0, 4).map((time, index) => {
            //               const date = new Date(time);
            //               const isToday =
            //                 date.toDateString() === new Date().toDateString();
            //               const isTomorrow =
            //                 date.toDateString() ===
            //                 new Date(
            //                   Date.now() + 24 * 60 * 60 * 1000
            //                 ).toDateString();

            //               let dayLabel = date.toLocaleDateString("en-US", {
            //                 weekday: "short",
            //               });
            //               if (isToday) dayLabel = "Today";
            //               else if (isTomorrow) dayLabel = "Tomorrow";

            //               // Show green dot for first two cards by default
            //               const showGreenDot = index < 2;

            //               return (
            //                 <button
            //                   key={index}
            //                   onClick={() => handleSuggestedTimeClick(time)}
            //                   className={`group px-3 py-2 rounded-lg transition-all duration-200 text-left border-2 ${selectedSuggestedTime === time
            //                       ? "border-[#EDEDED] bg-[#FAFAFA]"
            //                       : "border-[#EDEDED] bg-[#FAFAFA] hover:border-[#EDEDED]"
            //                     }`}
            //                 >
            //                   <div className="flex items-center justify-between mb-2">
            //                     <div className="text-md font-semibold text-[#173E44]">
            //                       {dayLabel}
            //                     </div>
            //                     {showGreenDot && (
            //                       <div className="w-2 h-2 rounded-full bg-green-500"></div>
            //                     )}
            //                   </div>
            //                   <div className="text-sm text-[#173E44] mb-2">
            //                     {date.toLocaleDateString("en-US", {
            //                       month: "short",
            //                       day: "numeric",
            //                     })}
            //                   </div>
            //                   <div className="flex items-center space-x-1">
            //                     <Clock className="w-4 h-4 text-[#2FB130]" />
            //                     <div className="text-sm font-semibold text-[#2FB130]">
            //                       {date.toLocaleTimeString("en-US", {
            //                         hour: "numeric",
            //                         minute: "2-digit",
            //                         hour12: true,
            //                       })}
            //                     </div>
            //                   </div>
            //                 </button>
            //               );
            //             })}
            //           </div>
            //         </div>
            //       )}

            //       {/* Custom Schedule */}
            //       <div>
            //         <div className="flex items-center space-x-2 mb-4 mt-3">
            //           <svg
            //             width="22"
            //             height="22"
            //             viewBox="0 0 22 22"
            //             fill="none"
            //             xmlns="http://www.w3.org/2000/svg"
            //           >
            //             <path
            //               d="M20.9208 12.265C20.9731 11.8507 21 11.4285 21 11C21 5.47715 16.5228 1 11 1C5.47715 1 1 5.47715 1 11C1 16.5228 5.47715 21 11 21C11.4354 21 11.8643 20.9722 12.285 20.9182M11 5V11L14.7384 12.8692M18 21V15M15 18H21"
            //               stroke="#173E44"
            //               stroke-width="2"
            //               stroke-linecap="round"
            //               stroke-linejoin="round"
            //             />
            //           </svg>
            //           <h4 className="all-sugges">Custom Schedule</h4>
            //         </div>
            //         <div className="grid grid-cols-2 gap-4">
            //           <div className="space-y-2">
            //             <label className="block text-sm font-medium text-gray-700">
            //               Date
            //             </label>
            //             <div className="relative">
            //               <input
            //                 type="date"
            //                 value={scheduleDate}
            //                 onChange={(e) => setScheduleDate(e.target.value)}
            //                 min={new Date().toISOString().split("T")[0]}
            //                 className="w-full pr-10 px-3 py-3 rounded-lg !border-2 !border-green-500 !bg-[#eeffe5] text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-300"
            //                 placeholder="Select a date"
            //               />
            //               <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
            //                 <span className="bg-[#2FB130] px-2 py-2 rounded">
            //                   <svg
            //                     width="20"
            //                     height="20"
            //                     viewBox="0 0 24 26"
            //                     fill="none"
            //                     xmlns="http://www.w3.org/2000/svg"
            //                   >
            //                     <path
            //                       d="M23 12.4V9.16C23 7.14381 23 6.13571 22.6003 5.36564C22.2488 4.68825 21.6879 4.13752 20.998 3.79238C20.2136 3.4 19.1869 3.4 17.1333 3.4H6.86667C4.81314 3.4 3.78637 3.4 3.00204 3.79238C2.3121 4.13752 1.75118 4.68825 1.39964 5.36564C1 6.13571 1 7.14381 1 9.16V19.24C1 21.2562 1 22.2642 1.39964 23.0344C1.75118 23.7118 2.3121 24.2625 3.00204 24.6076C3.78637 25 4.81314 25 6.86667 25H12.6111M23 10.6H1M16.8889 1V5.8M7.11111 1V5.8M19.3333 23.8V16.6M15.6667 20.2H23"
            //                       stroke="white"
            //                       stroke-width="2"
            //                       stroke-linecap="round"
            //                       stroke-linejoin="round"
            //                     />
            //                   </svg>
            //                 </span>
            //               </div>
            //             </div>
            //           </div>
            //           <div className="space-y-2">
            //             <label className="block text-sm font-medium text-gray-700">
            //               Time
            //             </label>
            //             <div className="relative">
            //               <input
            //                 id="scheduleTimeInput"
            //                 type="text"
            //                 value={
            //                   scheduleTime
            //                     ? (() => {
            //                       const [hour, minute] = scheduleTime.split(":");
            //                       const hour12 =
            //                         hour === "00"
            //                           ? 12
            //                           : hour === "12"
            //                             ? 12
            //                             : parseInt(hour) > 12
            //                               ? parseInt(hour) - 12
            //                               : parseInt(hour);
            //                       const ampm = parseInt(hour) >= 12 ? "PM" : "AM";
            //                       return `${hour12}:${minute} ${ampm}`;
            //                     })()
            //                     : ""
            //                 }
            //                 readOnly
            //                 onClick={openTimePicker}
            //                 className="w-full pr-10 px-3 py-3 rounded-lg !border-2 !border-green-500 !bg-[#eeffe5]

            //      text-sm bg-white cursor-pointer"
            //                 placeholder="Select time"
            //               />
            //               <button
            //                 type="button"
            //                 onClick={openTimePicker}
            //                 className="absolute inset-y-0 right-2 flex items-center z-10"
            //                 aria-label="Open time picker"
            //               >
            //                 <span className="bg-[#2FB130] bg-date px-2 py-2">
            //                   <svg
            //                     width="20"
            //                     height="20"
            //                     viewBox="0 0 26 26"
            //                     fill="none"
            //                     xmlns="http://www.w3.org/2000/svg"
            //                   >
            //                     <path
            //                       d="M24.905 14.518C24.9677 14.0208 25 13.5142 25 13C25 6.37258 19.6274 1 13 1C6.37258 1 1 6.37258 1 13C1 19.6274 6.37258 25 13 25C13.5225 25 14.0372 24.9666 14.542 24.9018M13 5.8V13L17.4861 15.243M21.4 25V17.8M17.8 21.4H25"
            //                       stroke="white"
            //                       stroke-width="2"
            //                       stroke-linecap="round"
            //                       stroke-linejoin="round"
            //                     />
            //                   </svg>
            //                 </span>
            //               </button>
            //             </div>
            //           </div>
            //           {scheduleDate && scheduleTime && (
            //             <div
            //               className="md:col-span-2 px-3 pt-3 pb-3 rounded-lg border"
            //               style={{ background: "#ff", borderColor: "#1D2027" }}
            //             >
            //               <div className="flex items-start space-x-2">
            //                 <div
            //                   className="w-5 h-5 rounded-full flex items-center justify-center"
            //                   style={{ background: "#79DB79" }}
            //                 >
            //                   <Clock className="w-3 h-3 text-black" />
            //                 </div>
            //                 <div>
            //                   <p className="text-xs font-medium text-[#000] mb-0">
            //                     Scheduled for
            //                   </p>
            //                   <p className="text-xs text-[#000] font-semibold mb-0 pb-0">
            //                     {new Date(
            //                       `${scheduleDate}T${scheduleTime}`
            //                     ).toLocaleString("en-IN", {
            //                       timeZone: "Asia/Kolkata",
            //                       dateStyle: "full",
            //                       timeStyle: "short",
            //                     })}{" "}
            //                     IST
            //                   </p>
            //                 </div>
            //               </div>
            //             </div>
            //           )}
            //         </div>
            //       </div>
            //     </div>

            //     {/* Footer */}
            //     <div className="border-t border-gray-200 p-6 bg-white">
            //       <div className="flex items-center justify-end space-x-3 gap-2">
            //         <button
            //           onClick={() => {
            //             setShowScheduleModal(false);
            //             setScheduleDate("");
            //             setScheduleTime("");
            //           }}
            //           className=" can-btnss px-4 py-2 bg-[#EAEAEA] hover:bg-[#EAEAEA] rounded-lg transition-all duration-200 font-medium text-sm text-gray-700"
            //         >
            //           Cancel
            //         </button>
            //         <button
            //           onClick={handleSchedule}
            //           disabled={scheduling || !scheduleDate || !scheduleTime}
            //           className={`can-btnss px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 text-sm ${scheduling || !scheduleDate || !scheduleTime
            //               ? "bg-gray-300 cursor-not-allowed text-gray-500"
            //               : "bg-[#2FB130] hover:bg-[#2FB130] text-white shadow-md hover:shadow-lg"
            //             }`}
            //         >
            //           {scheduling ? (
            //             <>
            //               <LoadingSpinner size="w-3 h-3" />
            //               <span>Scheduling...</span>
            //             </>
            //           ) : (
            //             <>
            //               <span>Schedule</span>
            //             </>
            //           )}
            //         </button>
            //       </div>
            //     </div>
            //   </div>
            // </div>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4">
              <div
                className="rounded-2xl shadow-2xl border w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#2FB130 #ffffff",
                }}
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
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
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                      style={{ position: "relative", top: "-30px" }}
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
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[#0A66C2] text-white"
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
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white"
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
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 text-white"
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
                <div className="p-6 space-y-6 mt-3">
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
                                    const [hour, minute] =
                                      scheduleTime.split(":");
                                    const hour12 =
                                      hour === "00"
                                        ? 12
                                        : hour === "12"
                                        ? 12
                                        : parseInt(hour) > 12
                                        ? parseInt(hour) - 12
                                        : parseInt(hour);
                                    const ampm =
                                      parseInt(hour) >= 12 ? "PM" : "AM";
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
                        scheduling ||
                        !scheduleDate ||
                        !scheduleTime ||
                        !isFutureSchedule
                      }
                      className={`can-btnss px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 text-sm ${
                        scheduling ||
                        !scheduleDate ||
                        !scheduleTime ||
                        !isFutureSchedule
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

          {/* Edit Content Modal */}
          <EditContentModal
            isOpen={showEditModal}
            onClose={handleCloseEditModal}
            content={modalEditingContent}
            onContentUpdate={handleContentUpdate}
            publishSuccessMap={publishSuccessMap}
            setPublishSuccessMap={setPublishSuccessMap}
            onNavigateToSocial={onNavigateToSocial}
            platform={selectedPlatform}
            isOriginalPlatform={true}
            showDuplicateButton={false}
            publishing={publishing || !!publishingContentId}
          />

          {/* Simple Draft Saved Modal */}
          {showDraftModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 max-w-sm w-full mx-4 relative">
                {/* Close Button */}
                <button
                  onClick={() => setShowDraftModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="text-center">
                  {/* Success Icon */}
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Draft Saved!
                  </h3>

                  <p className="text-gray-600 text-sm mb-4">
                    Your content has been saved as a draft successfully.
                  </p>

                  {/* Close Button */}
                  <button
                    onClick={() => setShowDraftModal(false)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Close
                  </button>
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
            onNavigateToBilling={onNavigateToBilling}
            plan={plan}
          />
        </div>
        <div ref={messagesEndRef}></div>
        {/* Input Area - Sticky at bottom */}
        <div
          className="sticky bottom-0  px-3 pb-2 pt-3 z-10 mx-lg-4 mx-2 mb-3"
          style={{
            paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)",
            backgroundColor: "#fff",
            borderRadius: "9px",
            // bottom:"15px",
          }}
        >
          {/* Centered Input Bar */}
          <div className="chat-box-in">
            {/* Image Preview - Show above input when image is uploaded */}
            {uploadedImage && (
              <div className="mb-3 bg-[#ffffff] backdrop-blur-md border border-[#1D2027] rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Image className="w-5 h-5 text-[#79DB79]" />
                    <span className="text-sm font-medium text-gray-300">
                      Image ready for analysis
                    </span>
                  </div>
                  <button
                    onClick={removeUploadedImage}
                    className="w-6 h-6 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <img
                    src={imagePreview}
                    alt="Uploaded for analysis"
                    className="w-16 h-16 object-cover rounded-lg border border-[#1D2027]"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-300 mb-1">
                      <strong>{uploadedImage.name}</strong> •{" "}
                      {uploadedImage.size > 1024 * 1024
                        ? `${(uploadedImage.size / (1024 * 1024)).toFixed(
                            1
                          )} MB`
                        : `${Math.round(uploadedImage.size / 1024)} KB`}
                    </p>
                    <p className="text-xs text-[#79DB79] font-medium">
                      Type your prompt below to analyze this image
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Input Field - Sticky Icons Layout */}
            <div className="bg-[#F4F4F4a4]/95 backdrop-blur-md rounded-2xl shadow-sm mb-3 relative">
              {/* Main Input Container */}
              <div className="flex items-end space-x-2 md:space-x-3 px-3 md:px-4 py-3">
                {/* Left side - Image Upload Button - Sticky to bottom */}
                <div className="flex-shrink-0 self-end">
                  <button
                    onClick={() => imageAnalysisFileInputRef.current?.click()}
                    className="upload-image w-8 h-8 bg-[#fff] rounded-full flex items-center justify-center text-[#79DB79] transition-colors shadow-sm border border-[#79DB79] disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Upload image for AI analysis"
                    disabled={loading}
                  >
                    <ImagePlus className="w-4 h-4" />
                  </button>
                </div>

                {/* Center - Text Input Area */}
                <div className="flex-1 relative m-0"  style={{ paddingRight: "-120px !important" }} >
                  <textarea
                    rows={"1"}
                    value={input}
                    maxLength={MAX_INPUT_LENGTH}
                    onChange={(e) => {
                      const el = e.target;
                      el.style.height = "auto"; // Reset height
                      el.style.height = Math.min(el.scrollHeight, 200) + "px"; // Cap at 200px max
                      
                      // Check if scrolling is needed
                      const needsScroll = el.scrollHeight > 200;
                      setShowScrollbar(needsScroll);
                      
                      const next = e.target.value;
                      setInput(
                        next.length > MAX_INPUT_LENGTH
                          ? next.slice(0, MAX_INPUT_LENGTH)
                          : next
                      );
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={
                      uploadedImage ? "Ask about this image..." : "Ask Alfred..."
                    }
                    className={`w-full bg-transparent border-none outline-none text-[#363636] placeholder-[#6D6D6D] resize-none min-h-[20px] ${!showScrollbar ? 'chat-input-hide-scrollbar' : ''}`}
                    style={{
                      maxHeight: "176px",
                      resize: "none",
                      overflowY: "auto",
                      scrollbarWidth: showScrollbar ? "thin" : "none",
                      paddingRight: "120px"
                    }}
                    disabled={loading}
                  />
                </div>

                {/* Right side - Send Button and Character Counter - Sticky to bottom */}
                <div className="flex items-center space-x-2 flex-shrink-0 self-end absolute right-3 md:right-7" style={{ bottom: "12px" }}>
                  {/* Send Button */}
                  <button
                    onClick={handleSendMessage}
                    disabled={
                      loading || !input.trim() || input.length > MAX_INPUT_LENGTH
                    }
                    className="w-8 button-sends-1 h-8 rounded-full flex items-center justify-center text-black transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background:
                        "linear-gradient(180deg, #7EDD7E 0%, #57C957 100%)",
                    }}
                  >
                    {loading && analyzingImage ? (
                      <LoadingSpinner size="w-4 h-4" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                  
                  {/* Character Counter */}
                  <div className="ml-2 text-xs text-[#6D6D6D]">
                    {input.length}/{MAX_INPUT_LENGTH}
                  </div>
                </div>
              </div>
            </div>

            {/* Configuration Options */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-3 ">
              {/* Platform Selection */}
              <div className="flex items-center space-x-1.5 congif">
                {/* <Target className="w-4 h-4 text-[#79DB79]" /> */}
                <span className="text-md font-medium text-[#676767]">
                  Platform:
                </span>
                <div className="flex flex-wrap gap-1">
                  {platforms.map((platform) => {
                    const IconComponent = PlatformIcons[platform.value];
                    return (
                      <button
                        key={platform.value}
                        onClick={() => setSelectedPlatform(platform.value)}
                        className={`linkedin-palt  relative flex items-center space-x-1.5 px-2 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                          selectedPlatform === platform.value
                            ? `${platform.color} text-white shadow-sm ring-2 ring-[#79DB79] border-[#175817]`
                            : "bg-[#EDEDED] text-[#464646] "
                        }`}
                        title={
                          platform.directPublish
                            ? `${platform.label} - Direct publishing available`
                            : `${platform.label} - Manual publishing`
                        }
                      >
                        <IconComponent />
                        <span className="hidden sm:inline">
                          {platform.label}
                        </span>
                        {platform.directPublish && (
                          <span className="text-xs">⚡</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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

      {/* Media Preview Modal */}
      {showMediaPreview && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
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

export default ChatInterface;
