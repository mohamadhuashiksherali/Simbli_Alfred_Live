import React, { useState, useEffect } from "react";
import {
  Trash2,
  Edit3,
  Calendar,
  Hash,
  Image as ImageIcon,
  Clock,
  TrendingUp,
  Filter,
} from "lucide-react";
import axios from "axios";
import MarkdownRenderer from "./MarkdownRenderer";

// import { ClockIcon, MegaphoneIcon, Pencil, Trash2 } from "lucide-react";

const ContentHistory = () => {
  const [contentList, setContentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editedContent, setEditedContent] = useState("");
  const [editedHashtags, setEditedHashtags] = useState([]);
  const [filterPlatform, setFilterPlatform] = useState("all");
  const [filterDate, setFilterDate] = useState("all");

  // Helper function to clean content text from raw JSON
  const cleanContentText = (contentText) => {
    if (!contentText) return "No content available";

    // Check if content is raw JSON and handle it
    if (typeof contentText === "string" && contentText.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(contentText);
        return (
          parsed.content_text || "Content parsing error - please regenerate"
        );
      } catch (e) {
        // Try regex extraction as fallback
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

  useEffect(() => {
    fetchContentHistory();
  }, []);

  const fetchContentHistory = async () => {
    try {
      const response = await axios.get("/content/");
      setContentList(response.data);
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contentId) => {
    if (!window.confirm("Are you sure you want to delete this content?"))
      return;

    try {
      await axios.delete(`/content/${contentId}`);
      setContentList((prev) =>
        prev.filter((content) => content.id !== contentId)
      );
    } catch (error) {
      // Handle error silently
    }
  };

  const handleEdit = (content) => {
    setEditingId(content.id);
    setEditedContent(cleanContentText(content.content_text));
    setEditedHashtags(content.hashtags || []);
  };

  const handleSaveEdit = async (contentId) => {
    try {
      const response = await axios.put(`/content/${contentId}`, {
        content_text: editedContent,
        hashtags: editedHashtags,
      });

      setContentList((prev) =>
        prev.map((content) =>
          content.id === contentId ? response.data : content
        )
      );

      setEditingId(null);
      setEditedContent("");
      setEditedHashtags([]);
    } catch (error) {
      // Handle error silently
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedContent("");
    setEditedHashtags([]);
  };

  const addHashtag = (hashtag) => {
    if (!editedHashtags.includes(hashtag)) {
      setEditedHashtags((prev) => [...prev, hashtag]);
    }
  };

  const removeHashtag = (hashtag) => {
    setEditedHashtags((prev) => prev.filter((h) => h !== hashtag));
  };

  const formatDate = (dateString) => {
    // Convert UTC to Kolkata timezone (IST: UTC+5:30)
    const utcDate = new Date(dateString);
    const istDate = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000);

    const day = istDate.getDate();
    const year = istDate.getFullYear();
    const monthIndex = istDate.getMonth();
    const hours24 = istDate.getHours();
    const minutes = istDate.getMinutes().toString().padStart(2, "0");
    const hours12 = ((hours24 + 11) % 12) + 1;
    const period = hours24 >= 12 ? "pm" : "am";

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sept",
      "Oct",
      "Nov",
      "Dec",
    ];

    return `${day} ${months[monthIndex]} ${year}, ${hours12
      .toString()
      .padStart(2, "0")}:${minutes} ${period}`;
  };

  const getDateRange = (filter) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
      case "today":
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        };
      case "yesterday":
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return { start: yesterday, end: today };
      case "this_week":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return {
          start: startOfWeek,
          end: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000),
        };
      case "last_week":
        const lastWeekStart = new Date(today);
        lastWeekStart.setDate(today.getDate() - today.getDay() - 7);
        const lastWeekEnd = new Date(
          lastWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000
        );
        return { start: lastWeekStart, end: lastWeekEnd };
      case "this_month":
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        return { start: startOfMonth, end: endOfMonth };
      case "last_month":
        const startOfLastMonth = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        );
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return { start: startOfLastMonth, end: endOfLastMonth };
      default:
        return null;
    }
  };

  const getPlatformColor = (platform) => {
    const colors = {
      linkedin: "from-blue-500 to-blue-600",
      twitter: "from-sky-500 to-blue-500",
      instagram: "from-pink-500 to-purple-500",
      facebook: "from-blue-600 to-blue-700",
    };
    return colors[platform] || "from-gray-500 to-gray-600";
  };

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

  // Safely build image URL supporting absolute and relative paths
  const buildImageUrl = (rawUrl) => {
    if (!rawUrl) return "";
    // If already absolute
    if (/^https?:\/\//i.test(rawUrl)) return rawUrl;

    // Ensure leading slash for relative API paths
    const normalizedPath = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;

    // Prefer env base, fallback to localhost:8000
    const base =
      import.meta?.env?.VITE_API_BASE_URL || "https://backend-alfred.simbli.ai";
    // Remove trailing slash from base if present
    const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    return `${normalizedBase}${normalizedPath}`;
  };

  const getDomainColor = (domain) => {
    const colors = {
      tech: "bg-blue-100 text-blue-700",
      business: "bg-green-100 text-green-700",
      news: "bg-red-100 text-red-700",
      sports: "bg-orange-100 text-orange-700",
      entertainment: "bg-purple-100 text-purple-700",
      health: "bg-pink-100 text-pink-700",
      education: "bg-indigo-100 text-indigo-700",
    };
    return colors[domain] || "bg-gray-100 text-gray-700";
  };

  const filteredContent = contentList.filter((content) => {
    // Platform filter
    if (filterPlatform !== "all" && content.platform !== filterPlatform)
      return false;

    // Date filter
    if (filterDate !== "all") {
      const dateRange = getDateRange(filterDate);
      if (dateRange) {
        const contentDate = new Date(content.created_at);
        if (contentDate < dateRange.start || contentDate >= dateRange.end)
          return false;
      }
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
          <p className="text-gray-400">Loading your content...</p>
        </div>
      </div>
    );
  }

  if (contentList.length === 0) {
    return (
      <div className="text-center py-20">
        <div
          className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(180deg, #7EDD7E 0%, #57C957 100%)",
          }}
        >
          <Hash className="w-12 h-12 text-black" />
        </div>
        <h3 className="text-xl font-semibold text-gray-100 mb-3">
          No content yet
        </h3>
        <p className="text-gray-400 max-w-md mx-auto">
          Start creating content in the AI Chat tab to see your history here.
          Your generated posts will appear here for easy access and editing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-gray-200">
      {/* Header and Stats */}
      <div
        className="rounded-xl shadow-sm border p-4"
        style={{ background: "#FFFFFF" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: "linear-gradient(180deg, #EFFBEF 0%, #EFFBEF 100%)",
              }}
            >
              <svg
                width="24"
                height="22"
                viewBox="0 0 24 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M23 10.4444L20.7671 12.6667L18.533 10.4444M21.0402 12.1111C21.0808 11.7463 21.1015 11.3756 21.1015 11C21.1015 5.47716 16.6017 1 11.0508 1C5.49988 1 1 5.47716 1 11C1 16.5229 5.49988 21 11.0508 21C14.2082 21 17.0254 19.5514 18.868 17.2859M11.0508 5.44444V11L14.401 13.2222"
                  stroke="#34C334"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <div>
              <h5 className="text-md font-bold text-black">Content History</h5>
              <p className="text-sm text-[#515151] text-xs">
                Manage and track all your generated content
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: "#D9F0F4" }}
          >
            <svg
              width="22"
              height="21"
              viewBox="0 0 22 21"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21 6.11564V10.1156M9.25 3.61563H5.8C4.11984 3.61563 3.27976 3.61563 2.63803 3.94261C2.07354 4.23023 1.6146 4.68917 1.32698 5.25366C1 5.8954 1 6.73548 1 8.41562V9.61562C1 10.5475 1 11.0134 1.15224 11.381C1.35523 11.871 1.74458 12.2604 2.23463 12.4634C2.60218 12.6156 3.06812 12.6156 4 12.6156V16.8656C4 17.0978 4 17.2139 4.00963 17.3116C4.10316 18.2612 4.85441 19.0125 5.80397 19.106C5.90175 19.1156 6.01783 19.1156 6.25 19.1156C6.48217 19.1156 6.59826 19.1156 6.69604 19.106C7.64559 19.0125 8.39685 18.2612 8.49037 17.3116C8.5 17.2139 8.5 17.0978 8.5 16.8656V12.6156H9.25C11.0164 12.6156 13.1772 13.5625 14.8443 14.4713C15.8168 15.0014 16.3031 15.2665 16.6216 15.2275C16.9169 15.1913 17.1402 15.0587 17.3133 14.8167C17.5 14.5558 17.5 14.0336 17.5 12.9893V3.24192C17.5 2.19763 17.5 1.67548 17.3133 1.41452C17.1402 1.17253 16.9169 1.03993 16.6216 1.00376C16.3031 0.964754 15.8168 1.22983 14.8443 1.75999C13.1772 2.66874 11.0164 3.61563 9.25 3.61563Z"
                stroke="#005361"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>

            <div className="flex items-center gap-2">
              <span
                style={{
                  color: "#005361",
                  fontFamily:
                    "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
                  fontWeight: 500,
                  fontSize: "16px",
                  lineHeight: "21px",
                  letterSpacing: "0",
                }}
              >
                Total Posts
              </span>
              <svg
                width="1"
                height="34"
                viewBox="0 0 1 34"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <line
                  x1="0.75"
                  y1="34"
                  x2="0.749999"
                  y2="1.09279e-08"
                  stroke="#005361"
                  stroke-width="0.5"
                />
              </svg>
              <span className="text-lg font-bold" style={{ color: "#005361" }}>
                {contentList.length}
              </span>
            </div>
          </div>
        </div>

        {/* Filters */}
      </div>
      <div className="flex flex-wrap gap-3">
        <select
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="px-3 py-1.5 rounded-md text-sm focus:outline-none bg-[#FFFFFF] border border-[#1D2027] focus:ring-2"
          style={{ focusRing: "#79DB79", color: "#515151" }}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="this_week">This Week</option>
          <option value="last_week">Last Week</option>
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
        </select>

        <select
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
          className="px-3 py-1.5 rounded-md text-sm focus:outline-none bg-[#EDEDED] border border-[#1D2027] text-gray-200 focus:ring-2"
          style={{ focusRing: "#79DB79", color: "#515151" }}
        >
          <option value="all">All Platforms</option>
          <option value="linkedin">LinkedIn</option>
          <option value="twitter">Twitter</option>
          <option value="instagram">Instagram</option>
          <option value="facebook">Facebook</option>
        </select>
      </div>
      {/* Content Grid */}
      <div className="grid gap-4">
        {filteredContent.map((content) => (
          <div
            key={content.id}
            className="rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-all duration-200"
            style={{ background: "#FFFFFF", borderColor: "#FFFFFF" }}
          >
            {/* Content Header */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3 flex-nowrap">
                  <div
                    className={`w-8 h-8 bg-gradient-to-r ${getPlatformColor(
                      content.platform
                    )} rounded-2xl flex items-center justify-center text-white`}
                  >
                    {getPlatformIcon(content.platform)}
                  </div>
                  <div className="flex flex-col items-center space-x-3 flex-nowrap gap-1">
                    <div className="flex gap-4 items-center">
                      <span className="text-sm font-semibold text-blue-500 capitalize whitespace-nowrap">
                        {content.platform}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap uppercase`}
                        style={{
                          background: "#EFFFEB",
                          color: "#29AA6A",
                          border: "1px solid #29AA6A",
                        }}
                      >
                        {content.domain}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-black whitespace-nowrap">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDate(content.created_at)}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEdit(content)}
                    className="p-1.5 text-black gap-2.5 items-center hover:text-[#79DB79] hover:bg-[#121318] rounded-md transition-colors border border-transparent hover:border-[#1D2027] flex"
                    title="Edit content"
                  >
                    <Edit3 className="w-4 h-4" />
                    <h3>Edit</h3>
                  </button>
                  <button
                    onClick={() => handleDelete(content.id)}
                    className="p-1.5 flex gap-2.5 text-red-500 items-center hover:text-red-400 hover:bg-red-900/20 rounded-md transition-colors border border-transparent hover:border-red-900/30"
                    title="Delete content"
                  >
                    <Trash2 className="w-4 h-4" />
                    <h3>Trash</h3>
                  </button>
                </div>
              </div>

              {/* Prompt */}
              <div
                className="rounded-md p-2"
                style={{ background: "#EFFBEF", borderColor: "#1D2027" }}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-3 h-3 flex items-center justify-center">
                    <img src="/simbli.png" alt="Simbli" className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-medium text-black">Prompt</span>
                </div>
                <p className="text-xs text-[#1F1F1F] italic">
                  "{content.prompt}"
                </p>
              </div>
            </div>
            {/* Content Body */}
            <div className="p-4 ">
              {editingId === content.id ? (
                <div className="space-y-4">
                  <div
                    style={{
                      background: "#F5F5F5",
                      color: "#79DB79",
                      borderColor: "#175817",
                    }}
                  >
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Content Text
                    </label>
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 resize-none text-sm text-gray-200 focus:ring-[#79DB79]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Hashtags
                    </label>
                    <div className="flex flex-wrap gap-1 mb-2  bg-[#75BBF4]">
                      {editedHashtags.map((hashtag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center text-xs px-2 py-1 rounded-full border"
                        >
                          {hashtag}
                          <button
                            onClick={() => removeHashtag(hashtag)}
                            className="ml-1 w-3 h-3 rounded-full flex items-center justify-center"
                            style={{ color: "#EBF3FF" }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Add new hashtag and press Enter"
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && e.target.value.trim()) {
                          addHashtag(e.target.value.trim());
                          e.target.value = "";
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 text-sm bg-[] border border-[#1D2027] text-gray-200 focus:ring-[#79DB79]"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSaveEdit(content.id)}
                      className="px-3 py-1.5 text-sm rounded-lg transition-all duration-200 text-black border border-[#175817] hover:shadow-md"
                      style={{
                        background:
                          "linear-gradient(180deg, #7EDD7E 0%, #57C957 100%)",
                      }}
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 bg-[#121318] text-gray-300 rounded-lg hover:bg-[#1D2027] transition-colors text-sm border border-[#1D2027]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Text and Image Side-by-Side */}
                  <div className="flex flex-wrap items-start gap-4">
                    <div
                      className="rounded-lg p-4 border max-w-2xl flex-1"
                      style={{ background: "#121318", borderColor: "#1D2027" }}
                    >
                      <div className="text-gray-200 text-base leading-relaxed">
                        <MarkdownRenderer
                          enableInline={false}
                          content={cleanContentText(content.content_text)}
                        />
                      </div>
                    </div>

                    {content.image_url && (
                      <div
                        className="rounded-lg p-3 border max-w-sm"
                        style={{
                          background: "#121318",
                          borderColor: "#1D2027",
                        }}
                      >
                        <img
                          src={buildImageUrl(content.image_url)}
                          alt="Content image"
                          className="w-full rounded-lg border"
                          style={{
                            borderColor: "#1D2027",
                            maxHeight: "300px",
                            objectFit: "contain",
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Hashtags below */}
                  {(content.hashtags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(content.hashtags || []).map((hashtag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 text-xs rounded-full border"
                          style={{
                            background: "rgba(23,88,23,0.3)",
                            color: "#79DB79",
                            borderColor: "#175817",
                          }}
                        >
                          <Hash className="w-3 h-3 mr-1" />
                          {hashtag.replace("#", "")}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredContent.length === 0 && contentList.length > 0 && (
        <div
          className="text-center py-12 rounded-2xl shadow-lg border"
          style={{ background: "#1D2027", borderColor: "#1D2027" }}
        >
          <Filter className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-100 mb-2">
            No content matches your filters
          </h3>
          <p className="text-gray-400">
            Try adjusting your date or platform filters
          </p>
        </div>
      )}
    </div>
  );
};

export default ContentHistory;
