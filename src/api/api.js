import axios from "axios";

// ========================================
// API CONFIGURATION
// ========================================

// LIVE
// export const FRONTEND_URL = `https://alfred.simbli.ai`
// export const SIMBLI_URL = `https://www.simbli.ai`;
// export const VITE_IMAGE_URL = `https://backend-demo.simbli.ai/image`;
// export const BASE_URL = `https://backend-alfred.simbli.ai`;
// export const COMMON_BASE_URL = `https://backend-demo.simbli.ai`;

// DEMO
// export const FRONTEND_URL = `https://dev-alfred.simbli.ai`
// export const SIMBLI_URL = `https://dev.simbli.ai`;
// export const VITE_IMAGE_URL = `https://dev-backend.simbli.ai/image`;
// export const BASE_URL = `https://dev-backend-alfred.simbli.ai`;
// export const COMMON_BASE_URL = `https://dev-backend.simbli.ai`;

// LOCAL
export const FRONTEND_URL = `http://localhost:5174`
export const BASE_URL = `http://localhost:8000`;
export const COMMON_BASE_URL = `http://localhost:5500`;
export const SIMBLI_URL = `http://localhost:5173`;
export const VITE_IMAGE_URL = `http://localhost:4000/image`;

// ========================================
// CONTENT MANAGEMENT APIs
// ========================================

//Get Profile
export const getProfile = async () => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(`${COMMON_BASE_URL}/api/v1/get-profile`, {
      headers,
    });
    return response;
  } catch (err) {
    console.error("Error fetching content:", err);
    throw err;
  }
};

// All Posts (Drafts, Scheduled, Published)
export const getAllPostsApi = async () => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(`${BASE_URL}/content/all-posts`, { headers });
    return response;
  } catch (err) {
    console.error("Error fetching all posts:", err);
    throw err;
  }
};


//update profile
export const updateProfile = async (formData) => {
  try {
    const response = await axios.put(`${COMMON_BASE_URL}/api/v1/update-profile`, formData);
    return response;
  } catch (err) {
    console.error("Error updating profile:", err);
    throw err;
  }
};

//Get Content
export const getContentApi = async () => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(`${BASE_URL}/content/`, { headers });
    return response;
  } catch (err) {
    console.error("Error fetching content:", err);
    throw err;
  }
};

// Published Posts
export const getPostsApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/content/published-posts`);
    return response;
  } catch (err) {
    console.error("Error fetching posts:", err);
    throw err;
  }
};

// Drafts
export const getDraftsApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/content/drafts`);
    return response;
  } catch (err) {
    console.error("Error fetching drafts:", err);
    throw err;
  }
};

// Scheduled Posts
export const getSchedulePostsApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/content/scheduled-posts`);
    return response;
  } catch (err) {
    console.error("Error fetching scheduled posts:", err);
    throw err;
  }
};

// ========================================
// AUTHENTICATION APIs
// ========================================

// Social Connections
export const getSocialConnectionsApi = async () => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(`${BASE_URL}/auth/social-connections`, {
      headers,
    });
    return response;
  } catch (err) {
    console.error("Error fetching social connections:", err);
    throw err;
  }
};

// ========================================
// SOCIAL MEDIA CONNECTION APIs
// ========================================

// Fetch social media connection status
export const fetchSocialConnectionsApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/auth/social-connections`);
    return response;
  } catch (err) {
    console.error("Error fetching social connections:", err);
    throw err;
  }
};

// LinkedIn Connection
export const connectLinkedInApi = async () => {
  try {
    const token = localStorage.getItem("access-token");
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(`${BASE_URL}/auth/linkedin/connect`, {
      headers: authHeaders,
    });
    return response;
  } catch (err) {
    console.error("Error connecting to LinkedIn:", err);
    throw err;
  }
};

export const disconnectLinkedInApi = async () => {
  try {
    const token = localStorage.getItem("access-token");
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.delete(
      `${BASE_URL}/auth/linkedin/disconnect`,
      {
        headers: authHeaders,
      }
    );
    return response;
  } catch (err) {
    console.error("Error disconnecting from LinkedIn:", err);
    throw err;
  }
};

// Twitter/X Connection
export const connectTwitterApi = async () => {
  try {
    const token = localStorage.getItem("access-token");
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(`${BASE_URL}/auth/x/connect`, {
      headers: authHeaders,
    });
    return response;
  } catch (err) {
    console.error("Error connecting to Twitter:", err);
    throw err;
  }
};

export const disconnectTwitterApi = async (connectionId) => {
  try {
    const token = localStorage.getItem("access-token");
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.delete(
      `${BASE_URL}/auth/x/connections/${connectionId}`,
      {
        headers: authHeaders,
      }
    );
    return response;
  } catch (err) {
    console.error("Error disconnecting from Twitter:", err);
    throw err;
  }
};

// Facebook Connection
export const connectFacebookApi = async () => {
  try {
    const token = localStorage.getItem("access-token");
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(`${BASE_URL}/auth/facebook/connect`, {
      headers: authHeaders,
    });
    return response;
  } catch (err) {
    console.error("Error connecting to Facebook:", err);
    throw err;
  }
};

export const disconnectFacebookApi = async (connectionId) => {
  try {
    const token = localStorage.getItem("access-token");
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.delete(
      `${BASE_URL}/auth/facebook/connections/${connectionId}`,
      {
        headers: authHeaders,
      }
    );
    return response;
  } catch (err) {
    console.error("Error disconnecting from Facebook:", err);
    throw err;
  }
};

// ========================================
// CHAT APIs
// ========================================

export const analyzeImageApi = async (formData) => {
  try {
    const isLoggedIn = Boolean(localStorage.getItem("access-token"));
    const endpoint = isLoggedIn
      ? "/chat/analyze-image"
      : "/chat/analyze-image-public";
    const response = await axios.post(`${BASE_URL}${endpoint}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response;
  } catch (err) {
    console.error("Error analyzing image:", err);
    throw err;
  }
};

export const sendChatMessageApi = async (requestData) => {
  try {
    const response = await axios.post(`${BASE_URL}/chat/message`, requestData);
    return response;
  } catch (err) {
    console.error("Error sending chat message:", err);
    throw err;
  }
};

// Check chat block status
export const checkChatBlockStatusApi = async () => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(
      `${BASE_URL}/usage-limits/chat-block-status`,
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error checking chat block status:", err);
    throw err;
  }
};

// Check image limit status
export const checkImageLimitApi = async () => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(
      `${BASE_URL}/usage-limits/image-limit-check`,
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error checking image limit:", err);
    throw err;
  }
};

// ========================================
// CONTENT CREATION & MANAGEMENT APIs
// ========================================

export const uploadImageApi = async (contentId, formData) => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${BASE_URL}/content/upload-image/${contentId}`,
      formData,
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error uploading image:", err);
    throw err;
  }
};

export const uploadVideoApi = async (contentId, formData) => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${BASE_URL}/content/upload-video/${contentId}`,
      formData,
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error uploading video:", err);
    throw err;
  }
};

export const uploadMediaApi = async (contentId, formData) => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${BASE_URL}/content/upload-media/${contentId}`,
      formData,
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error uploading media:", err);
    throw err;
  }
};

export const generateImageApi = async (contentId) => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${BASE_URL}/content/generate-image?content_id=${contentId}`,
      null,
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error generating image:", err);
    throw err;
  }
};

export const publishContentApi = async (
  platform,
  contentId,
  formattedContent
) => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${BASE_URL}/content/publish/${platform}/${contentId}`,
      {
        formatted_content: formattedContent,
      },
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error publishing content:", err);
    throw err;
  }
};

export const getPublishUrlApi = async (platform) => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(
      `${BASE_URL}/content/platforms/${platform}/publish-url`,
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error getting publish URL:", err);
    throw err;
  }
};

// ========================================
// SCHEDULING APIs
// ========================================

export const reschedulePostApi = async (scheduledPostId, scheduledDateTime) => {
  try {
    const response = await axios.put(
      `${BASE_URL}/content/scheduled/${scheduledPostId}/reschedule`,
      {
        scheduled_time: scheduledDateTime,
        timezone: "Asia/Kolkata",
      }
    );
    return response;
  } catch (err) {
    console.error("Error rescheduling post:", err);
    throw err;
  }
};

export const schedulePostApi = async (
  platform,
  contentId,
  scheduledDateTime,
  formattedContent
) => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${BASE_URL}/content/schedule/${platform}/${contentId}`,
      {
        content_id: String(contentId),
        scheduled_time: scheduledDateTime,
        timezone: "Asia/Kolkata",
        formatted_content: formattedContent,
      },
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error scheduling post:", err);
    throw err;
  }
};

export const getSuggestedTimesApi = async () => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(
      `${BASE_URL}/content/schedule/suggested-times`,
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error getting suggested times:", err);
    throw err;
  }
};

export const unschedulePostApi = async (scheduledPostId) => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.delete(
      `${BASE_URL}/content/scheduled/${scheduledPostId}`,
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error unscheduling post:", err);
    throw err;
  }
};

// ========================================
// DRAFT MANAGEMENT APIs
// ========================================

export const saveDraftApi = async (contentId, selectedPlatform) => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${BASE_URL}/content/${contentId}/save-draft?platform=${encodeURIComponent(
        selectedPlatform || ""
      )}`,
      null,
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error saving draft:", err);
    throw err;
  }
};

export const removeDraftApi = async (contentId) => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${BASE_URL}/content/${contentId}/remove-draft`,
      {},
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error removing draft:", err);
    throw err;
  }
};

// ========================================
// DRAFT VERSIONS APIs (New System)
// ========================================

export const upsertDraftVersionApi = async (contentId, selectedPlatform, contentData) => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${BASE_URL}/content/draft-versions?content_id=${contentId}&platform=${encodeURIComponent(
        selectedPlatform || ""
      )}`,
      contentData, // Pass the content data in the request body
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error upserting draft version:", err);
    throw err;
  }
};

export const getDraftVersionsApi = async (limit = 50, offset = 0) => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(
      `${BASE_URL}/content/draft-versions?limit=${limit}&offset=${offset}`,
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error fetching draft versions:", err);
    throw err;
  }
};

export const getDraftVersionsByContentIdApi = async (contentId) => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(
      `${BASE_URL}/content/draft-versions/${contentId}`,
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error fetching draft versions for content:", err);
    throw err;
  }
};

export const removeDraftVersionApi = async (draftId) => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.delete(
      `${BASE_URL}/content/draft-versions/${draftId}`,
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error removing draft version:", err);
    throw err;
  }
};

export const updateDraftVersionApi = async (draftId, draftData) => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.put(
      `${BASE_URL}/content/draft-versions/${draftId}`,
      draftData,
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error updating draft version:", err);
    throw err;
  }
};

// ========================================
// DUPLICATE CONTENT APIs
// ========================================

export const getAvailablePlatformsForDuplicateApi = async (contentId) => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(
      `${BASE_URL}/content/${contentId}/available-platforms`,
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error fetching available platforms:", err);
    throw err;
  }
};

export const duplicateContentApi = async (contentId, draftId, targetPlatform) => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${BASE_URL}/content/${contentId}/duplicate`,
      {
        draft_id: draftId,
        target_platform: targetPlatform
      },
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error duplicating content:", err);
    throw err;
  }
};

// ========================================
// CONTENT UPDATE APIs
// ========================================

export const updateContentApi = async (
  contentId,
  contentText,
  hashtags,
  platform,
  originalPlatform = null
) => {
  try {
    console.log("contentId", contentId);
    console.log("platform", platform);
    console.log("originalPlatform", originalPlatform);
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    const requestData = {
      content_text: contentText,
      hashtags: hashtags,
      platform: platform,
    };
    
    // If originalPlatform is provided, include it in the request
    if (originalPlatform !== null) {
      requestData.original_platform = originalPlatform;
    }
    
    const response = await axios.put(
      `${BASE_URL}/content/${contentId}`,
      requestData,
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error updating content:", err);
    throw err;
  }
};

export const autoConvertPlatformApi = async (contentId, targetPlatform) => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${BASE_URL}/content/auto-convert-platform/${contentId}?target_platform=${targetPlatform}`,
      null,
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error auto-converting platform:", err);
    throw err;
  }
};

// ========================================
// DASHBOARD-SPECIFIC APIs
// ========================================

// User Authentication & Profile
export const logoutApi = async () => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${COMMON_BASE_URL}/api/v1/logout`,
      {},
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error logging out:", err);
    throw err;
  }
};

export const getProfileDataApi = async () => {
  try {
    const token = localStorage.getItem("access-token");
    if (!token) {
      return null;
    }
    const response = await axios.get(`${COMMON_BASE_URL}/api/v1/get-profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response;
  } catch (err) {
    console.error("Error fetching profile data:", err);
    throw err;
  }
};

// ========================================
// CONTENT HISTORY APIs
// ========================================

export const getLast7DaysContentHistoryApi = async () => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(
      `${BASE_URL}/content-history/last-7-days`,
      {
        headers,
      }
    );
    return response;
  } catch (err) {
    console.error("Error fetching last 7 days content history:", err);
    throw err;
  }
};

// Ayrshare API functions
export const createAyrshareProfile = async (title) => {
  try {
    const response = await axios.post(`${BASE_URL}/ayrshare/profiles`, {
      title,
    });
    return response;
  } catch (err) {
    console.error("Error creating Ayrshare profile:", err);
    throw err;
  }
};

export const registerAyrshareWebhook = async () => {
  try {
    const response = await axios.post(`${BASE_URL}/ayrshare/webhook/register`);
    return response;
  } catch (err) {
    console.error("Error registering Ayrshare webhook:", err);
    throw err;
  }
};

export const registerAyrshareSocialWebhook = async () => {
  try {
    const response = await axios.post(
      `${BASE_URL}/ayrshare/webhook/social/register`
    );
    return response;
  } catch (err) {
    console.error("Error registering Ayrshare social webhook:", err);
    throw err;
  }
};

export const getAyrshareProfile = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/ayrshare/profiles/me`);
    return response;
  } catch (err) {
    console.error("Error fetching Ayrshare profile:", err);
    throw err;
  }
};

export const searchAyrshareProfileByTitle = async (title) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/ayrshare/profiles/search?title=${encodeURIComponent(title)}`
    );
    return response;
  } catch (err) {
    console.error("Error searching Ayrshare profile by title:", err);
    throw err;
  }
};

export const getAyrshareConnectedAccounts = async () => {
  try {
    const response = await axios.get(
      `${BASE_URL}/ayrshare/profiles/connected-accounts`
    );
    return response;
  } catch (err) {
    console.error("Error getting Ayrshare connected accounts:", err);
    throw err;
  }
};

export const generateAyrshareJWT = async (
  profileKey,
  expiresIn = 10,
  allowedSocial = null
) => {
  try {
    const payload = { profile_key: profileKey, expires_in: expiresIn };
    if (allowedSocial) payload.allowed_social = allowedSocial;
    const response = await axios.post(
      `${BASE_URL}/ayrshare/profiles/generate-jwt`,
      payload
    );
    return response;
  } catch (err) {
    console.error("Error generating Ayrshare JWT:", err);
    throw err;
  }
};

// Legacy API - still functional for backward compatibility
export const postToAyrshare = async (
  contentId,
  profileKey,
  post,
  media = null,
  platforms = null,
  hashtags = null
) => {
  try {
    const payload = {
      content_id: String(contentId),
      profile_key: profileKey,
      post,
      hashtags: hashtags,
    };

    // Handle media - convert to mediaUrls format for Ayrshare API
    if (media) {
      if (Array.isArray(media) && media.length > 0) {
        if (typeof media[0] === "string") {
          // Already URLs
          payload.mediaUrls = media;
        } else if (typeof media[0] === "object" && media[0].url) {
          // Extract URLs from media objects
          payload.mediaUrls = media.map((item) => item.url).filter(Boolean);
        } else {
          // Fallback to legacy media format
          payload.media = media;
        }
      } else {
        payload.media = media;
      }
    }

    if (platforms) payload.platforms = platforms;

    console.log("Ayrshare API payload:", payload);
    const response = await axios.post(`${BASE_URL}/ayrshare/post`, payload);
    console.log("Ayrshare post API response:", response);
    return response;
  } catch (err) {
    console.error("Error posting to Ayrshare:", err);
    throw err;
  }
};

// Ayrshare scheduling API - matches the existing post pattern
export const scheduleAyrsharePost = async (
  contentId,
  profileKey,
  post,
  scheduledTime,
  media = null,
  platforms = null,
  hashtags = null
) => {
  try {
    // Get user's timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const payload = {
      content_id: String(contentId),
      profile_key: profileKey,
      post,
      scheduled_time: scheduledTime,
      timezone: userTimezone,
      hashtags: hashtags,
    };

    console.log("Scheduling Ayrshare post with payload:", { media, payload });
    // Handle media - convert to mediaUrls format for Ayrshare API (same as post)
    if (media) {
      if (Array.isArray(media) && media.length > 0) {
        if (typeof media[0] === "string") {
          // Already URLs
          payload.mediaUrls = media;
        } else if (typeof media[0] === "object" && media[0].url) {
          // Extract URLs from media objects
          payload.mediaUrls = media.map((item) => item.url).filter(Boolean);
        } else {
          // Fallback to legacy media format
          payload.media = media;
        }
      } else {
        payload.media = media;
      }
    }

    if (platforms) payload.platforms = platforms;

    console.log(
      `Schedule API - Local time: ${scheduledTime.toLocaleString()} (${userTimezone})`
    );
    console.log("Ayrshare schedule API payload:", payload);
    const response = await axios.post(`${BASE_URL}/ayrshare/schedule`, payload);
    return response;
    console.log("Ayrshare schedule API response:", response);
  } catch (err) {
    console.error("Error scheduling Ayrshare post:", err);
    throw err;
  }
};

export const deleteAyrshareProfile = async (profileKey) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/ayrshare/profiles/${profileKey}`
    );
    return response;
  } catch (err) {
    console.error("Error deleting Ayrshare profile:", err);
    throw err;
  }
};

export const updateAyrshareRefId = async (refId) => {
  try {
    const response = await axios.put(
      `${BASE_URL}/ayrshare/profiles/refid`,
      null,
      {
        params: { ref_id: refId },
      }
    );
    return response;
  } catch (err) {
    console.error("Error updating Ayrshare refId:", err);
    throw err;
  }
};

export const disconnectAyrshareSocialAccount = async (profileKey, platform) => {
  try {
    const payload = {
      profile_key: profileKey,
      platform: platform,
    };
    const response = await axios.post(
      `${BASE_URL}/ayrshare/profiles/disconnect-social`,
      payload
    );
    return response;
  } catch (err) {
    console.error("Error disconnecting Ayrshare social account:", err);
    throw err;
  }
};

export const checkAyrsharePlatformConnection = async (platform) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/ayrshare/profiles/check/${platform}`
    );
    return response;
  } catch (err) {
    console.error("Error checking Ayrshare platform connection:", err);
    throw err;
  }
};

export const syncAyrshareConnections = async () => {
  try {
    const response = await axios.post(
      `${BASE_URL}/ayrshare/profiles/sync-connections`
    );
    return response;
  } catch (err) {
    console.error("Error syncing Ayrshare connections:", err);
    throw err;
  }
};

// Unschedule a post via Ayrshare
export const unscheduleAyrsharePost = async (contentId, postId, profileKey) => {
  try {
    console.log(
      `Unschedule API - Post ID: ${postId}, Profile Key: ${profileKey}`
    );
    const response = await axios.delete(
      `${BASE_URL}/ayrshare/scheduled-posts`,
      {
        data: {
          content_id: String(contentId),
          post_id: postId,
          profile_key: profileKey,
        },
      }
    );
    return response;
  } catch (err) {
    console.error("Error unscheduling Ayrshare post:", err);
    throw err;
  }
};

// Update a scheduled post via Ayrshare
export const updateScheduledPost = async (
  contentId,
  postId,
  profileKey,
  scheduledTime,
  timezone
) => {
  try {
    console.log(
      `Update Scheduled Post API - Post ID: ${postId}, Profile Key: ${profileKey}, Scheduled Time: ${scheduledTime}`
    );
    const response = await axios.patch(`${BASE_URL}/ayrshare/scheduled-posts`, {
      content_id: String(contentId),
      post_id: postId,
      profile_key: profileKey,
      scheduled_time: scheduledTime,
      timezone: timezone,
    });
    return response;
  } catch (err) {
    console.error("Error updating scheduled post:", err);
    throw err;
  }
};

// Writing Style Analysis API functions
export const analyzeWritingStyle = async (
  profileKey,
  platform = "linkedin",
  limit = 12
) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/ayrshare/writing-style/analyze`,
      {
        profile_key: profileKey,
        platform: platform,
        limit: limit,
      }
    );
    return response;
  } catch (err) {
    console.error("Error analyzing writing style:", err);
    throw err;
  }
};

export const getWritingStyleAnalysis = async (analysisId) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/ayrshare/writing-style/${analysisId}`
    );
    return response;
  } catch (err) {
    console.error("Error getting writing style analysis:", err);
    throw err;
  }
};

export const getLatestWritingStyleAnalysis = async (platform = "linkedin") => {
  try {
    const response = await axios.get(
      `${BASE_URL}/ayrshare/writing-style/user/latest?platform=${platform}`
    );
    return response;
  } catch (err) {
    console.error("Error getting latest writing style analysis:", err);
    throw err;
  }
};

export const updateCompanyDetails = async (companyDetails) => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.put(
      `${BASE_URL}/ayrshare/writing-style/company-details`,
      {
       
        company_name: companyDetails?.company_name,
        role: companyDetails?.role,
        company_description : companyDetails?.company_description
      },
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error updating company details:", err);
    throw err;
  }
};

// ========================================
// NEWSLETTER APIs
// ========================================

// Subscribe to newsletter
export const subscribeNewsletterApi = async (email) => {
  try {
    const response = await axios.post(
      `${COMMON_BASE_URL}/api/v1/newadmin/newsletter/subscribe`,
      {
        email: email.trim(),
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response;
  } catch (err) {
    console.error("Error subscribing to newsletter:", err);
    throw err;
  }
};

// ========================================
// ACCOUNT MANAGEMENT APIs
// ========================================

// Delete user account
export const deleteAccountApi = async () => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.delete(
      `${COMMON_BASE_URL}/api/v1/delete`,
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error deleting account:", err);
    throw err;
  }
};

// ========================================
// SUBSCRIPTION APIs
// ========================================

// Get subscription plans
export const getSubscriptionPlansApi = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/subscription/plans`);
    return response;
  } catch (err) {
    console.error("Error fetching subscription plans:", err);
    throw err;
  }
};

// Get user's current subscription
export const getMySubscriptionApi = async () => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(
      `${BASE_URL}/subscription/my-subscription`,
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error fetching my subscription:", err);
    throw err;
  }
};

// Start free trial
export const startTrialApi = async (
  planId,
  currency = "INR",
  couponCode = null
) => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${BASE_URL}/subscription/start-trial`,
      {
        plan_id: planId,
        currency: currency,
        coupon_code: couponCode,
      },
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error starting trial:", err);
    throw err;
  }
};

// Convert trial to paid subscription
export const convertTrialToPaidApi = async (
  planId,
  currency = "INR",
  couponCode = null
) => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${BASE_URL}/subscription/convert-trial-to-paid`,
      {
        plan_id: planId,
        currency: currency,
        coupon_code: couponCode,
      },
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error converting trial to paid:", err);
    throw err;
  }
};

// Verify trial payment
export const verifyTrialPaymentApi = async (paymentData) => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${BASE_URL}/subscription/verify-trial-payment`,
      paymentData,
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error verifying trial payment:", err);
    throw err;
  }
};

// Verify conversion payment
export const verifyConversionPaymentApi = async (paymentData) => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${BASE_URL}/subscription/verify-conversion-payment`,
      paymentData,
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error verifying conversion payment:", err);
    throw err;
  }
};

// Get subscription invoices
export const getSubscriptionInvoicesApi = async (page) => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(`${BASE_URL}/subscription/invoices?page=${page}`, {
      headers,
    });
    return response;
  } catch (err) {
    console.error("Error fetching subscription invoices:", err);
    throw err;
  }
};

// Get billing history
export const getBillingHistoryApi = async (page) => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(
      `${BASE_URL}/subscription/billing-history?page=${page}`,
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error fetching billing history:", err);
    throw err;
  }
};


// Verify subscription authentication and store in database immediately
export const verifySubscriptionAuthenticationApi = async (subscriptionData) => {
  try {
    const token = localStorage.getItem("access-token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.post(
      `${BASE_URL}/subscription/verify-subscription-authentication`,
      subscriptionData,
      { headers }
    );
    return response;
  } catch (err) {
    console.error("Error verifying subscription authentication:", err);
    throw err;
  }
};
