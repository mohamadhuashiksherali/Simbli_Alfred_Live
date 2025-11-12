import moment from 'moment-timezone';

/**
 * Get the current timezone of the user's browser
 * @returns {string} The user's timezone (e.g., 'America/New_York', 'Europe/London')
 */
export const getCurrentTimezone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Convert local time to UTC using moment.js
 * @param {string} dateString - Date in YYYY-MM-DD format
 * @param {string} timeString - Time in HH:MM format
 * @param {string} timezone - Timezone string (optional, defaults to user's timezone)
 * @returns {Object} Object containing local and UTC moment objects
 */
export const convertLocalTimeToUTC = (dateString, timeString, timezone = null) => {
  const userTimezone = timezone || getCurrentTimezone();
  
  // Create moment object in user's timezone
  const localDateTime = moment.tz(`${dateString} ${timeString}`, 'YYYY-MM-DD HH:mm', userTimezone);
  
  // Convert to UTC
  const utcDateTime = localDateTime.clone().utc();
  
  console.log(`Timezone conversion - Local: ${localDateTime.format()} (${userTimezone})`);
  console.log(`Timezone conversion - UTC: ${utcDateTime.format()}`);
  
  return {
    local: localDateTime,
    utc: utcDateTime,
    localISO: localDateTime.toISOString(),
    utcISO: utcDateTime.toISOString()
  };
};

/**
 * Convert UTC time to local timezone for display
 * @param {string} utcISOString - UTC time in ISO format
 * @param {string} timezone - Target timezone (optional, defaults to user's timezone)
 * @returns {Object} Object containing UTC and local moment objects
 */
export const convertUTCToLocal = (utcISOString, timezone = null) => {
  const userTimezone = timezone || getCurrentTimezone();
  
  // Create moment object from UTC string
  const utcDateTime = moment.utc(utcISOString);
  
  // Convert to user's timezone
  const localDateTime = utcDateTime.clone().tz(userTimezone);
  
  console.log(`UTC to Local conversion - UTC: ${utcDateTime.format()}`);
  console.log(`UTC to Local conversion - Local: ${localDateTime.format()} (${userTimezone})`);
  
  return {
    utc: utcDateTime,
    local: localDateTime,
    utcISO: utcDateTime.toISOString(),
    localISO: localDateTime.toISOString()
  };
};

/**
 * Get current time in user's timezone
 * @param {string} timezone - Timezone string (optional, defaults to user's timezone)
 * @returns {Object} Object containing current time in local and UTC
 */
export const getCurrentTime = (timezone = null) => {
  const userTimezone = timezone || getCurrentTimezone();
  const now = moment().tz(userTimezone);
  const utcNow = now.clone().utc();
  
  return {
    local: now,
    utc: utcNow,
    localISO: now.toISOString(),
    utcISO: utcNow.toISOString()
  };
};

/**
 * Format time for display in user's timezone
 * @param {string} utcISOString - UTC time in ISO format
 * @param {string} format - Moment.js format string (optional, defaults to 'YYYY-MM-DD HH:mm')
 * @param {string} timezone - Target timezone (optional, defaults to user's timezone)
 * @returns {string} Formatted time string
 */
export const formatTimeForDisplay = (utcISOString, format = 'YYYY-MM-DD HH:mm', timezone = null) => {
  const userTimezone = timezone || getCurrentTimezone();
  const localDateTime = moment.utc(utcISOString).tz(userTimezone);
  return localDateTime.format(format);
};

/**
 * Get timezone offset in minutes
 * @param {string} timezone - Timezone string (optional, defaults to user's timezone)
 * @returns {number} Timezone offset in minutes
 */
export const getTimezoneOffset = (timezone = null) => {
  const userTimezone = timezone || getCurrentTimezone();
  const now = moment().tz(userTimezone);
  return now.utcOffset();
};

/**
 * Validate if a timezone string is valid
 * @param {string} timezone - Timezone string to validate
 * @returns {boolean} True if timezone is valid
 */
export const isValidTimezone = (timezone) => {
  try {
    return moment.tz.zone(timezone) !== null;
  } catch (error) {
    return false;
  }
};

/**
 * Get list of common timezones
 * @returns {Array} Array of timezone objects with name and offset
 */
export const getCommonTimezones = () => {
  const timezones = [
    'America/New_York',
    'America/Chicago', 
    'America/Denver',
    'America/Los_Angeles',
    'America/Toronto',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Madrid',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Australia/Sydney',
    'Australia/Melbourne',
    'UTC'
  ];
  
  return timezones.map(tz => ({
    name: tz,
    offset: moment.tz(tz).format('Z'),
    display: `${tz} (${moment.tz(tz).format('Z')})`
  }));
};
