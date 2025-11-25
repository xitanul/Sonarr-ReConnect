/**
 * Shared utility functions for Sonarr-ReConnect
 */

/**
 * Normalizes a base URL to ensure it starts with http(s) and ends with a slash.
 * @param {string} url - The URL to normalize
 * @returns {string} - The normalized URL
 */
function normalizeBaseUrl(url) {
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
