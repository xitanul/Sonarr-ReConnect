/**
 * Shared utility functions for Sonarr-ReConnect
 */

import { MS_PER_MINUTE, MS_PER_HOUR, MS_PER_DAY } from './constants.js';

/**
 * Normalizes a base URL to ensure it starts with http(s) and ends with a slash.
 * @param {string} url - The URL to normalize
 * @returns {string} The normalized URL with protocol and trailing slash
 * @example
 * normalizeBaseUrl('localhost:8989') // 'http://localhost:8989/'
 * normalizeBaseUrl('https://sonarr.example.com') // 'https://sonarr.example.com/'
 */
export function normalizeBaseUrl(url) {
  if (!url) return '';

  // Ensure protocol
  if (url.indexOf("http://") === -1 && url.indexOf("https://") === -1) {
    url = "http://" + url;
  }

  // Ensure trailing slash
  // Only add slash if length > 7 (to avoid adding to just "http://")
  if (url.slice(-1) !== '/' && url.length > 7) {
    url = url + '/';
  }

  return url;
}

/**
 * Get relative time string (e.g. "in 2 days", "5 minutes ago")
 * Replaces moment(date).fromNow()
 * @param {string} dateString - ISO date string to compare against current time
 * @returns {string} Human-readable relative time string
 * @example
 * getRelativeTime('2024-12-25T00:00:00Z') // 'in 30 days'
 * getRelativeTime('2024-11-20T12:00:00Z') // '4 days ago'
 */
export function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date - now;
  const isFuture = diffMs > 0;
  const absMs = Math.abs(diffMs);

  const diffMins = Math.floor(absMs / MS_PER_MINUTE);
  const diffHours = Math.floor(absMs / MS_PER_HOUR);
  const diffDays = Math.floor(absMs / MS_PER_DAY);

  let timeStr = "";
  if (diffDays > 0) timeStr = `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  else if (diffHours > 0) timeStr = `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  else if (diffMins > 0) timeStr = `${diffMins} minute${diffMins > 1 ? 's' : ''}`;
  else timeStr = "a few seconds";

  const relativeStr = isFuture ? `in ${timeStr}` : `${timeStr} ago`;

  // Add prefix based on original extension behavior
  if (isFuture) {
    return `Airs ${relativeStr}`;
  } else {
    return `Aired ${relativeStr}`;
  }
}
