/**
 * Shared utility functions for Sonarr-ReConnect
 */

/**
 * Normalizes a base URL to ensure it starts with http(s) and ends with a slash.
 * @param {string} url - The URL to normalize
 * @returns {string} - The normalized URL
 */
export function normalizeBaseUrl(url) {
  if (!url) return '';

  // Ensure protocol
  if (url.indexOf("http://") === -1 && url.indexOf("https://") === -1) {
    url = "http://" + url;
  }

  // Ensure trailing slash
  // Only add slash if length > 7 (to avoid adding to just "http://")
  if (url.substr(-1) !== '/' && url.length > 7) {
    url = url + '/';
  }

  return url;
}

/**
 * Get relative time string (e.g. "in 2 days", "5 minutes ago")
 * Replaces moment(date).fromNow()
 * @param {string} dateString 
 * @returns {string}
 */
export function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date - now;
  const isFuture = diffMs > 0;
  const absMs = Math.abs(diffMs);

  const diffMins = Math.floor(absMs / 60000);
  const diffHours = Math.floor(absMs / 3600000);
  const diffDays = Math.floor(absMs / 86400000);

  let timeStr = "";
  if (diffDays > 0) timeStr = `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  else if (diffHours > 0) timeStr = `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  else if (diffMins > 0) timeStr = `${diffMins} minute${diffMins > 1 ? 's' : ''}`;
  else timeStr = "a few seconds";

  return isFuture ? `in ${timeStr}` : `${timeStr} ago`;
}
