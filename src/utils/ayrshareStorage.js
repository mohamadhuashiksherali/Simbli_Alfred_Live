/**
 * Ayrshare Profile Storage Utilities
 * Handles localStorage operations for Ayrshare profile data
 */

const STORAGE_KEY = 'ayrshare_profile';

/**
 * Save profile data to localStorage
 * @param {Object} profileData - The profile data to save
 */
export const saveProfileToStorage = (profileData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profileData));
    return true;
  } catch (err) {
    console.error("Error saving profile to storage:", err);
    return false;
  }
};

/**
 * Load profile data from localStorage
 * @returns {Object|null} The profile data or null if not found
 */
export const loadProfileFromStorage = () => {
  try {
    const storedProfile = localStorage.getItem(STORAGE_KEY);
    if (storedProfile) {
      return JSON.parse(storedProfile);
    }
    return null;
  } catch (err) {
    console.error("Error loading profile from storage:", err);
    return null;
  }
};

/**
 * Clear profile data from localStorage
 */
export const clearProfileFromStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (err) {
    console.error("Error clearing profile from storage:", err);
    return false;
  }
};

/**
 * Check if profile exists in localStorage
 * @returns {boolean} True if profile exists, false otherwise
 */
export const hasProfileInStorage = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch (err) {
    console.error("Error checking profile in storage:", err);
    return false;
  }
};

/**
 * Get profile key from localStorage
 * @returns {string|null} The profile key or null if not found
 */
export const getProfileKeyFromStorage = () => {
  try {
    const profile = loadProfileFromStorage();
    return profile ? profile.profile_key : null;
  } catch (err) {
    console.error("Error getting profile key from storage:", err);
    return null;
  }
};

/**
 * Update specific profile fields in localStorage
 * @param {Object} updates - The fields to update
 */
export const updateProfileInStorage = (updates) => {
  try {
    const existingProfile = loadProfileFromStorage();
    if (existingProfile) {
      const updatedProfile = { ...existingProfile, ...updates };
      saveProfileToStorage(updatedProfile);
      return updatedProfile;
    }
    return null;
  } catch (err) {
    console.error("Error updating profile in storage:", err);
    return null;
  }
};
