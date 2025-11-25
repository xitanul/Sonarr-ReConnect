import { normalizeBaseUrl } from '../utils.js';

export class SonarrApi {
    constructor(settings) {
        this.settings = settings;
    }

    get baseUrl() {
        return normalizeBaseUrl(this.settings.url);
    }

    async getCalendar(startDate, endDate) {
        const url = `${this.baseUrl}api/v3/calendar?start=${startDate}&end=${endDate}&includeSeries=true`;
        return this._fetch(url);
    }

    async getSeries() {
        const url = `${this.baseUrl}api/v3/series`;
        return this._fetch(url);
    }

    async getHistory(page = 1, pageSize = 15, sortKey = 'date', sortDir = 'desc') {
        const url = `${this.baseUrl}api/v3/history?page=${page}&pageSize=${pageSize}&sortKey=${sortKey}&sortDir=${sortDir}&includeSeries=true&includeEpisode=true`;
        return this._fetch(url);
    }

    async getWantedMissing(page = 1, pageSize = 15, sortKey = 'airDateUtc', sortDir = 'desc') {
        const url = `${this.baseUrl}api/v3/wanted/missing?page=${page}&pageSize=${pageSize}&sortKey=${sortKey}&sortDir=${sortDir}&includeSeries=true`;
        return this._fetch(url);
    }

    async getEpisode(episodeId) {
        const url = `${this.baseUrl}api/v3/episode/${episodeId}`;
        return this._fetch(url);
    }

    async getEpisodes(seriesId) {
        const url = `${this.baseUrl}api/v3/episode?seriesId=${seriesId}`;
        return this._fetch(url);
    }

    async getSeriesById(seriesId) {
        const url = `${this.baseUrl}api/v3/series/${seriesId}`;
        return this._fetch(url);
    }

    async toggleEpisodeMonitor(episodeIds, monitored) {
        const url = `${this.baseUrl}api/v3/episode/monitor`;
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': this.settings.apiKey
            },
            body: JSON.stringify({
                episodeIds: episodeIds,
                monitored: monitored
            })
        });
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }

    async _fetch(url) {
        const response = await fetch(url, {
            headers: {
                'X-Api-Key': this.settings.apiKey
            }
        });
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }
}
