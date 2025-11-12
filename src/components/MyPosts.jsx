import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Zap,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
} from "lucide-react";
import axios from "axios";
import { BASE_URL } from "../api/api";

const MyPosts = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDatePosts, setSelectedDatePosts] = useState([]);

  // Platform helpers
  const normalizePlatform = (p) =>
    typeof p === "string"
      ? p.toLowerCase()
      : (p?.value || p || "").toString().toLowerCase();
  const PlatformIcon = ({ platform }) => {
    const p = normalizePlatform(platform);
    if (p === "linkedin") {
      return (
        <div
          className="w-4 h-4 bg-blue-700 rounded flex items-center justify-center"
          title="LinkedIn"
        >
          <svg
            className="w-2.5 h-2.5 text-white"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </div>
      );
    }
    if (p === "twitter" || p === "x") {
      return (
        <div
          className="w-4 h-4 bg-gray-900 rounded flex items-center justify-center"
          title="X"
        >
          <svg
            className="w-2.5 h-2.5 text-white"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
      );
    }
    if (p === "facebook") {
      return (
        <div
          className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center"
          title="Facebook"
        >
          <svg
            className="w-2.5 h-2.5 text-white"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </div>
      );
    }
    if (p === "instagram") {
      return (
        <div
          className="w-4 h-4 bg-pink-600 rounded flex items-center justify-center"
          title="Instagram"
        >
          <svg
            className="w-2.5 h-2.5 text-white"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        </div>
      );
    }
    return null;
  };

  // Fetch posts data
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    console.log("Fetching posts...");

    try {
      setLoading(true);
      // Fetch both published and scheduled posts
      const [publishedResponse, scheduledResponse, draftsResponse] =
        await Promise.all([
          axios.get("/content/published-posts"),
          axios.get("/content/scheduled-posts"),
          axios.get("/content/drafts"),
        ]);

      const publishedPosts = publishedResponse.data.posts || [];
      const scheduledPosts = scheduledResponse.data.scheduled_posts || [];
      const draftPosts = draftsResponse.data.drafts || [];
      console.log("Draft Posts:", draftPosts);

      // Combine and format posts
      // Helper: normalize API datetime strings to ensure UTC parsing
      const normalizeApiDate = (value) => {
        if (!value) return null;
        const s = typeof value === "string" ? value : value?.toString?.() || "";
        // If string lacks timezone info, assume UTC and append 'Z'
        const hasTZ = /Z|[+-]\d{2}:?\d{2}$/.test(s);
        return new Date(hasTZ ? s : `${s}Z`);
      };

      const allPosts = [
        ...publishedPosts.map((post) => ({
          ...post,
          type: "published",
          date: normalizeApiDate(post.published_at || post.created_at),
          status: "published",
        })),
        ...scheduledPosts.map((post) => ({
          ...post,
          type: "scheduled",
          date: normalizeApiDate(post.scheduled_time),
          status: post.status,
        })),
      ];

      setPosts(allPosts);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calendar navigation
  const navigateMonth = (direction) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  // Get posts for a specific date
  const getPostsForDate = (date) => {
    return posts.filter((post) => {
      const postDate = new Date(post.date);
      return postDate.toDateString() === date.toDateString();
    });
  };

  // Handle date selection
  const handleDateClick = (date) => {
    const datePosts = getPostsForDate(date);
    setSelectedDate(date);
    setSelectedDatePosts(datePosts);
  };

  // Generate calendar days (only current month, with minimal placeholders for alignment)
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startWeekday = firstDay.getDay(); // 0 (Sun) - 6 (Sat)
    const endWeekday = lastDay.getDay();

    const days = [];

    // Leading placeholders to align first day under correct weekday
    for (let i = 0; i < startWeekday; i++) {
      days.push({ isPlaceholder: true });
    }

    // Actual days of current month
    const cursor = new Date(firstDay);
    while (cursor <= lastDay) {
      const dayPosts = getPostsForDate(cursor);
      const isToday = cursor.toDateString() === new Date().toDateString();
      const isSelected =
        selectedDate && cursor.toDateString() === selectedDate.toDateString();

      days.push({
        date: new Date(cursor),
        posts: dayPosts,
        isCurrentMonth: true,
        isToday,
        isSelected,
        isPlaceholder: false,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    // Trailing placeholders to complete the last week (but do not force 6 rows)
    const trailing = 6 - endWeekday;
    for (let i = 0; i < trailing; i++) {
      days.push({ isPlaceholder: true });
    }

    return days;
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Posts to display below calendar: all when no date selected, else filtered
  const displayPosts = selectedDate ? selectedDatePosts : posts;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: "#79DB79", borderBottomColor: "transparent" }}
          ></div>
          <span className="text-gray-400">Loading your posts...</span>
        </div>
      </div>
    );
  }

  // Show empty state if no posts
  if (posts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-6 text-gray-200">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(180deg, #7EDD7E 0%, #57C957 100%)",
              }}
            >
              <Calendar className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-100">My Posts</h1>
              <p className="text-gray-400">
                Track your published and scheduled content
              </p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div
          className="backdrop-blur-sm rounded-2xl shadow-sm p-12 text-center border"
          style={{ background: "#1D2027", borderColor: "#1D2027" }}
        >
          <div
            className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(180deg, #7EDD7E 0%, #57C957 100%)",
            }}
          >
            <Calendar className="w-12 h-12 text-black" />
          </div>
          <h3 className="text-xl font-semibold text-gray-100 mb-3">
            No Posts Yet
          </h3>
          <p className="text-gray-300 mb-6 max-w-md mx-auto">
            Start creating and publishing content to see your posts calendar.
            Your published and scheduled posts will appear here.
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: "#79DB79" }}
              ></div>
              <span>Published Posts</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Scheduled Posts</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-5 md:p-6 text-gray-200">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div
            className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(180deg, #7EDD7E 0%, #57C957 100%)",
            }}
          >
            <Calendar className="w-5 h-5 md:w-6 md:h-6 text-black" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-100">
              My Posts
            </h1>
            <p className="text-gray-400">
             Your Complete Content Hub. Track, Manage, and Optimize Every Post You Create.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div
            className="backdrop-blur-sm rounded-xl p-3 shadow-sm border"
            style={{ background: "#1D2027", borderColor: "#1D2027" }}
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: "#1D2027" }}
              >
                <CheckCircle className="w-5 h-5" style={{ color: "#79DB79" }} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Published</p>
                <p className="text-xl md:text-2xl font-bold text-gray-100">
                  {posts.filter((p) => p.type === "published").length}
                </p>
              </div>
            </div>
          </div>

          <div
            className="backdrop-blur-sm rounded-xl p-3 border shadow-sm"
            style={{ background: "#1D2027", borderColor: "#1D2027" }}
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: "#1D2027" }}
              >
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Scheduled</p>
                <p className="text-xl md:text-2xl font-bold text-gray-100">
                  {
                    posts.filter(
                      (p) => p.type === "scheduled" && p.status === "pending"
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          <div
            className="backdrop-blur-sm rounded-xl p-3 border shadow-sm"
            style={{ background: "#1D2027", borderColor: "#1D2027" }}
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: "#1D2027" }}
              >
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Posts</p>
                <p className="text-xl md:text-2xl font-bold text-gray-100">
                  {posts.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Calendar - compact on the left */}
        <div className="lg:col-span-2">
          <div
            className="backdrop-blur-sm rounded-2xl shadow-sm overflow-hidden border"
            style={{ background: "#1D2027", borderColor: "#1D2027" }}
          >
            {/* Calendar Header */}
            <div
              className="px-3 md:px-4 py-2.5 md:py-3 text-black"
              style={{
                background: "linear-gradient(180deg, #7EDD7E 0%, #57C957 100%)",
              }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg md:text-xl font-bold">
                  {monthNames[currentDate.getMonth()]}{" "}
                  {currentDate.getFullYear()}
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="p-1.5 hover:bg-black/10 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-2.5 py-1 text-sm bg-black/10 hover:bg-black/20 rounded-lg transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => navigateMonth(1)}
                    className="p-1.5 hover:bg-black/10 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="px-3 md:px-4 py-2.5 md:py-3">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-3">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs md:text-sm font-semibold text-gray-400 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {generateCalendarDays().map((day, index) =>
                  day.isPlaceholder ? (
                    <div
                      key={index}
                      className="p-1.5 h-12 md:h-16 rounded-lg border border-transparent"
                    />
                  ) : (
                    <button
                      key={index}
                      onClick={() => handleDateClick(day.date)}
                      className={`relative p-1.5 h-12 md:h-16 rounded-lg transition-all duration-200 text-left border ${
                        day.isSelected
                          ? "border-[#79DB79] bg-[#121318]"
                          : day.isToday
                          ? "bg-[#121318] border-[#175817]"
                          : "hover:bg-[#121318] border-[#1D2027]"
                      }`}
                    >
                      <div
                        className={`text-[10px] md:text-xs font-medium text-gray-100`}
                      >
                        {day.date.getDate()}
                      </div>

                      {/* Post Indicators */}
                      {day.posts.length > 0 && (
                        <div className="absolute bottom-1 left-1 right-1">
                          <div className="flex flex-wrap gap-0.5">
                            {day.posts.slice(0, 3).map((post, postIndex) => (
                              <div
                                key={postIndex}
                                className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${
                                  post.type === "published" ||
                                  post.status === "published"
                                    ? "bg-[#79DB79]"
                                    : post.status === "pending"
                                    ? "bg-blue-500"
                                    : "bg-gray-400"
                                }`}
                                title={`${
                                  post.type === "published" ||
                                  post.status === "published"
                                    ? "Published"
                                    : "Scheduled"
                                }: ${post.content_text?.substring(0, 50)}...`}
                              />
                            ))}
                            {day.posts.length > 3 && (
                              <div
                                className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gray-300"
                                title={`+${day.posts.length - 3} more`}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Posts - two columns on the right */}
        <div className="lg:col-span-3">
          <div
            className="backdrop-blur-sm rounded-2xl shadow-sm p-4 border"
            style={{ background: "#1D2027", borderColor: "#1D2027" }}
          >
            <h3 className="text-base md:text-lg font-bold text-gray-100 mb-3">
              {selectedDate
                ? selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "All Posts"}
            </h3>

            {displayPosts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                <p>
                  {selectedDate
                    ? "No posts on this date"
                    : "No posts available"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-3">
                {displayPosts.map((post, index) => (
                  <div
                    key={index}
                    className="rounded-xl p-3 border"
                    style={{ background: "#121318", borderColor: "#1D2027" }}
                  >
                    {/* Post Header */}
                    <div className="flex items-center justify-between mb-2.5 md:mb-3">
                      <div className="flex items-center space-x-2">
                        {post.type === "published" ? (
                          <CheckCircle
                            className="w-4 h-4 md:w-4 md:h-4"
                            style={{ color: "#79DB79" }}
                          />
                        ) : (
                          <Clock className="w-4 h-4 md:w-4 md:h-4 text-blue-600" />
                        )}
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            post.type === "published"
                              ? "text-[#79DB79]"
                              : "text-blue-400"
                          }`}
                        >
                          {post.type === "published"
                            ? "Published"
                            : "Scheduled"}
                        </span>
                        {/* Platform Logo */}
                        {post.platform && (
                          <div className="ml-1">
                            <PlatformIcon platform={post.platform} />
                          </div>
                        )}
                        {post.post_type && (
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              post.post_type === "direct"
                                ? "text-purple-300"
                                : "text-orange-300"
                            }`}
                          >
                            {post.post_type === "direct"
                              ? "Direct"
                              : "Scheduled"}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">
                        {(() => {
                          const postDate = new Date(post.date);
                          // If API datetime already includes a timezone, it's converted to local by Date().
                          // Only add +5:30 if scheduled_time had no timezone in API.
                          const scheduledRaw = post.scheduled_time;
                          const hasTZ =
                            typeof scheduledRaw === "string" &&
                            /Z|[+-]\d{2}:?\d{2}$/.test(scheduledRaw);
                          const needsIstOffset =
                            post.type === "scheduled" && !hasTZ;
                          const displayDate = needsIstOffset
                            ? new Date(
                                postDate.getTime() + 5.5 * 60 * 60 * 1000
                              )
                            : postDate;
                          return displayDate.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          });
                        })()}
                      </span>
                    </div>

                    {/* Post Content Preview */}
                    <div className="mb-2.5 md:mb-3">
                      <p
                        className="text-sm md:text-sm text-gray-300 overflow-hidden"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                        }}
                      >
                        {post.content_text?.substring(0, 100)}...
                      </p>
                    </div>

                    {/* Post Image Preview */}
                    {post.image_url && (
                      <div className="mb-2.5 md:mb-3">
                        <div className="relative w-full h-20 md:h-20 bg-[#121318] rounded-lg overflow-hidden border border-[#1D2027]">
                          <img
                            src={
                              post.image_url.startsWith("http")
                                ? post.image_url
                                : `${BASE_URL}${post.image_url}`
                            }
                            alt="Post preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                          <div
                            className="absolute inset-0 flex items-center justify-center"
                            style={{ display: "none", background: "#121318" }}
                          >
                            <ImageIcon className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Hashtags */}
                    {post.hashtags && post.hashtags.length > 0 && (
                      <div className="mb-2.5 md:mb-3">
                        <div className="flex flex-wrap gap-1">
                          {post.hashtags
                            .slice(0, 3)
                            .map((hashtag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="text-xs px-2 py-1 rounded-full"
                                style={{
                                  background: "rgba(23,88,23,0.3)",
                                  color: "#79DB79",
                                }}
                              >
                                {hashtag}
                              </span>
                            ))}
                          {post.hashtags.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{post.hashtags.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Post URL */}
                    {post.post_url && (
                      <div className="flex items-center justify-between">
                        <a
                          href={post.post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View Post</span>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyPosts;
