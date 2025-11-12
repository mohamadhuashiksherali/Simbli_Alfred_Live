import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./MyPostsDashboard.css";
import "./ConnectAccountPopup.css";
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
import Ink3 from "../assets/instagram.png";
import Ink4 from "../assets/fb.png";
import Swal from "sweetalert2";
import moment from "moment";
import {
  getWeekRange,
  transformDraftsByWeek,
  transformPostsByWeek,
  transformScheduledPostsByWeek,
} from "../helpers/helper";
import { BASE_URL, getAllPostsApi, getDraftsApi, getPostsApi, getSchedulePostsApi } from "../api/api";
import EditContentModal from "./EditContentModal";
import { useChatHistory } from "../contexts/ChatHistoryContext";

const MyPostsDashboardNew = ({ onNavigateToSocial }) => {
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
  const [filteredAllPosts, setFilteredAllPosts] = useState([])
  
  // Drag to scroll state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  
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
      // Don't set draftCount here anymore - we'll calculate it in useEffect
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
// const [allPostsData,setAllPostsData] = useState([])
  useEffect(() => {
    getPosts();
    ScheduledPosts();
    DraftPosts();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // const getAllPosts = async () => {
  //   try {
  //     const response = await getAllPostsApi();
  //     console.log("All posts response", response);
  //     console.log("All posts data", response.data);
  //     // Separate posts by type
  //     const allPosts = response.data || [];
  //     // Set individual data arrays
  //     setAllPostsData(allPosts);
  //     // Set counts
  //     console.log("Separated data:", { allPosts });
  //   } catch (err) {
  //     Swal.fire({
  //       icon: "error",
  //       title: "Error",
  //       text:
  //         err?.response?.data?.message || err.message || "Something went wrong",
  //     });
  //     console.log("err", err);
  //   }
  // };

  // useEffect(()=>{
  //   getAllPosts()
  // },[])
  // console.log("allpostsData",allPostsData)


  // Function to filter out drafts that are either scheduled or already published
  const filterScheduledDrafts = (drafts, scheduledPosts, publishedPosts) => {
    // Get all possible identifiers from scheduled posts
    const scheduledIdentifiers = scheduledPosts
      .map((post) => {
        // Try multiple possible fields that might reference the draft
        return (
          post.draft_id ||
          post.draftId ||
          post.original_draft_id ||
          post.content_id ||
          post.id
        );
      })
      .filter(Boolean);

    // Also build identifiers from published posts to exclude those drafts as well
    const publishedIdentifiers = (publishedPosts || [])
      .map((post) => {
        return (
          post.draft_id ||
          post.draftId ||
          post.original_draft_id ||
          post.content_id ||
          post.id
        );
      })
      .filter(Boolean);

    // Filter out drafts that match any scheduled or published identifier
    return drafts.filter((draft) => {
      // Check if draft has been scheduled by any identifier
      const isScheduled =
        scheduledIdentifiers.includes(draft.id) ||
        scheduledIdentifiers.includes(draft.content_id) ||
        scheduledIdentifiers.includes(draft.draft_id);

      // Check if draft has already been published by any identifier
      const isPublished =
        publishedIdentifiers.includes(draft.id) ||
        publishedIdentifiers.includes(draft.content_id) ||
        publishedIdentifiers.includes(draft.draft_id);

      // Also check if draft has a scheduled_time field (indicating it's scheduled)
      const hasScheduledTime =
        draft.scheduled_time !== null && draft.scheduled_time !== undefined;

      return !isScheduled && !hasScheduledTime && !isPublished;
    });
  };

  // New useEffect to calculate draftCount excluding scheduled drafts
  useEffect(() => {
    const filteredDrafts = filterScheduledDrafts(draftData, scheduleData, postData);
    setDraftCount(filteredDrafts.length);
  }, [draftData, scheduleData, postData]);

  // Function to combine published and scheduled posts
  const combinePublishedAndScheduledPosts = (publishedPosts, scheduledPosts, weekOffset, setWeekDate) => {
    const { start } = getWeekRange(weekOffset, setWeekDate);

    const weekDays = Array.from({ length: 7 }).map((_, i) => {
      const date = moment(start).add(i, 'days');
      return {
        day: date.format('ddd'), // Mon, Tue...
        date: date.format('YYYY-MM-DD'), // YYYY-MM-DD
        posts: [],
      };
    });

    // Add published posts
    publishedPosts.forEach((post) => {
      const postDate = moment.utc(post.published_at || post.created_at).local();
      const key = postDate.format('YYYY-MM-DD');
      
      const targetDay = weekDays.find((day) => day.date === key);
      if (targetDay) {
        targetDay.posts.push({
          ...post,
          // post_type: 'published',
          // display_time: post.published_at || post.created_at
        });
      }
    });

    // Add scheduled posts
    scheduledPosts.forEach((post) => {
      const postDate = moment.utc(post.scheduled_time).local();
      const key = postDate.format('YYYY-MM-DD');
      
      const targetDay = weekDays.find((day) => day.date === key);
      if (targetDay) {
        targetDay.posts.push({
          ...post,
          // post_type: 'scheduled',
          // display_time: post.scheduled_time
        });
      }
    });

    // Sort posts by time within each day
    weekDays.forEach((day) => {
      day.posts.sort((a, b) => 
        moment.utc(a.display_time).local() - moment.utc(b.display_time).local()
      );
    });
console.log("weekDays", weekDays) 
    return weekDays;
  };

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

    // Combine published and scheduled posts
    const combinedPosts = combinePublishedAndScheduledPosts(
      postData, 
      scheduleData, 
      currentWeek, 
      setWeekDate
    );

    // Filter out drafts that have been scheduled or already published
    const filteredDrafts = filterScheduledDrafts(
      weekDrafts.drafts,
      scheduleData,
      postData
    );

    setFilteredPosts(weekPosts);
    setFilteredDrafts(filteredDrafts); // Use the filtered drafts
    setFilteredScheduledPosts(weekScheduledPosts.data);
    setFilteredAllPosts(combinedPosts || [])
  }, [scheduleData, draftData, postData, currentWeek,
    //  allPostsData
    ]);

  console.log("filteredPosts", filteredPosts);
  console.log("filteredDrafts", filteredDrafts);
  console.log("filteredScheduledPosts", filteredScheduledPosts);
  console.log("filteredAllPosts", filteredAllPosts);
  console.log("");

  const handleOpenEditModal = (content, type) => {
    // Determine if this is a scheduled post
    const isScheduled = content.scheduled_post_id || content.scheduled_time || type === 'scheduled';

    // Transform the content to match the expected structure for EditContentModal
    const transformedContent = {
      type: type,
      id: content.id || content.draft_id || content.scheduled_post_id,
      content_id: content.content_id,
      content_text: content.content_text || content.content || "",
      hashtags: content.hashtags || [],
      platform: content.platform || "linkedin",
      image_url: content.image_url || null,
      created_at: content.created_at || content.scheduled_time,
      scheduled_time: content.scheduled_time || null, // Add scheduled_time for scheduled posts
      isScheduled: isScheduled, // Add isScheduled flag for scheduled posts
      ayrshare_postId: content.ayrshare_postId || null,
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
            ayrsharePostId: content.ayrshare_postId || null,
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
    // setShowEditModal(false);
    // setModalEditingContent(null);
  };

  // Drag to scroll handlers
  const handleMouseDown = (e) => {
    // Don't start drag if clicking on a post card or its children
    if (e.target.closest('.post-card') || e.target.closest('.scroll-btn')) {
      return;
    }
    
    setIsDragging(true);
    setStartX(e.pageX - e.currentTarget.offsetLeft);
    setScrollLeft(e.currentTarget.scrollLeft);
    e.currentTarget.style.cursor = 'grabbing';
    e.preventDefault();
  };

  const handleMouseLeave = (e) => {
    setIsDragging(false);
    e.currentTarget.style.cursor = 'grab';
  };

  const handleMouseUp = (e) => {
    setIsDragging(false);
    e.currentTarget.style.cursor = 'grab';
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - e.currentTarget.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    e.currentTarget.scrollLeft = scrollLeft - walk;
  };

  // Touch handlers for mobile
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - e.currentTarget.offsetLeft);
    setScrollLeft(e.currentTarget.scrollLeft);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.touches[0].pageX - e.currentTarget.offsetLeft;
    const walk = (x - startX) * 2;
    e.currentTarget.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Scroll functions for arrow buttons
  const scrollByLeft = (container) => {
    if (container) {
      container.scrollBy({
        left: -300, // Adjust scroll amount as needed
        behavior: 'smooth'
      });
    }
  };

  const scrollByRight = (container) => {
    if (container) {
      container.scrollBy({
        left: 300, // Adjust scroll amount as needed
        behavior: 'smooth'
      });
    }
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
                    <div className="scrollable-section">
                      {filteredDrafts?.length >= 3 && (
                        <button 
                          className="scroll-btn left" 
                          onClick={(e) => {
                            e.stopPropagation();
                            scrollByLeft(e.currentTarget.nextElementSibling);
                          }}
                        >
                          <i className="fa-solid fa-chevron-left"></i>
                        </button>
                      )}
                      <div
                        className="posts-container hide-scrollbar"
                        onMouseDown={handleMouseDown}
                        onMouseLeave={handleMouseLeave}
                        onMouseUp={handleMouseUp}
                        onMouseMove={handleMouseMove}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                      >
                        <div className="posts-scroll">
                          {filteredDrafts?.map((data, index) => (
                            <div
                              onClick={() => handleOpenEditModal(data,"draft")}
                              key={index}
                              className="post-card cursor-pointer published"
                            >
                              <div className="post-header">
                                <div className="dashboard-platform-icon linkedin in1">
                                  {data?.platform == "linkedin" ? (
                                    <img
                                      src={icon9}
                                      alt="LinkedIn"
                                      className="status-icon"
                                    />
                                  ) : data?.platform == "twitter" ? (
                                    <img
                                      src={Ink2}
                                      alt="Twitter"
                                      className="status-icon"
                                    />
                                  ) : data?.platform == "instagram" ? (
                                    <img
                                      src={Ink3}
                                      alt="Instagram"
                                      className="status-icon"
                                    />
                                  ) : data?.platform == "facebook" ? (
                                    <img
                                      src={Ink4}
                                      alt="Facebook"
                                      className="status-icon"
                                    />
                                  ) : (
                                    <img
                                      src={Ink2}
                                      alt="Platform"
                                      className="status-icon"
                                    />
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
                                <p className="post-text mb-0 pb-0">
                                  {data?.content_text?.length > 100
                                    ? data.content_text.substring(0, 50) + "..."
                                    : data?.content_text}
                                </p>
                                <span className="dashboard-draft-time">
                                  {new Date(
                                    data?.updated_at + "Z"
                                  ).toLocaleTimeString([], {
                                    month: "short",
                                    day: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </span>
                              </div>
                              <div className="post-content">
                                <div className="post-meta">
                                  <div className="post-image">
                                    <img
                                      src={
                                        `${BASE_URL}` +
                                          data?.image_url || icon6
                                      }
                                      alt="Robot"
                                      className="robot-asset-img"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = icon6;
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {filteredDrafts?.length >= 3 && (
                        <button
                          className="scroll-btn right"
                          onClick={(e) => {
                            e.stopPropagation();
                            scrollByRight(
                              e.currentTarget.previousElementSibling
                            );
                          }}
                        >
                          <i className="fa-solid fa-chevron-right"></i>
                        </button>
                      )}
                    </div>
                  </div>
                )}

               

                <>
                  {filteredAllPosts && Array.isArray(filteredAllPosts) && filteredAllPosts.length > 0 && (
                    <>
                      {filteredAllPosts.map((data, index) => (
                        <div key={index} className="calendar-row">
                          <div className="date-column">
                            <div className="date-number">
                              {new Date(data?.date).getDate()}
                            </div>
                            <div className="day-name">{data?.day}</div>
                          </div>

                          <div className="scrollable-section">
                              {data?.posts?.length >= 3 && (
                                <button
                                  className="scroll-btn left"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    scrollByLeft(
                                      e.currentTarget.nextElementSibling
                                    );
                                  }}
                                >
                                  <i className="fa-solid fa-chevron-left"></i>
                                </button>
                              )}
                            <div
                              className="posts-container hide-scrollbar"
                              onMouseDown={handleMouseDown}
                              onMouseLeave={handleMouseLeave}
                              onMouseUp={handleMouseUp}
                              onMouseMove={handleMouseMove}
                              onTouchStart={handleTouchStart}
                              onTouchMove={handleTouchMove}
                              onTouchEnd={handleTouchEnd}
                            >
                              <div className="posts-scroll">
                                {data?.posts &&
                                  data?.posts.map((post, index) => (
                                    <div
                                      key={index}
                                      onClick={() => {
                                        if ( post.post_url !== null && post.published_at ) {
                                          console.log("If")
                                          window.open(post.post_url, "_blank");
                                        } else   {
                                          console.log("Elif")
                                          handleOpenEditModal(post, "scheduled");
                                        }
                                      }}
                                      className="post-card cursor-pointer published"
                                    >
                                      <div className="post-header">
                                        <div className="dashboard-platform-icon linkedin in1">
                                          {post?.platform === "linkedin" ? (
                                            <img
                                              src={icon9}
                                              alt="LinkedIn"
                                              className="status-icon"
                                            />
                                          ) : post?.platform === "twitter" ? (
                                            <img
                                              src={Ink2}
                                              alt="Twitter"
                                              className="status-icon"
                                            />
                                          ) : post?.platform === "instagram" ? (
                                            <img
                                              src={Ink3}
                                              alt="Instagram"
                                              className="status-icon"
                                            />
                                          ) : post?.platform === "facebook" ? (
                                            <img
                                              src={Ink4}
                                              alt="Facebook"
                                              className="status-icon"
                                            />
                                          ) : (
                                            <img
                                              src={Ink2}
                                              alt="Platform"
                                              className="status-icon"
                                            />
                                          )}
                                        </div>
                                        <div className="post-status">
                                          <span className="status-label published-status">
                                            <img
                                              src={post?.postUrl ? icon2 : icon7}
                                              alt={!post?.postUrl !== 'published' ? "Scheduled" : "Published"}
                                              className="status-icon"
                                            />
                                            {post?.postUrl !== null && post.published_at ?  'Published' : 'Scheduled'}
                                          </span>
                                        </div>
                                        <p className="post-text mb-0 pb-0">
                                          {post?.content_text?.length > 100
                                            ? post.content_text.substring(0, 50) +
                                              "..."
                                            : post?.content_text}
                                        </p>
                                        <span className="dashboard-post-time">
                                          {post.postUrl!==null && post.published_at ? (<>  {new Date(
                                            post?.published_at+ "Z"
                                          ).toLocaleTimeString("en-IN", {
                                            timeZone: "Asia/Kolkata",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: true,
                                          })}</>):(<>  {new Date(
                                            post?.scheduled_time
                                          ).toLocaleTimeString("en-IN", {
                                            timeZone: "Asia/Kolkata",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            hour12: true,
                                          })}</>)}
                                        
                                        </span>
                                      </div>
                                      <div className="post-content">
                                        <div className="post-meta">
                                          <div className="post-image">
                                            <img
                                              src={
                                                post?.image_url ||
                                                `${BASE_URL}` +
                                                  post?.image_url ||
                                                icon6
                                              }
                                              alt="Robot"
                                              className="robot-asset-img"
                                              onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = icon6;
                                              }}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                            {data?.posts?.length >= 3 && (
                              <button
                                className="scroll-btn right"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  scrollByRight(
                                    e.currentTarget.previousElementSibling
                                  );
                                }}
                              >
                                <i className="fa-solid fa-chevron-right"></i>
                              </button>
                            )}
                          </div>
                        </div>
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
        platform={modalEditingContent?.platform}
        onNavigateToSocial={onNavigateToSocial}
      />
    </div>
  );
};

export default MyPostsDashboardNew;
