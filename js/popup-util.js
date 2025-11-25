import { normalizeBaseUrl } from './utils.js';
import { EPISODE_STATUS_LABELS } from './constants.js';

/**
 * Calculate the appropriate label class for episode file count display
 * @param {number} episodeFileCount - Number of downloaded episodes
 * @param {number} totalEpisodeCount - Total number of episodes
 * @param {boolean} monitored - Whether the series is monitored
 * @param {string} status - Series status ('continuing' or 'ended')
 * @returns {string} CSS class name for the label
 */
export function calculateEpisodeQuoteColor(episodeFileCount, totalEpisodeCount, monitored, status) {
    let label = ""
    if (episodeFileCount === totalEpisodeCount)
        if (status === 'continuing')
            label = EPISODE_STATUS_LABELS['continuing'];
        else
            label = EPISODE_STATUS_LABELS['ended'];
    else if (monitored)
        label = EPISODE_STATUS_LABELS['missing-monitored'];
    else
        label = EPISODE_STATUS_LABELS['missing-not-monitored'];

    return label;
}

/**
 * Get CSS label class for episode status
 * @param {Object} episode - Episode object with hasFile, monitored, and airDateUTC properties
 * @returns {string} CSS class name for the status label
 */
export function getEpisodeStatus(episode) {
    const now = new Date();
    const airDate = new Date(episode.airDateUtc);

    let labelClass = '';

    if (episode.hasFile) {
        labelClass = 'label success';
    } else if (episode.monitored) {
        // Label as missing if it's in the past OR if it's airing today
        // This ensures 'Wanted' items and 'Today' items get the label,
        // but 'Tomorrow' and later do not.
        const isToday = now.toDateString() === airDate.toDateString();
        if (airDate < now || isToday) {
            labelClass = 'label missing';
        } else {
            labelClass = 'label regular';
        }
    } else {
        labelClass = 'label warning';
    }

    return labelClass;
}

//format date to be used in api
//TODO improve
export function formatDate(date, positiveOffset) {
    if (positiveOffset != null)
        date.setDate(date.getDate() + parseInt(positiveOffset));
    return (date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + (date.getDate()));
}

/**
 * Get image URL for Sonarr media (posters, banners, etc.)
 * @param {Object} data - Image data object with url property
 * @param {string} baseUrl - Sonarr base URL
 * @param {string} apiKey - API key for authentication
 * @returns {string} Full image URL with API key authentication
 */
export function getImageUrl(data, baseUrl, apiKey) {
    if (typeof data === "object") {
        const start = data.url.indexOf('MediaCover')
        // Note: Image URLs must use query parameter for authentication
        // because <img> tags cannot send custom headers
        // Use & because the URL already contains query parameters
        const newUrl = normalizeBaseUrl(baseUrl) + "api/v3/" + data.url.substring(start) + "&apikey=" + apiKey;
        return newUrl;
    } else {
        const noimg = "";
        return noimg;
    }
}

/**
 * Format episode number to scene format (e.g., S01E05)
 * @param {number} seasonNumber - Season number
 * @param {number} episodeNumber - Episode number
 * @returns {string} Formatted episode number (e.g., "S01E05")
 */
export const formatEpisodeNumer = function (seasonNumber, episodeNumber) {
    const episodeNum = "S" + (seasonNumber.toString().length === 1 ? '0' : '') + seasonNumber + "E" + (episodeNumber.toString().length === 1 ? '0' : '') + episodeNumber;
    return episodeNum;
}

//comparator to sort seasons by seasonNumber
export function episodeComparator(a, b) {
    if (a.seasonNumber < b.seasonNumber)
        return -1;
    else if (a.seasonNumber > b.seasonNumber)
        return 1;
    return 0;
}

// comparator to sort seasons by seasonNumber
export function seriesComparator(a, b) {
    if (a.status != b.status) {
        if (a.status < b.status)
            return -1;
        if (a.status > b.status)
            return 1;
        return 0;
    }
    if (a.sortTitle < b.sortTitle)
        return -1;
    if (a.sortTitle > b.sortTitle)
        return 1;
    return 0;
}
