/**
 * Enhanced Ayrshare Manager Component
 * 
 * This component provides improved functionality for Ayrshare posting and scheduling
 * with better validation, error handling, and user experience.
 */

import React, { useState, useEffect } from 'react';
import { 
  postToAyrshareEnhanced, 
  scheduleAyrsharePostEnhanced,
  bulkPostToAyrshare,
  getPostAnalytics,
  deleteAyrsharePost,
  validatePostContent,
  validateMediaAttachments,
  validatePlatforms,
  validateScheduledTime,
  createPostRequest,
  createScheduleRequest,
  getPlatformCharacterLimits,
  getPlatformRecommendations,
  getOptimalPlatforms
} from '../api/ayrshare_enhanced_api';
import { getAyrshareProfile, getAyrshareConnectedAccounts } from '../api/api';

const AyrshareManagerEnhanced = () => {
  // State management
  const [profile, setProfile] = useState(null);
  const [connectedAccounts, setConnectedAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('post');
  
  // Post state
  const [postContent, setPostContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [hashtags, setHashtags] = useState([]);
  const [mentions, setMentions] = useState([]);
  const [mediaAttachments, setMediaAttachments] = useState([]);
  const [draftMode, setDraftMode] = useState(false);
  
  // Schedule state
  const [scheduledTime, setScheduledTime] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [recurring, setRecurring] = useState(null);
  
  // Bulk post state
  const [bulkPosts, setBulkPosts] = useState([{ content: '', platforms: [], hashtags: [], mentions: [] }]);
  const [delayBetweenPosts, setDelayBetweenPosts] = useState(0);
  
  // Analytics state
  const [analytics, setAnalytics] = useState({});
  
  // Available platforms
  const availablePlatforms = [
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', limit: 3000 },
    { id: 'twitter', name: 'Twitter', icon: '🐦', limit: 280 },
    { id: 'facebook', name: 'Facebook', icon: '📘', limit: 63206 },
    { id: 'instagram', name: 'Instagram', icon: '📷', limit: 2200 }
  ];

  // Load profile and connected accounts on component mount
  useEffect(() => {
    loadProfile();
    loadConnectedAccounts();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await getAyrshareProfile();
      if (response.data) {
        setProfile(response.data);
      }
    } catch (err) {
      console.log("No Ayrshare profile found:", err);
    }
  };

  const loadConnectedAccounts = async () => {
    if (!profile) return;
    
    try {
      const response = await getAyrshareConnectedAccounts();
      if (response.data && response.data.accounts) {
        setConnectedAccounts(response.data.accounts);
      }
    } catch (err) {
      console.log("Could not load connected accounts:", err);
    }
  };

  // Validation functions
  const validateForm = () => {
    const contentValidation = validatePostContent(postContent);
    const mediaValidation = validateMediaAttachments(mediaAttachments);
    const platformValidation = validatePlatforms(selectedPlatforms);
    
    const errors = [
      ...contentValidation.errors,
      ...mediaValidation.errors,
      ...platformValidation.errors
    ];
    
    if (activeTab === 'schedule') {
      const timeValidation = validateScheduledTime(scheduledTime);
      errors.push(...timeValidation.errors);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Post functions
  const handlePost = async () => {
    if (!profile) {
      setError("No profile found. Please create a profile first.");
      return;
    }

    const validation = validateForm();
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const postData = createPostRequest(profile.profile_key, postContent, {
        media: mediaAttachments,
        platforms: selectedPlatforms,
        hashtags: hashtags,
        mentions: mentions,
        draft: draftMode
      });

      const response = await postToAyrshareEnhanced(postData);
      
      setSuccess(`Post published successfully! Posted to ${selectedPlatforms.length} platform(s).`);
      setPostContent('');
      setSelectedPlatforms([]);
      setHashtags([]);
      setMentions([]);
      setMediaAttachments([]);
      
      // Load analytics for the new post
      if (response.data.id) {
        loadPostAnalytics(response.data.id);
      }
      
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to post content");
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!profile) {
      setError("No profile found. Please create a profile first.");
      return;
    }

    const validation = validateForm();
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const scheduleData = createScheduleRequest(profile.profile_key, postContent, scheduledTime, {
        timezone: timezone,
        media: mediaAttachments,
        platforms: selectedPlatforms,
        hashtags: hashtags,
        mentions: mentions,
        recurring: recurring
      });

      // Use single Ayrshare API with platforms array (same pattern as post)
      const response = await scheduleAyrsharePostEnhanced(scheduleData);
      
      setSuccess(`Post scheduled successfully for ${new Date(scheduledTime).toLocaleString()}!`);
      setPostContent('');
      setScheduledTime('');
      setSelectedPlatforms([]);
      setHashtags([]);
      setMentions([]);
      setMediaAttachments([]);
      
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to schedule post");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkPost = async () => {
    if (!profile) {
      setError("No profile found. Please create a profile first.");
      return;
    }

    // Validate all posts
    const validPosts = [];
    for (let i = 0; i < bulkPosts.length; i++) {
      const post = bulkPosts[i];
      const validation = validatePostContent(post.content);
      if (validation.isValid && post.content.trim()) {
        validPosts.push(createPostRequest(profile.profile_key, post.content, {
          platforms: post.platforms,
          hashtags: post.hashtags,
          mentions: post.mentions
        }));
      }
    }

    if (validPosts.length === 0) {
      setError("No valid posts to publish");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const bulkData = {
        profile_key: profile.profile_key,
        posts: validPosts,
        delay_between_posts: delayBetweenPosts
      };

      const response = await bulkPostToAyrshare(bulkData);
      
      setSuccess(`Bulk post completed! ${response.data.successful_posts}/${response.data.total_posts} posts published successfully.`);
      setBulkPosts([{ content: '', platforms: [], hashtags: [], mentions: [] }]);
      
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to bulk post content");
    } finally {
      setLoading(false);
    }
  };

  const loadPostAnalytics = async (postId) => {
    try {
      const response = await getPostAnalytics(postId);
      setAnalytics(prev => ({
        ...prev,
        [postId]: response.data
      }));
    } catch (err) {
      console.log("Could not load analytics:", err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!profile) {
      setError("No profile found.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this post?")) {
      return;
    }

    try {
      setLoading(true);
      await deleteAyrsharePost(postId, profile.profile_key);
      setSuccess("Post deleted successfully");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete post");
    } finally {
      setLoading(false);
    }
  };

  // Platform selection helpers
  const togglePlatform = (platformId) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const selectOptimalPlatforms = () => {
    const optimal = getOptimalPlatforms(postContent);
    setSelectedPlatforms(optimal);
  };

  // Content helpers
  const addHashtag = (tag) => {
    const cleanTag = tag.replace('#', '').trim();
    if (cleanTag && !hashtags.includes(cleanTag)) {
      setHashtags(prev => [...prev, cleanTag]);
    }
  };

  const removeHashtag = (tag) => {
    setHashtags(prev => prev.filter(t => t !== tag));
  };

  const addMention = (mention) => {
    const cleanMention = mention.replace('@', '').trim();
    if (cleanMention && !mentions.includes(cleanMention)) {
      setMentions(prev => [...prev, cleanMention]);
    }
  };

  const removeMention = (mention) => {
    setMentions(prev => prev.filter(m => m !== mention));
  };

  // Media helpers
  const addMediaAttachment = (url, type, alt = '', caption = '') => {
    const newMedia = {
      url: url,
      type: type,
      alt: alt,
      caption: caption
    };
    setMediaAttachments(prev => [...prev, newMedia]);
  };

  const removeMediaAttachment = (index) => {
    setMediaAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Bulk post helpers
  const addBulkPost = () => {
    setBulkPosts(prev => [...prev, { content: '', platforms: [], hashtags: [], mentions: [] }]);
  };

  const removeBulkPost = (index) => {
    setBulkPosts(prev => prev.filter((_, i) => i !== index));
  };

  const updateBulkPost = (index, field, value) => {
    setBulkPosts(prev => prev.map((post, i) => 
      i === index ? { ...post, [field]: value } : post
    ));
  };

  // Get platform recommendations
  const getRecommendations = () => {
    return getPlatformRecommendations(postContent);
  };

  const getCharacterCount = () => {
    return postContent.length;
  };

  const getCharacterLimit = () => {
    const limits = getPlatformCharacterLimits();
    return Math.min(...selectedPlatforms.map(p => limits[p] || Infinity));
  };

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Enhanced Ayrshare Manager</h2>
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">No Ayrshare profile found.</p>
          <p className="text-sm text-gray-500">Please create an Ayrshare profile first to use the enhanced posting features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Enhanced Ayrshare Manager</h2>
      
      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6">
        {['post', 'schedule', 'bulk', 'analytics'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Post Tab */}
      {activeTab === 'post' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Post Content
            </label>
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">
                {getCharacterCount()} characters
                {selectedPlatforms.length > 0 && (
                  <span className="ml-2">
                    (Limit: {getCharacterLimit()})
                  </span>
                )}
              </span>
              {getRecommendations().length > 0 && (
                <div className="text-sm text-orange-600">
                  {getRecommendations().join(', ')}
                </div>
              )}
            </div>
          </div>

          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Platforms
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {availablePlatforms.map(platform => (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedPlatforms.includes(platform.id)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {platform.icon} {platform.name}
                </button>
              ))}
            </div>
            <button
              onClick={selectOptimalPlatforms}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Select Optimal Platforms
            </button>
          </div>

          {/* Hashtags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hashtags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {hashtags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1"
                >
                  #{tag}
                  <button
                    onClick={() => removeHashtag(tag)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add hashtag (without #)"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addHashtag(e.target.value);
                  e.target.value = '';
                }
              }}
            />
          </div>

          {/* Mentions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mentions
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {mentions.map(mention => (
                <span
                  key={mention}
                  className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-1"
                >
                  @{mention}
                  <button
                    onClick={() => removeMention(mention)}
                    className="text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add mention (without @)"
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addMention(e.target.value);
                  e.target.value = '';
                }
              }}
            />
          </div>

          {/* Media Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Media Attachments
            </label>
            {mediaAttachments.map((media, index) => (
              <div key={index} className="flex items-center gap-2 mb-2 p-2 bg-gray-50 rounded">
                <span className="text-sm">{media.type}: {media.url}</span>
                <button
                  onClick={() => removeMediaAttachment(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Media URL"
                className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const url = e.target.value;
                    const type = prompt('Media type (image/video/gif):', 'image');
                    if (type && ['image', 'video', 'gif'].includes(type)) {
                      addMediaAttachment(url, type);
                      e.target.value = '';
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Draft Mode */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="draftMode"
              checked={draftMode}
              onChange={(e) => setDraftMode(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="draftMode" className="text-sm text-gray-700">
              Save as draft
            </label>
          </div>

          {/* Post Button */}
          <button
            onClick={handlePost}
            disabled={loading || !postContent.trim()}
            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Posting...' : 'Post Now'}
          </button>
        </div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="space-y-6">
          {/* Same content fields as post tab */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Post Content
            </label>
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
          </div>

          {/* Schedule Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Schedule Time
            </label>
            <input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Europe/Paris">Paris</option>
              <option value="Asia/Tokyo">Tokyo</option>
              <option value="Asia/Kolkata">India</option>
            </select>
          </div>

          {/* Schedule Button */}
          <button
            onClick={handleSchedule}
            disabled={loading || !postContent.trim() || !scheduledTime}
            className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Scheduling...' : 'Schedule Post'}
          </button>
        </div>
      )}

      {/* Bulk Post Tab */}
      {activeTab === 'bulk' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delay Between Posts (seconds)
            </label>
            <input
              type="number"
              value={delayBetweenPosts}
              onChange={(e) => setDelayBetweenPosts(parseInt(e.target.value) || 0)}
              min="0"
              max="300"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {bulkPosts.map((post, index) => (
            <div key={index} className="border border-gray-300 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Post {index + 1}</h3>
                {bulkPosts.length > 1 && (
                  <button
                    onClick={() => removeBulkPost(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                )}
              </div>
              <textarea
                value={post.content}
                onChange={(e) => updateBulkPost(index, 'content', e.target.value)}
                placeholder="Post content"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
          ))}

          <button
            onClick={addBulkPost}
            className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-600"
          >
            Add Another Post
          </button>

          <button
            onClick={handleBulkPost}
            disabled={loading || bulkPosts.every(p => !p.content.trim())}
            className="w-full bg-purple-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Posting...' : 'Bulk Post'}
          </button>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-800">Post Analytics</h3>
          {Object.keys(analytics).length === 0 ? (
            <p className="text-gray-500">No analytics data available yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(analytics).map(([postId, data]) => (
                <div key={postId} className="border border-gray-300 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Post {postId.slice(-8)}</h4>
                  <div className="space-y-2 text-sm">
                    <div>Views: {data.views}</div>
                    <div>Likes: {data.likes}</div>
                    <div>Shares: {data.shares}</div>
                    <div>Comments: {data.comments}</div>
                    <div>Engagement: {data.engagement_rate}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AyrshareManagerEnhanced;
