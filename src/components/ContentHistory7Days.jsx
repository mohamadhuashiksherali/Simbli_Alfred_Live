import React, { useState, useEffect, useRef } from "react";
import {
  Calendar,
  Clock,
  Hash,
  Image as ImageIcon,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw,
  User,
  Bot,
  Edit3,
  Trash2,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { getLast7DaysContentHistoryApi } from "../api/api";
import MarkdownRenderer from "./MarkdownRenderer";
import Swal from "sweetalert2";

const ContentHistory7Days = () => {
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDays, setExpandedDays] = useState(new Set());
  const [expandedSessions, setExpandedSessions] = useState(new Set());
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [editedHashtags, setEditedHashtags] = useState([]);
  const messagesEndRef = useRef(null);

  // Helper function to clean content text from raw JSON
  const cleanContentText = (contentText) => {
    if (!contentText) return "No content available";

    if (typeof contentText === "string" && contentText.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(contentText);
        return (
          parsed.content_text || "Content parsing error - please regenerate"
        );
      } catch (e) {
        const match = contentText.match(
          /"content_text":\s*"([^"]*(?:\\"[^"]*)*)"/
        );
        if (match) {
          return match[1].replace(/\\"/g, '"');
        }
        return "Content display error - please regenerate content";
      }
    }
    return contentText;
  };

  // Fetch last 7 days content history
  const fetchLast7DaysData = async () => {
    try {
      setLoading(true);
      const response = await getLast7DaysContentHistoryApi();
      if (response?.data) {
        setDailyData(response.data.daily_data || []);
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

  // Toggle day expansion
  const toggleDay = (date) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDays(newExpanded);
  };

  // Toggle session expansion
  const toggleSession = (sessionId) => {
    const newExpanded = new Set(expandedSessions);
    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }
    setExpandedSessions(newExpanded);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });
    }
  };

  // Format time for display
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // Get platform color
  const getPlatformColor = (platform) => {
    const colors = {
      linkedin: "from-blue-500 to-blue-600",
      twitter: "from-sky-500 to-blue-500",
      instagram: "from-pink-500 to-purple-500",
      facebook: "from-blue-600 to-blue-700",
    };
    return colors[platform] || "from-gray-500 to-gray-600";
  };

  // Get platform icon
  const getPlatformIcon = (platform) => {
    const icons = {
      linkedin: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
      twitter: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
        </svg>
      ),
      instagram: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
      facebook: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    };
    return (
      icons[platform] || (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      )
    );
  };

  // Build image URL
  const buildImageUrl = (rawUrl) => {
    if (!rawUrl) return "";
    if (/^https?:\/\//i.test(rawUrl)) return rawUrl;
    const normalizedPath = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
    const base =
      import.meta?.env?.VITE_API_BASE_URL || "https://backend-alfred.simbli.ai";
    const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    return `${normalizedBase}${normalizedPath}`;
  };

  // Copy to clipboard
  const copyToClipboard = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Filter data based on selected filters
  const filteredDailyData = dailyData.filter((day) => {
    if (filterDate !== "all") {
      const dayDate = new Date(day.date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (
        filterDate === "today" &&
        dayDate.toDateString() !== today.toDateString()
      ) {
        return false;
      }
      if (
        filterDate === "yesterday" &&
        dayDate.toDateString() !== yesterday.toDateString()
      ) {
        return false;
      }
    }

    if (filterPlatform !== "all") {
      const hasMatchingPlatform = day.sessions.some((session) =>
        session.content_items.some(
          (content) => content.platform === filterPlatform
        )
      );
      if (!hasMatchingPlatform) return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: "#79DB79", borderBottomColor: "transparent" }}
          ></div>
          <p className="text-gray-400">Loading your content history...</p>
        </div>
      </div>
    );
  }

  if (dailyData.length === 0) {
    return (
      <div className="text-center py-20">
        <div
          className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(180deg, #7EDD7E 0%, #57C957 100%)",
          }}
        >
          <MessageSquare className="w-12 h-12 text-black" />
        </div>
        <h3 className="text-xl font-semibold text-gray-100 mb-3">
          No content history found
        </h3>
        <p className="text-gray-400 max-w-md mx-auto">
          Start creating content in the AI Chat tab to see your history here.
          Your generated posts and conversations will appear here for easy
          access.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <style>{`
        .chat-message-over {
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .content-history-header {
          background: linear-gradient(135deg, #EFFBEF 0%, #F0FDF4 100%);
          border: 1px solid #D1FAE5;
        }
        .day-card {
          background: #FFFFFF;
          border: 1px solid #E5E7EB;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .session-card {
          background: #FAFAFA;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
        }
        .message-bubble {
          border-radius: 12px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        .content-item-card {
          background: #F9FAFB;
          border: 1px solid #E5E7EB;
          border-radius: 8px;
        }
      `}</style>

      {/* Header */}
      <div className="content-history-header p-4 md:p-6 mb-4 mx-lg-4 mx-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-[#E0FFE3] backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Content History - Last 7 Days
              </h2>
              <p className="text-sm text-gray-600">
                Your recent conversations and generated content
              </p>
            </div>
          </div>
          <button
            onClick={fetchLast7DaysData}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-white/50 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm focus:outline-none bg-white border border-gray-300 focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Days</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
          </select>

          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm focus:outline-none bg-white border border-gray-300 focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Platforms</option>
            <option value="linkedin">LinkedIn</option>
            <option value="twitter">Twitter</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 pb-5 md:pb-4 py-5 chat-message-over bg-[#fff] my-4 mx-lg-4 mx-2">
        <div className="space-y-4">
          {filteredDailyData.map((day) => (
            <div key={day.date} className="day-card">
              {/* Day Header */}
              <div
                className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleDay(day.date)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-500" />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {formatDate(day.date)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {day.sessions_count} sessions • {day.content_count}{" "}
                        content items • {day.messages_count} messages
                      </p>
                    </div>
                  </div>
                  {expandedDays.has(day.date) ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </div>

              {/* Day Content */}
              {expandedDays.has(day.date) && (
                <div className="p-4 space-y-4">
                  {day.sessions.map((session) => (
                    <div key={session.session.id} className="session-card">
                      {/* Session Header */}
                      <div
                        className="p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleSession(session.session.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <MessageSquare className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {session.session.title}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {session.content_items.length} content items •{" "}
                                {session.messages.length} messages
                              </p>
                            </div>
                          </div>
                          {expandedSessions.has(session.session.id) ? (
                            <ChevronUp className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                      </div>

                      {/* Session Content */}
                      {expandedSessions.has(session.session.id) && (
                        <div className="p-4 space-y-4">
                          {/* Messages */}
                          {session.messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${
                                message.type === "user"
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-3xl message-bubble p-3 ${
                                  message.type === "user"
                                    ? "bg-green-100 text-gray-900"
                                    : "bg-gray-100 text-gray-900"
                                }`}
                              >
                                <div className="flex items-start space-x-2">
                                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                                    {message.type === "user" ? (
                                      <User className="w-4 h-4 text-green-600" />
                                    ) : (
                                      <Bot className="w-4 h-4 text-gray-600" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-sm">
                                      <MarkdownRenderer
                                        enableInline={true}
                                        content={message.content}
                                      />
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                      <span className="text-xs text-gray-500">
                                        {formatTime(message.timestamp)}
                                      </span>
                                      <button
                                        onClick={() =>
                                          copyToClipboard(
                                            message.content,
                                            message.id
                                          )
                                        }
                                        className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                                      >
                                        {copiedMessageId === message.id ? (
                                          <Check className="w-3 h-3" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                        <span>
                                          {copiedMessageId === message.id
                                            ? "Copied!"
                                            : "Copy"}
                                        </span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}

                          {/* Content Items */}
                          {session.content_items.map((content) => (
                            <div
                              key={content.id}
                              className="content-item-card p-4"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div
                                    className={`w-8 h-8 bg-gradient-to-r ${getPlatformColor(
                                      content.platform
                                    )} rounded-lg flex items-center justify-center text-white`}
                                  >
                                    {getPlatformIcon(content.platform)}
                                  </div>
                                  <div>
                                    <span className="text-sm font-semibold text-blue-600 capitalize">
                                      {content.platform}
                                    </span>
                                    <span className="ml-2 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
                                      {content.domain}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500 flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {formatTime(content.created_at)}
                                  </span>
                                  <button
                                    onClick={() =>
                                      copyToClipboard(
                                        cleanContentText(content.content_text),
                                        content.id
                                      )
                                    }
                                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                                  >
                                    {copiedMessageId === content.id ? (
                                      <Check className="w-3 h-3" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                    <span>
                                      {copiedMessageId === content.id
                                        ? "Copied!"
                                        : "Copy"}
                                    </span>
                                  </button>
                                </div>
                              </div>

                              {/* Prompt */}
                              <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-3">
                                <div className="flex items-center space-x-2 mb-1">
                                  <div className="w-3 h-3 flex items-center justify-center">
                                    <img
                                      src="/simbli.png"
                                      alt="Simbli"
                                      className="w-3 h-3"
                                    />
                                  </div>
                                  <span className="text-xs font-medium text-gray-700">
                                    Prompt
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 italic">
                                  "{content.prompt}"
                                </p>
                              </div>

                              {/* Content */}
                              <div className="space-y-3">
                                <div className="bg-white rounded-lg p-3 border border-gray-200">
                                  <div className="text-sm text-gray-800">
                                    <MarkdownRenderer
                                      enableInline={false}
                                      content={cleanContentText(
                                        content.content_text
                                      )}
                                    />
                                  </div>
                                </div>

                                {/* Image */}
                                {content.image_url && (
                                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                                    <img
                                      src={buildImageUrl(content.image_url)}
                                      alt="Content image"
                                      className="w-full rounded-lg max-h-64 object-contain"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none";
                                      }}
                                    />
                                  </div>
                                )}

                                {/* Hashtags */}
                                {(content.hashtags || []).length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {(content.hashtags || []).map(
                                      (hashtag, index) => (
                                        <span
                                          key={index}
                                          className="inline-flex items-center px-2 py-1 text-xs rounded-full border bg-blue-50 text-blue-700 border-blue-200"
                                        >
                                          <Hash className="w-3 h-3 mr-1" />
                                          {hashtag.replace("#", "")}
                                        </span>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContentHistory7Days;
