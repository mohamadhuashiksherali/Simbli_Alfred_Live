/**
 * Enhanced Ayrshare API Functions
 *
 * This module provides improved API functions for Ayrshare posting and scheduling
 * with better error handling, validation, and features.
 */

import axios from "axios";
import moment from "moment-timezone";
import {
  convertLocalTimeToUTC,
  convertUTCToLocal,
  getCurrentTimezone,
  formatTimeForDisplay,
} from "../utils/timezoneUtils";

const BASE_URL =
  import.meta.env.VITE_API_URL || "https://backend-alfred.simbli.ai";

// Enhanced Post Functions
export const postToAyrshareEnhanced = async (postData) => {
  try {
    const response = await axios.post(`${BASE_URL}/ayrshare/v2/post`, postData);
    return response;
  } catch (err) {
    console.error("Error posting to Ayrshare (Enhanced):", err);
    throw err;
  }
};

export const scheduleAyrsharePostEnhanced = async (scheduleData) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/ayrshare/v2/schedule`,
      scheduleData
    );
    return response;
  } catch (err) {
    console.error("Error scheduling Ayrshare post (Enhanced):", err);
    throw err;
  }
};

export const bulkPostToAyrshare = async (bulkData) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/ayrshare/v2/bulk-post`,
      bulkData
    );
    return response;
  } catch (err) {
    console.error("Error bulk posting to Ayrshare:", err);
    throw err;
  }
};

export const getPostAnalytics = async (postId) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/ayrshare/v2/analytics/${postId}`
    );
    return response;
  } catch (err) {
    console.error("Error getting post analytics:", err);
    throw err;
  }
};

export const deleteAyrsharePost = async (postId, profileKey) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/ayrshare/v2/post/${postId}?profile_key=${profileKey}`
    );
    return response;
  } catch (err) {
    console.error("Error deleting Ayrshare post:", err);
    throw err;
  }
};

// Template Functions
export const getPostTemplates = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/ayrshare/v2/templates`);
    return response;
  } catch (err) {
    console.error("Error getting post templates:", err);
    throw err;
  }
};

export const createPostTemplate = async (templateData) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/ayrshare/v2/templates`,
      templateData
    );
    return response;
  } catch (err) {
    console.error("Error creating post template:", err);
    throw err;
  }
};

// Helper Functions
export const validatePostContent = (content) => {
  const errors = [];

  if (!content || !content.trim()) {
    errors.push("Content cannot be empty");
  }

  if (content && content.length > 2000) {
    errors.push("Content exceeds maximum length of 2000 characters");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateMediaAttachments = (media) => {
  const errors = [];

  if (!media || !Array.isArray(media)) {
    return { isValid: true, errors: [] };
  }

  for (let i = 0; i < media.length; i++) {
    const item = media[i];

    if (!item.url || !item.type) {
      errors.push(`Media item ${i + 1}: URL and type are required`);
    }

    if (item.url && !item.url.startsWith("http")) {
      errors.push(
        `Media item ${i + 1}: URL must start with http:// or https://`
      );
    }

    if (
      item.type &&
      !["image", "video", "gif"].includes(item.type.toLowerCase())
    ) {
      errors.push(`Media item ${i + 1}: Type must be image, video, or gif`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validatePlatforms = (platforms) => {
  const errors = [];
  const validPlatforms = ["linkedin", "twitter", "facebook", "instagram"];

  if (!platforms || !Array.isArray(platforms)) {
    return { isValid: true, errors: [] };
  }

  const invalidPlatforms = platforms.filter(
    (p) => !validPlatforms.includes(p.toLowerCase())
  );
  if (invalidPlatforms.length > 0) {
    errors.push(
      `Invalid platforms: ${invalidPlatforms.join(
        ", "
      )}. Valid platforms: ${validPlatforms.join(", ")}`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateScheduledTime = (scheduledTime) => {
  const errors = [];

  if (!scheduledTime) {
    errors.push("Scheduled time is required");
  } else {
    const now = new Date();
    const scheduled = new Date(scheduledTime);

    if (scheduled <= now) {
      errors.push("Scheduled time must be in the future");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const formatHashtags = (hashtags) => {
  if (!hashtags || !Array.isArray(hashtags)) {
    return [];
  }

  return hashtags.map((tag) => tag.replace("#", ""));
};

export const formatMentions = (mentions) => {
  if (!mentions || !Array.isArray(mentions)) {
    return [];
  }

  return mentions.map((mention) => mention.replace("@", ""));
};

export const createPostRequest = (profileKey, content, options = {}) => {
  const {
    media = null,
    platforms = null,
    hashtags = null,
    mentions = null,
    draft = false,
  } = options;

  return {
    profile_key: profileKey,
    content: content.trim(),
    media: media,
    platforms: platforms,
    hashtags: formatHashtags(hashtags),
    mentions: formatMentions(mentions),
    draft: draft,
  };
};

export const createScheduleRequest = (
  profileKey,
  content,
  scheduledTime,
  options = {}
) => {
  const {
    timezone = "UTC",
    media = null,
    platforms = null,
    hashtags = null,
    mentions = null,
    recurring = null,
  } = options;

  // Convert local time to UTC if scheduledTime is a Date object
  let utcScheduledTime = scheduledTime;
  if (scheduledTime instanceof Date) {
    // Convert local time to UTC using moment.js
    const userTimezone = getCurrentTimezone();
    const localMoment = moment.tz(scheduledTime, userTimezone);
    const utcMoment = localMoment.clone().utc();
    utcScheduledTime = utcMoment.toDate();

    console.log(
      `Enhanced API - Local time: ${localMoment.format()} (${userTimezone})`
    );
    console.log(`Enhanced API - UTC time: ${utcMoment.format()}`);
  }

  return {
    profile_key: profileKey,
    content: content.trim(),
    scheduled_time: utcScheduledTime,
    timezone: timezone,
    media: media,
    platforms: platforms,
    hashtags: formatHashtags(hashtags),
    mentions: formatMentions(mentions),
    recurring: recurring,
  };
};

export const createBulkPostRequest = (
  profileKey,
  posts,
  delayBetweenPosts = 0
) => {
  return {
    profile_key: profileKey,
    posts: posts,
    delay_between_posts: delayBetweenPosts,
  };
};

// Platform-specific helpers
export const getPlatformCharacterLimits = () => {
  return {
    linkedin: 3000,
    twitter: 280,
    facebook: 63206,
    instagram: 2200,
  };
};

export const getPlatformRecommendations = (content) => {
  const recommendations = [];
  const length = content.length;

  if (length > 280) {
    recommendations.push("Content exceeds Twitter's 280 character limit");
  }

  if (length > 3000) {
    recommendations.push("Content exceeds LinkedIn's 3000 character limit");
  }

  if (length > 2200) {
    recommendations.push("Content exceeds Instagram's 2200 character limit");
  }

  return recommendations;
};

export const getOptimalPlatforms = (content) => {
  const length = content.length;
  const optimal = [];

  if (length <= 280) {
    optimal.push("twitter");
  }

  if (length <= 3000) {
    optimal.push("linkedin");
  }

  if (length <= 2200) {
    optimal.push("instagram");
  }

  // Facebook can handle any length
  optimal.push("facebook");

  return optimal;
};
