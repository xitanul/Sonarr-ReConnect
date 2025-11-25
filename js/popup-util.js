import { normalizeBaseUrl } from './utils.js';

export function calculateEpisodeQuoteColor(episodeFileCount, totalEpisodeCount, monitored, status) {
    const episodeQuote = {
        'continuing': 'label regular',
        'ended': 'label success',
        'missing-monitored': 'label alert',
        'missing-not-monitored': 'label warning'
    }

    let label = ""
    if (episodeFileCount === totalEpisodeCount)
        if (status === 'continuing')
            label = episodeQuote['continuing'];
        else
            label = episodeQuote['ended'];
    else if (monitored)
        label = episodeQuote['missing-monitored'];
    else
        label = episodeQuote['missing-not-monitored'];

    return label;
}

export function getEpisodeStatus(episode) {
    const now = new Date();
    const airDate = new Date(episode.airDateUtc);

    let labelClass = '';

    if (episode.hasFile) {
        labelClass = 'label success';
    } else if (episode.monitored) {
        if (airDate < now) {
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

//format episodenumbers to match scene formatting
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
