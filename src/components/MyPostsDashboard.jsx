import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./MyPostsDashboard.css";
import icon1 from "../assets/published.png";

import icon2 from "../assets/schedules.png";
import icon3 from "../assets/toatlpost.png";
import icon4 from "../assets/uparroow.png";
import icon5 from "../assets/downarrow.png";
import icon6 from "../assets/dashrbot.png";
import icon7 from "../assets/tickgreen.png";
import icon8 from "../assets/tickpionk.png";
import icon9 from "../assets/dashlink.png";
import icon10 from "../assets/side-3.png";

import Ink2 from "../assets/lnk2.png";
import Ink3 from "../assets/lnk3.png";
import Ink4 from "../assets/lnk4.png";

import Swal from "sweetalert2";
import {
  getWeekRange,
  transformDraftsByWeek,
  transformPostsByWeek,
  transformScheduledPostsByWeek,
} from "../helpers/helper";
import { BASE_URL, getDraftsApi, getPostsApi, getSchedulePostsApi } from "../api/api";
import EditContentModal from "./EditContentModal";
import { useChatHistory } from "../contexts/ChatHistoryContext";

const MyPostsDashboard = () => {
  // Use ChatHistoryContext instead of direct localStorage access
  const { messages, setMessages, publishSuccessMap, setPublishSuccessMap } =
    useChatHistory();

  // const [currentView, setCurrentView] = useState('Week');
  const scrollContainerRef = useRef(null);
  const [weekDate, setWeekDate] = useState("");
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [filteredDrafts, setFilteredDrafts] = useState([]);
  const [filteredScheduledPosts, setFilteredScheduledPosts] = useState([]);
  const [postData, setPostData] = useState([]);
  const [draftData, setDraftData] = useState([]);
  const [scheduleData, setScheduleData] = useState([]);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);
  const [publishedCount, setPublishedCount] = useState(0);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalEditingContent, setModalEditingContent] = useState(null);
  const nextWeek = () => setCurrentWeek((prev) => prev + 1);

  const prevWeek = () => setCurrentWeek((prev) => prev - 1);

  // ----------------API CALL FUNCTIONS Starts ---------------------
  const getPosts = async () => {
    try {
      const response = await getPostsApi();
      console.log("response", response);
      console.log("response.data", response.data);
      setPostData(response.data.posts);
      setPublishedCount(response?.data?.posts?.length);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          err?.response?.data?.message || err.message || "Something went wrong",
      });
      console.log("err", err);
    }
  };

  const DraftPosts = async () => {
    try {
      const response = await getDraftsApi();
      setDraftData(response?.data);
      console.log("draft response", { response, draftData });
      setDraftCount(response?.data?.length);
    } catch (err) {
      console.log(err);
    }
  };

  const ScheduledPosts = async () => {
    try {
      const response = await getSchedulePostsApi();
      console.log(
        "response?.data?.scheduled_posts",
        response?.data?.scheduled_posts
      );
      setScheduleData(response?.data?.scheduled_posts);
      setScheduledCount(response?.data?.scheduled_posts?.length);
    } catch (err) {
      console.log(err);
    }
  };

  //--------------API CALL FUNCTIONS ENDS --------------------------

  useEffect(() => {
    getPosts();
    ScheduledPosts();
    DraftPosts();
  }, []);
  console.log("scheduleData", scheduleData);
  useEffect(() => {
    const weekPosts = transformPostsByWeek(postData, currentWeek, setWeekDate);
    const weekDrafts = transformDraftsByWeek(
      draftData,
      currentWeek,
      setWeekDate
    );

    const weekScheduledPosts = transformScheduledPostsByWeek(
      scheduleData,
      currentWeek,
      setWeekDate
    );

    setFilteredPosts(weekPosts);
    setFilteredDrafts(weekDrafts.drafts);
    console.log("weekScheduledPosts", weekScheduledPosts);
    setFilteredScheduledPosts(weekScheduledPosts.data);
  }, [scheduleData, draftData, postData, currentWeek]);

  console.log("filteredPosts", filteredPosts);
  console.log("filteredDrafts", filteredDrafts);
  console.log("filteredScheduledPosts", filteredScheduledPosts);
  console.log("");
  const handleOpenEditModal = (content) => {
    // Determine if this is a scheduled post
    const isScheduled = content.scheduled_post_id || content.scheduled_time;

    // Transform the content to match the expected structure for EditContentModal
    const transformedContent = {
      id: content.id || content.draft_id || content.scheduled_post_id,
      content_id: content.content_id,
      content_text: content.content_text || content.content || "",
      hashtags: content.hashtags || [],
      platform: content.platform || "linkedin",
      image_url: content.image_url || null,
      created_at: content.created_at || content.scheduled_time,
      scheduled_time: content.scheduled_time || null, // Add scheduled_time for scheduled posts
      isScheduled: isScheduled, // Add isScheduled flag for scheduled posts
      // Add any other properties that EditContentModal might need
      ...content,
    };

    // If this is a scheduled post, populate the publishSuccessMap to show it as scheduled
    if (isScheduled && content.scheduled_time) {
      const contentId =
        content.id || content.draft_id || content.scheduled_post_id;
      const platform = content.platform || "linkedin";

      setPublishSuccessMap((prev) => ({
        ...prev,
        [contentId]: {
          ...prev[contentId],
          [platform]: {
            success: true,
            message: "Content scheduled successfully!",
            postUrl: null,
            platform: platform,
            contentId: contentId,
            isScheduled: true,
            scheduledTime: content.scheduled_time,
            testMode: false,
            schedulerError: null,
            scheduledPostId: content.scheduled_post_id || contentId,
          },
        },
      }));
    }

    setModalEditingContent(transformedContent);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setModalEditingContent(null);
  };

  const handleContentUpdate = async (updatedContent) => {
    // Handle deletion case
    if (updatedContent === null) {
      // Refresh all data to show updated content immediately
      await Promise.all([getPosts(), ScheduledPosts(), DraftPosts()]);

      // Close the modal after successful deletion
      setShowEditModal(false);
      setModalEditingContent(null);
      return;
    }

    // Update the message in the messages array from context
    setMessages((prev) =>
      prev.map((msg) =>
        msg.type === "ai" && msg.content.id === updatedContent.id
          ? { ...msg, content: updatedContent }
          : msg
      )
    );

    // Refresh all data to show updated content immediately
    await Promise.all([getPosts(), ScheduledPosts(), DraftPosts()]);

    // Close the modal after successful update
    setShowEditModal(false);
    setModalEditingContent(null);
  };

  return (
    <div className="dashboard-page">
      {/* Navigation */}

      <div className="dashboard-container">
        {/* Header Section */}
        <div className="dashboard-header">
          <div className="header-content">
            <h1 className="dashboard-title mb-0">My Posts</h1>
            <p className="dashboard-subtitle">
            Your Complete Content Hub. Track, Manage, and Optimize Every Post You Create.
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card published">
            <div className="card-icon">
              <img src={icon1} alt="icon"></img>
            </div>
            <div className="card-content">
              <div className="card-label">Published</div>
              <div className="card-number">{publishedCount}</div>
            </div>
          </div>
          <div className="summary-card drafts">
            <div className="card-icon">
              <img src={icon10} alt="icon"></img>
            </div>
            <div className="card-content">
              <div className="card-label">Drafts</div>
              <div className="card-number">{draftCount}</div>
            </div>
          </div>
          <div className="summary-card scheduled">
            <div className="card-icon">
              <img src={icon2} alt="icon"></img>
            </div>
            <div className="card-content">
              <div className="card-label">Scheduled</div>
              <div className="card-number">{scheduledCount}</div>
            </div>
          </div>
          <div className="summary-card total">
            <div className="card-icon">
              <img src={icon3} alt="icon"></img>
            </div>
            <div className="card-content">
              <div className="card-label">Total Posts</div>
              <div className="card-number">
                {publishedCount + scheduledCount + draftCount}
              </div>
            </div>
          </div>
        </div>

        <div className="overall-dates">
          <div className="date-navigation pt-3">
            <div className="date-selector">
              <button className="arrow-btn" onClick={prevWeek}>
                <img src={icon4} alt="icon" className="icons-arr"></img>
              </button>
              <span className="date-range">{weekDate}</span>
              <button className="arrow-btn" onClick={nextWeek}>
                <img src={icon5} alt="icon" className="icons-arr"></img>
              </button>
            </div>
          </div>

          <div className="calendar-container" ref={scrollContainerRef}>
            <div className="calendar-grid">
              <div className="calendar-content">
                {filteredDrafts?.length > 0 && (
                  <div className="calendar-row drafts-row">
                    <div className="date-column drafts-column">
                      <div className="drafts-label">
                        {filteredDrafts?.length > 0
                          ? filteredDrafts?.length
                          : 0}{" "}
                        Drafts
                      </div>
                    </div>
                    <div className="posts-container">
                      <div className="posts-scroll">
                        {filteredDrafts?.map((data, index) => (
                          <>
                            <div
                              onClick={() => handleOpenEditModal(data)}
                              key={index}
                              className="post-card cursor-pointer published"
                            >
                              <div className="post-header">
                                <div className="dashboard-platform-icon linkedin in1">
                                  {}
                                  {data?.platform === "linkedin" ? (
                                    <>
                                      <img
                                        src={icon9}
                                        alt="Published"
                                        className="status-icon"
                                      />
                                    </>
                                  ) : (
                                    <>
                                      <img
                                        src={Ink2}
                                        alt="Published"
                                        className="status-icon"
                                      />
                                    </>
                                  )}
                                </div>
                                <div className="post-status">
                                  <span className="status-label published-status">
                                    <img
                                      src={icon7}
                                      alt="Published"
                                      className="status-icon"
                                    />
                                    Saved as Draft
                                  </span>
                                </div>
                                <p className="post-text mb-0 pb-0  ">
                                  {data?.content_text?.length > 100
                                    ? data.content_text.substring(0, 50) + "..."
                                    : data?.content_text}
                                </p>
                                <span className="dashboard-draft-time">
                                  {new Date(
                                    data?.created_at + "Z"
                                  ).toLocaleTimeString([], {
                                    month: "short", // "Sept"
                                    day: "2-digit", // "16"
                                    year: "numeric", // "2025"
                                    hour: "2-digit", // "05"
                                    minute: "2-digit", // "20"
                                    hour12: true, // "pm"
                                  })}
                                </span>
                              </div>
                              <div className="post-content">
                                <div className="post-meta">
                                  <div className="post-image">
                                    {(() => {
                                      // Helper function to determine if media is video based on file extension
                                      const isVideoFile = (url) => {
                                        if (!url) return false;
                                        const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.m4v'];
                                        const lowerUrl = url.toLowerCase();
                                        return videoExtensions.some(ext => lowerUrl.includes(ext));
                                      };

                                      const mediaUrl = data?.image_url 
                                        ? (data.image_url.startsWith("http") 
                                            ? data.image_url 
                                            : `${BASE_URL}` + data.image_url)
                                        : icon6;

                                      const isVideo = isVideoFile(data?.image_url);
                                      console.log("isVideo", isVideo);
                                      console.log("mediaUrl", mediaUrl);
                                      return isVideo ? (
                                        <video
                                          src={mediaUrl}
                                          controls
                                          className="robot-asset-img"
                                          style={{ width: "100%", height: "auto" }}
                                        >
                                          Your browser does not support the video tag.
                                        </video>
                                      ) : (
                                        <img
                                          src={mediaUrl}
                                          alt="Robot"
                                          className="robot-asset-img"
                                          // onError={(e) => {
                                          //   e.target.onerror = null; // prevent infinite loop
                                          //   e.target.src = icon6; // fallback image
                                          // }}
                                        />
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {filteredScheduledPosts?.length > 0 && (
                  <div className="calendar-row drafts-row">
                    <div className="date-column drafts-column">
                      <div className="drafts-label">
                        {filteredScheduledPosts?.length > 0
                          ? filteredScheduledPosts?.length
                          : 0}{" "}
                        Scheduled
                      </div>
                    </div>
                    <div className="posts-container">
                      <div className="posts-scroll">
                        {filteredScheduledPosts?.map((data, index) => (
                          <>
                            <div
                              onClick={() => handleOpenEditModal(data)}
                              key={index}
                              className="post-card cursor-pointer scheduled"
                            >
                              <div className="post-header">
                                <div className="dashboard-platform-icon linkedin in1">
                                  {}
                                  {data?.platform === "linkedin" ? (
                                    <>
                                      <img
                                        src={icon9}
                                        alt="Published"
                                        className="status-icon"
                                      />
                                    </>
                                  ) : (
                                    <>
                                      <img
                                        src={Ink2}
                                        alt="Published"
                                        className="status-icon"
                                      />
                                    </>
                                  )}
                                </div>
                                <div className="post-status">
                                  <span
                                    className={`status-label ${
                                      data?.status === "published"
                                        ? "published-status"
                                        : "scheduled-status"
                                    }`}
                                  >
                                    <img
                                      src={
                                        data?.status === "published"
                                          ? icon9
                                          : icon2
                                      }
                                      alt={
                                        data?.status === "published"
                                          ? "Published"
                                          : "Scheduled"
                                      }
                                      className="status-icon"
                                    />
                                    {data?.status === "published"
                                      ? "Published"
                                      : "Scheduled"}
                                  </span>
                                </div>
                                {/* <span className="dashboard-draft-time">
                                  {new Date(
                                    data?.scheduled_time
                                  ).toLocaleTimeString([], {
                                    month: "short", // "Sept"
                                    day: "2-digit", // "16"
                                    year: "numeric", // "2025"
                                    hour: "2-digit", // "05"
                                    minute: "2-digit", // "20"
                                    hour12: true, // "pm"
                                  })}
                                </span> */}
                                <p className="post-text mb-0 pb-0  ">
                                  {data?.content_text?.length > 100
                                    ? data.content_text.substring(0, 50) + "..."
                                    : data?.content_text}
                                </p>

                                <span className="dashboard-draft-time">
                                  {new Date(
                                    data?.scheduled_time
                                  ).toLocaleTimeString([], {
                                    month: "short", // "Sept"
                                    day: "2-digit", // "16"
                                    year: "numeric", // "2025"
                                    hour: "2-digit", // "05"
                                    minute: "2-digit", // "20"
                                    hour12: true, // "pm"
                                  })}
                                </span>
                              </div>
                              <div className="post-content">
                                <div className="post-meta">
                                  <div className="post-image">
                                    {(() => {
                                      // Helper function to determine if media is video based on file extension
                                      const isVideoFile = (url) => {
                                        if (!url) return false;
                                        const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.m4v'];
                                        const lowerUrl = url.toLowerCase();
                                        return videoExtensions.some(ext => lowerUrl.includes(ext));
                                      };

                                      const mediaUrl = data?.image_url 
                                        ? (data.image_url.startsWith("http") 
                                            ? data.image_url 
                                            : `${BASE_URL}` + data.image_url)
                                        : icon6;

                                      const isVideo = isVideoFile(data?.image_url);

                                      return isVideo ? (
                                        <video
                                          src={mediaUrl}
                                          controls
                                          className="robot-asset-img"
                                          style={{ width: "100%", height: "auto" }}
                                        >
                                          Your browser does not support the video tag.
                                        </video>
                                      ) : (
                                        <img
                                          src={mediaUrl}
                                          alt="Robot"
                                          className="robot-asset-img"
                                          onError={(e) => {
                                            e.target.onerror = null; // prevent infinite loop
                                            e.target.src = icon6; // fallback image
                                          }}
                                        />
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <>
                  {filteredPosts && (
                    <>
                      {filteredPosts.map((data, index) => (
                        <>
                          <div key={index} className="calendar-row">
                            <div className="date-column">
                              <div className="date-number">
                                {new Date(data?.date).getDate()}
                              </div>
                              <div className="day-name">{data?.day}</div>
                            </div>

                            <div className="posts-container">
                              <div className="posts-scroll">
                                {data?.posts &&
                                  data?.posts.map((data, index) => (
                                    <>
                                      <div
                                        key={index}
                                        onClick={() =>
                                          window.open(data?.post_url, "_blank")
                                        }
                                        className="post-card cursor-pointer published"
                                      >
                                        <div className="post-header">
                                          <div className="dashboard-platform-icon linkedin in1">
                                            {}
                                            {data?.platform === "linkedin" ? (
                                              <>
                                                <img
                                                  src={icon9}
                                                  alt="Published"
                                                  className="status-icon"
                                                />
                                              </>
                                            ) : (
                                              <>
                                                <img
                                                  src={Ink2}
                                                  alt="Published"
                                                  className="status-icon"
                                                />
                                              </>
                                            )}
                                          </div>
                                          <div className="post-status">
                                            <span className="status-label published-status">
                                              <img
                                                src={icon7}
                                                alt="Published"
                                                className="status-icon"
                                              />
                                              Published
                                            </span>
                                          </div>
                                          <p className="post-text mb-0 pb-0  ">
                                            {data?.content_text?.length > 100
                                              ? data.content_text.substring(
                                                  0,
                                                  50
                                                ) + "..."
                                              : data?.content_text}
                                          </p>
                                          <span className="dashboard-post-time">
                                            {new Date(
                                              data?.published_at + "Z"
                                            ).toLocaleTimeString("en-IN", {
                                              timeZone: "Asia/Kolkata",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                              hour12: true,
                                            })}
                                          </span>
                                        </div>
                                        <div className="post-content">
                                          <div className="post-meta">
                                            <div className="post-image">
                                              {(() => {
                                                // Helper function to determine if media is video based on file extension
                                                const isVideoFile = (url) => {
                                                  if (!url) return false;
                                                  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.m4v'];
                                                  const lowerUrl = url.toLowerCase();
                                                  return videoExtensions.some(ext => lowerUrl.includes(ext));
                                                };

                                                const mediaUrl = data?.image_url || icon6;
                                                const isVideo = isVideoFile(data?.image_url);

                                                return isVideo ? (
                                                  <video
                                                    src={mediaUrl}
                                                    controls
                                                    className="robot-asset-img"
                                                    style={{ width: "100%", height: "auto" }}
                                                  >
                                                    Your browser does not support the video tag.
                                                  </video>
                                                ) : (
                                                  <img
                                                    src={mediaUrl}
                                                    alt="Robot"
                                                    className="robot-asset-img"
                                                    onError={(e) => {
                                                      e.target.onerror = null; // prevent infinite loop
                                                      e.target.src = icon6; // fallback image
                                                    }}
                                                  />
                                                );
                                              })()}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </>
                                  ))}
                              </div>
                            </div>
                          </div>
                        </>
                      ))}
                    </>
                  )}
                </>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditContentModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        content={modalEditingContent}
        onContentUpdate={handleContentUpdate}
        publishSuccessMap={publishSuccessMap}
        setPublishSuccessMap={setPublishSuccessMap}
      />
    </div>
  );
};

export default MyPostsDashboard;

// const scrollUp = () => {
//   if (scrollContainerRef.current) {
//     console.log('Scrolling up...');
//     scrollContainerRef.current.scrollBy({
//       top: -200,
//       behavior: 'smooth'
//     });
//   } else {
//     console.log('Scroll container ref not found');
//   }
// };

// const scrollDown = () => {
//   if (scrollContainerRef.current) {
//     console.log('Scrolling down...');
//     scrollContainerRef.current.scrollBy({
//       top: 200,
//       behavior: 'smooth'
//     });
//   } else {
//     console.log('Scroll container ref not found');
//   }
// };

{
  /* <div className="view-options">
              <button
                className={`view-btn ${currentView === 'Day' ? 'active' : ''}`}
                onClick={() => setCurrentView('Day')}
                title="View posts by day"
              >
                Day
              </button>
              <button
                className={`view-btn ${currentView === 'Week' ? 'active' : ''}`}
                onClick={() => setCurrentView('Week')}
                title="View posts by week"
              >
                Week
              </button>
              <button
                className={`view-btn ${currentView === 'Month' ? 'active' : ''}`}
                onClick={() => setCurrentView('Month')}
                title="View posts by month"
              >
                Month
              </button>

            </div> */
}

{
  /* {currentView === 'Day' && (
                  <div className="empty-content">
                    <div className="empty-message">
                      <div className="empty-icon">📅</div>
                      <h3>Day View</h3>
                      <p>Select a specific day to view detailed posts and analytics</p>
                    </div>
                  </div>
                )} */
}

{
  /* {currentView === 'Week' && (
                
                )} */
}
