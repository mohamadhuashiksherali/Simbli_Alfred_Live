import React, { useState, useRef, useEffect, useContext } from "react";
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
import {
  getSocialConnectionsApi,
  analyzeImageApi,
  sendChatMessageApi,
  uploadImageApi,
  uploadVideoApi,
  generateImageApi,
  publishContentApi,
  getPublishUrlApi,
  reschedulePostApi,
  schedulePostApi,
  getSuggestedTimesApi,
  unschedulePostApi,
  saveDraftApi,
  updateContentApi,
  getLast7DaysContentHistoryApi,
  BASE_URL,
} from "../api/api";
import EditContentModal from "./EditContentModal";
import MarkdownRenderer from "./MarkdownRenderer";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import global from "../assets/global.png";

const ContentHistory7 = () => {
  const { user, isAuthenticated } = useAuth();

  // Use local state instead of ChatHistoryContext to avoid localStorage updates
  const [dailyMessages, setDailyMessages] = useState([]);
  const [publishSuccessMap, setPublishSuccessMap] = useState({});
  const [draftSuccessMap, setDraftSuccessMap] = useState({});

  const [loading, setLoading] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("linkedin");
  const [socialConnections, setSocialConnections] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [editedHashtags, setEditedHashtags] = useState([]);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(12);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [isAM, setIsAM] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [suggestedTimes, setSuggestedTimes] = useState([]);
  const [selectedSuggestedTime, setSelectedSuggestedTime] = useState(null);
  const [reschedulePostId, setReschedulePostId] = useState(null);
  const [regeneratingContentId, setRegeneratingContentId] = useState(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalEditingContent, setModalEditingContent] = useState(null);
  const [currentContent, setCurrentContent] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const imageAnalysisFileInputRef = useRef(null);
  const navigate = useNavigate();
  const transformApiResponse = (apiData) => {
    const dailyMessages = [];

    apiData.daily_data.forEach((day) => {
      const dayMessages = [];

      day.sessions.forEach((sessionData) => {
        const sessionId = sessionData.session.id;

        // Transform content items
        sessionData.content_items.forEach((content) => {
          dayMessages.push({
            id: Number(content.id), // or generate unique ID
            type: "ai",
            content: {
              ...content,
              id: String(content.id),
              session_id: sessionId,
            },
            timestamp: content.created_at,
            messageType: "content",
            suggestions: [
              "Generate content for another platform",
              "Create a different version",
              "Generate an image",
              "Fetch latest updates on a different topic",
            ],
          });
        });

        // Transform messages
        sessionData.messages.forEach((msg) => {
          dayMessages.push({
            id: Number(msg.id),
            type: msg.type,
            content:
              typeof msg.content === "object" ? msg.content : msg.content,
            timestamp: msg.timestamp,
            messageType: msg.metadata?.message_type || "message",
            suggestions: [], // optional, if you want suggestions for AI messages only
          });
        });
      });

      // Sort messages within each day by timestamp
      dayMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // Add day information with messages
      if (dayMessages.length > 0) {
        dailyMessages.push({
          date: day.date,
          messages: dayMessages,
          sessionsCount: day.sessions_count,
          contentCount: day.content_count,
          messagesCount: day.messages_count,
        });
      }
    });

    return dailyMessages;
  };

  // Helper function to clean content text from raw JSON
  const cleanContentText = (contentText) => {
    if (!contentText) return "No content available";

    // Check if content is raw JSON and handle it
    if (typeof contentText === "string" && contentText.trim().startsWith("{")) {
      try {
        // First try a direct parse
        const parsed = JSON.parse(contentText);
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
    return contentText;
  };

  // Strict sanitizer: remove markdown symbols, escape sequences and slashes, keep lists/numbering
  const sanitizePlainText = (text) => {
    if (!text) return "";
    let out = String(text);
    // Decode common escaped sequences first
    out = out.replace(/\\n/g, "\n").replace(/\\r/g, "").replace(/\\t/g, " ");
    // Preserve http(s):// temporarily
    out = out.replace(/https?:\/\//g, (m) => m.replace("://", "__PROTOCOL__"));
    // Remove remaining backslashes and double forward slashes
    out = out.replace(/\\+/g, "");
    out = out.replace(/\/\/+?/g, " ");
    // Restore protocols
    out = out.replace(/__PROTOCOL__/g, "://");
    // Strip markdown headings at start of line
    out = out.replace(/^\s*#{1,6}\s*/gm, "");
    // Strip bold/italic/backticks/underscore emphasis markers
    out = out.replace(/\*\*([^*]+)\*\*/g, "$1");
    out = out.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1");
    out = out.replace(/__([^_]+)__/g, "$1");
    out = out.replace(/_([^_]+)_/g, "$1");
    out = out.replace(/`+/g, "");
    // Remove hashtags from content text (they will be shown separately in hashtags section)
    out = out.replace(/#[a-zA-Z0-9_]+/g, "");
    // Normalize bullets: convert leading '-' or '*' to '• '
    out = out.replace(/^\s*[\*-]\s+/gm, "• ");
    // Collapse excessive spaces
    out = out.replace(/[ \t]+/g, " ");
    return out.trim();
  };

  // Format content for social media display
  const formatContentForSocialMedia = (text) => {
    if (!text) return "";
    return sanitizePlainText(text);
  };

  // Format content for UI display
  const formatContentForUI = (text) => {
    if (!text) return "";
    return cleanContentText(text);
  };

  // Platform icons mapping
  const PlatformIcons = {
    linkedin: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    twitter: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
      </svg>
    ),
    instagram: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    facebook: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  };

  // Platform configuration
  const platforms = [
    {
      value: "linkedin",
      label: "LinkedIn",
      color: "bg-blue-600",
      directPublish: true,
    },
    {
      value: "twitter",
      label: "X",
      color: "bg-gray-900",
      directPublish: true,
    },
    {
      value: "instagram",
      label: "Instagram",
      color: "bg-pink-600",
      directPublish: false,
    },
    {
      value: "facebook",
      label: "Facebook",
      color: "bg-blue-700",
      directPublish: false,
    },
  ];

  // Copy message content to clipboard
  const handleCopyMessageContent = async (message) => {
    try {
      let contentToCopy = "";
      if (message.messageType === "content" && message.content) {
        const text = formatContentForSocialMedia(
          message.content.content_text || ""
        );
        const hashtags = (message.content.hashtags || [])
          .map((h) => `#${h.replace("#", "")}`)
          .join(" ");
        contentToCopy = `${text}${hashtags ? ` ${hashtags}` : ""}`;
      } else if (typeof message.content === "string") {
        contentToCopy = message.content;
      }

      if (contentToCopy) {
        await navigator.clipboard.writeText(contentToCopy);
        setCopiedMessageId(message.id);
        setTimeout(() => setCopiedMessageId(null), 2000);
      }
    } catch (error) {
      console.error("Failed to copy content:", error);
    }
  };

  // Handle edit modal opening
  const handleOpenEditModal = (content) => {
    setModalEditingContent(content);
    setEditedContent(content.content_text || "");
    setEditedHashtags(content.hashtags || []);
    setShowEditModal(true);
  };

  // Handle content update
  const handleUpdateContent = async (
    contentId,
    updatedContent,
    updatedHashtags
  ) => {
    try {
      setLoading(true);
      await updateContentApi(contentId, {
        content_text: updatedContent,
        hashtags: updatedHashtags,
      });

      // Update the message in the state
      setDailyMessages((prev) =>
        prev.map((day) => ({
          ...day,
          messages: day.messages.map((msg) =>
            msg.id === contentId
              ? {
                  ...msg,
                  content: {
                    ...msg.content,
                    content_text: updatedContent,
                    hashtags: updatedHashtags,
                  },
                }
              : msg
          ),
        }))
      );

      setShowEditModal(false);
      Swal.fire({
        text: "Content updated successfully!",
        icon: "success",
        background: "#FFFFFF",
        color: "#374151",
        customClass: {
          popup: "swal2-popup-custom",
          confirmButton: "swal2-confirm-custom",
        },
      });
    } catch (error) {
      console.error("Error updating content:", error);
      Swal.fire({
        text: "Failed to update content. Please try again.",
        icon: "error",
        background: "#FFFFFF",
        color: "#374151",
        customClass: {
          popup: "swal2-popup-custom",
          confirmButton: "swal2-confirm-custom",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle publishing content
  const handlePublishContent = async (content) => {
    try {
      const isConnected = await promptConnectIfNeeded(selectedPlatform);
      if (!isConnected) return;

      setPublishing(true);
      const response = await publishContentApi(content.id, selectedPlatform);

      if (response?.data?.url) {
        setPublishSuccessMap((prev) => ({
          ...prev,
          [content.id]: response.data.url,
        }));
        Swal.fire({
          text: `Content published successfully to ${selectedPlatform}!`,
          icon: "success",
          background: "#FFFFFF",
          color: "#374151",
          customClass: {
            popup: "swal2-popup-custom",
            confirmButton: "swal2-confirm-custom",
          },
        });
      }
    } catch (error) {
      console.error("Error publishing content:", error);
      Swal.fire({
        text: "Failed to publish content. Please try again.",
        icon: "error",
        background: "#FFFFFF",
        color: "#374151",
        customClass: {
          popup: "swal2-popup-custom",
          confirmButton: "swal2-confirm-custom",
        },
      });
    } finally {
      setPublishing(false);
    }
  };

  // Handle scheduling content
  const handleScheduleContent = (content) => {
    setCurrentContent(content);
    setShowScheduleModal(true);
  };

  // Handle saving draft
  const handleSaveDraft = async (content) => {
    try {
      setSavingDraft(true);
      await saveDraftApi(content.id);

      setDraftSuccessMap((prev) => ({ ...prev, [content.id]: true }));
      setShowDraftModal(true);
      setTimeout(() => setShowDraftModal(false), 3000);
    } catch (error) {
      console.error("Error saving draft:", error);
      Swal.fire({
        text: "Failed to save draft. Please try again.",
        icon: "error",
        background: "#FFFFFF",
        color: "#374151",
        customClass: {
          popup: "swal2-popup-custom",
          confirmButton: "swal2-confirm-custom",
        },
      });
    } finally {
      setSavingDraft(false);
    }
  };

  // Prompt user to connect platform if needed
  const promptConnectIfNeeded = async (platform) => {
    try {
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
        navigate(`/dashboard?tab=social`);
      }
      return false;
    } catch (err) {
      navigate(`/dashboard?tab=social`);
      return false;
    }
  };

  const fetchLast7DaysData = async () => {
    try {
      setLoading(true);
      const response = await getLast7DaysContentHistoryApi();
      if (response?.data) {
        const dailyData = transformApiResponse(response?.data);
        setDailyMessages(dailyData);
      }
    } catch (error) {
      console.error("Error fetching last 7 days data:", error);
      Swal.fire({
        text: "Failed to load content history. Please try again.",
        icon: "error",
        background: "#FFFFFF",
        color: "#374151",
        customClass: {
          popup: "swal2-popup-custom",
          confirmButton: "swal2-confirm-custom",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLast7DaysData();
  }, []);

  // Fetch social connections on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchSocialConnections();
    }
  }, [isAuthenticated, selectedPlatform]);

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

    if (found && found.is_connected && found.profile_info) {
      // Use platform-specific profile data from the API response
      const profileInfo = found.profile_info;

      if (selectedPlatform === "linkedin") {
        setUserProfile({
          name:
            profileInfo.name ||
            profileInfo.given_name + " " + profileInfo.family_name ||
            "User",

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
  // Local function to get regenerated map without localStorage
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

  // Handle user image error
  const handleUserImageError = (message) => {
    console.error("Failed to load user image:", message.imageUrl);
  };
  console.log("dailyMessages", dailyMessages);
  return (
    <div>
      <div className="w-full relative">
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
           `}</style>

        {/* Chat Messages Container */}
        <div className="p-4 md:p-6 pb-5 md:pb-4 py-5  chat-message-over bg-[#fff] my-4 mx-lg-4 mx-2">
          {dailyMessages.length === 0 ? (
            <div className="text-center text-gray-300 pt-4 pb-4">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#E0FFE3] backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                <img src="/simbli.png" alt="Simbli" className="w-8 h-8" />
              </div>

              {/* Personalized Welcome Message - Professional Typing Animation */}
              <div className="mb-2 text-center">
                <div className="inline-flex flex-col items-center space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-md text-[#262626] font-medium typing-animation">
                      Hi {user?.name || user?.username || "there"}!
                    </span>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight welcome-gradient">
                    Nothing yet—start fresh!
                  </h3>
                </div>
              </div>

              <p
                className="text-[#262626] text-md leading-relaxed max-w-md mx-auto mb-0 pb-0"
                style={{ fontWeight: "600" }}
              >
                Your Social Media Content Creation Assistant
              </p>
              <p className="text-[#686868] text-sm mt-2 max-w-md mx-auto">
                Start a conversation to create amazing social media content with
                perfect hashtags and strategy.
              </p>
            </div>
          ) : (
            <div className="space-y-8 p-4 bg-[#ffff] overall-chatss">
              {dailyMessages.map((dayData, dayIndex) => (
                <div key={dayData.date} className="space-y-6">
                  {/* Date Header */}
                  <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pb-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {new Date(dayData.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Messages for this day */}
                  <div className="space-y-6">
                    {dayData.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.type === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`${
                            message.type === "user"
                              ? "user-chat"
                              : "response-chat"
                          } px-4 md:px-6 py-2 md:py-4 rounded-2xl shadow-sm ${
                            message.type === "user"
                              ? "text-black"
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
                                    {/* Copy message content */}
                                    <button
                                      onClick={() =>
                                        handleCopyMessageContent(message)
                                      }
                                      className={`w-8 h-8 bg-white rounded-lg flex items-center justify-center ${
                                        copiedMessageId === message.id
                                          ? "text-green-600"
                                          : "text-gray-600"
                                      }  transition-colors  `}
                                      title="Copy Content"
                                    >
                                      {copiedMessageId === message.id ? (
                                        <Check className="w-4 h-4" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </button>
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
                                        {/* <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm">
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
                                        </div> */}

                                        {/* Profile Details */}
                                        {/* <div className="flex-1">
                                          <div className="flex items-center space-x-2">
                                            <h4 className="text-sm font-bold text-gray-900">
                                              {userProfile?.name ||
                                                user?.name ||
                                                "User"}
                                            </h4>
                                            <div className="flex items-center space-x-1"></div>
                                          </div>
                                          <p className="text-xs text-gray-600 mb-0 pb-0">
                                            {userProfile?.title ||
                                              "Social Media User"}
                                            {userProfile?.company &&
                                              ` • ${userProfile.company}`}
                                          </p>
                                          <span className="text-xs text-gray-500 flex items-center">
                                            Just now •{" "}
                                            <img
                                              className="ms-1"
                                              src={global}
                                              style={{
                                                objectFit: "contain",
                                                width: "10px",
                                                height: "10px",
                                              }}
                                            ></img>
                                          </span>
                                        </div> */}
                                      </div>
                                    </div>
                                  )}

                                  {/* Content Text */}
                                  <div className="text-black leading-relaxed text-sm">
                                    <div className="flex items-start space-x-2">
                                      <span className="text-lg"></span>
                                      <div className="flex-1">
                                        <MarkdownRenderer
                                          enableInline={false}
                                          content={
                                            formatContentForUI(
                                              message?.content?.content_text ||
                                                message.content
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

                                  {/* Media Display - Show only one: Video takes priority over Image */}
                                  {message.content.video_url ? (
                                    /* Video Display */
                                    <div className="mt-4 relative">
                                      <video
                                        src={
                                          message.content.video_url.startsWith(
                                            "http"
                                          )
                                            ? message.content.video_url
                                            : `${BASE_URL}${message.content.video_url}`
                                        }
                                        controls
                                        className="w-full max-w-full sm:max-w-2xl rounded-xl border border-[#1D2027] shadow-sm"
                                        style={{ height: "auto" }}
                                      >
                                        Your browser does not support the video
                                        tag.
                                      </video>
                                    </div>
                                  ) : message.content.image_url ? (
                                    /* Image Display */
                                    <div className="mt-4 relative">
                                      {regeneratingContentId ===
                                        message.content.id && (
                                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 rounded-xl">
                                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#79DB79] border-t-transparent"></div>
                                        </div>
                                      )}
                                      <img
                                        src={
                                          message.content.image_url.startsWith(
                                            "http"
                                          )
                                            ? message.content.image_url
                                            : `${BASE_URL}${message.content.image_url}`
                                        }
                                        alt="Generated content"
                                        className={`w-full max-w-full sm:max-w-2xl rounded-xl border border-[#1D2027] shadow-sm ${
                                          regeneratingContentId ===
                                          message.content.id
                                            ? "opacity-50"
                                            : ""
                                        }`}
                                        style={{
                                          width: "350px",
                                          height: "300px",
                                        }}
                                      />
                                      {(message.content.isRegenerated ||
                                        isRecentlyRegenerated(
                                          message.content.id
                                        )) && (
                                        <span
                                          className="absolute bottom-5 left-58 z-20 px-2 py-1  font-semibold rounded-full "
                                          style={{
                                        background: "#ffff",
                                        color: "#84E084",
                                        border:"2px solid #84E084 ",
                                        fontSize:"14px"
                                      }}
                                        >
                                          Regenerated
                                        </span>
                                      )}
                                    </div>
                                  ) : null}
                                </div>
                              ) : (
                                /* Chat message */
                                <div className="leading-relaxed text-gray-200">
                                  {typeof message.content === "string" ? (
                                    <MarkdownRenderer
                                      content={message.content}
                                    />
                                  ) : (
                                    "Error displaying message"
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {/* User message text */}
                              <p className="leading-relaxed mb-0">
                                {message.content}
                              </p>

                              {/* User message image if present */}
                              {message.hasImage && message.imageUrl && (
                                <div className="mt-3">
                                  <img
                                    src={message.imageUrl}
                                    alt="User uploaded image"
                                    className="w-full max-w-md rounded-lg border border-[#1D2027]/30 shadow-sm"
                                    onError={() =>
                                      handleUserImageError(message)
                                    }
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Content Modal */}
      {showEditModal && modalEditingContent && (
        <EditContentModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          content={modalEditingContent}
          onContentUpdate={(updatedContent) => {
            if (updatedContent === null) {
              // Handle deletion case - refresh data and close modal
              setShowEditModal(false);
              setModalEditingContent(null);
              // Refresh the content history data
              fetchContentHistory();
              return;
            }
            // Handle update case
            handleUpdateContent(
              modalEditingContent.id,
              updatedContent.content_text,
              updatedContent.hashtags
            );
          }}
          publishSuccessMap={{}}
          setPublishSuccessMap={() => {}}
        />
      )}

      {/* Draft Saved Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-auto text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Draft Saved!
            </h3>
            <p className="text-gray-600 text-sm">
              Your content has been saved as a draft successfully.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentHistory7;
