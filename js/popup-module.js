import { Settings } from './settings.js';
import { Storage } from './storage.js';
import { SonarrApi } from './modules/sonarr-api.js';
import { UI } from './modules/ui.js';
import { formatDate } from './popup-util.js';
import { ErrorHandler } from './error-handler.js';

const app = {
    settings: {},
    api: null,
    ui: null,
    currentMode: 'calendar',

    async init() {
        // Migration
        await Storage.migrate();

        this.settings = await Settings.get();
        this.ui = new UI(this.settings);
        this.api = new SonarrApi(this.settings);

        // Check permissions
        if (this.settings.url) {
            const origin = new URL(this.settings.url).origin + '/*';
            const hasPermission = await new Promise(resolve => {
                chrome.permissions.contains({ origins: [origin] }, resolve);
            });

            if (!hasPermission) {
                this.ui.renderPermissionRequest(this.settings.url, () => {
                    chrome.permissions.request({ origins: [origin] }, (granted) => {
                        if (granted) {
                            // Reload to start fresh
                            this.init();
                        }
                    });
                });
                return;
            }
        }

        this.bindMenu();
        this.load(this.settings.mode || 'calendar');
    },

    bindMenu() {
        document.querySelectorAll('.menu .item').forEach(item => {
            item.addEventListener('click', (e) => {
                const mode = e.currentTarget.dataset.mode;
                this.load(mode);

                document.querySelectorAll('.menu .item').forEach(i => i.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        document.getElementById('sonarr-url-link').addEventListener('click', () => {
            chrome.tabs.create({ url: this.settings.url });
        });
        document.getElementById('options-link').addEventListener('click', () => {
            chrome.tabs.create({ url: "options.html" });
        });
        document.getElementById('refresh-link').addEventListener('click', () => {
            this.load(this.currentMode);
        });

        this.ui.container.addEventListener('show-details', (e) => {
            const seriesId = e.detail.seriesId;
            this.loadShow(seriesId);
        });

        this.ui.container.addEventListener('toggle-monitor', (e) => {
            this.api.toggleEpisodeMonitor([e.detail.episodeId], e.detail.monitored)
                .catch(err => console.error(err));
        });
    },

    async loadShow(seriesId) {
        this.ui.showLoader();
        try {
            const series = await this.api.getSeriesById(seriesId);
            const episodes = await this.api.getEpisodes(seriesId);

            this.ui.clear();
            this.ui.renderShow(series, episodes);

            // Deselect menu items
            document.querySelectorAll('.menu .item').forEach(el => el.classList.remove('active'));
        } catch (error) {
            console.log('Error loading show:', error);
            const message = ErrorHandler.getUserMessage(error);
            ErrorHandler.showErrorState(this.ui.container, message, () => this.loadShow(seriesId));
        }
    },

    async load(mode) {
        this.currentMode = mode;
        this.ui.showLoader();

        try {
            const cached = await Storage.get(mode);
            if (cached) {
                this.render(mode, cached);
            }

            let data;
            if (mode === 'calendar') {
                const startDate = new Date();
                startDate.setHours(0, 0, 0, 0);
                const start = startDate.toISOString();
                const end = new Date(Date.now() + this.settings.numberOfDaysCalendar * 86400000).toISOString();
                const calendar = await this.api.getCalendar(start, end);
                const wanted = await this.api.getWantedMissing(1, this.settings.wantedItems || 5);
                data = { calendar, wanted: wanted.records };

                // Update badge
                if (wanted.totalRecords !== undefined && this.settings.showBadge) {
                    const text = wanted.totalRecords > 0 ? wanted.totalRecords.toString() : '';
                    chrome.action.setBadgeText({ text: text });
                }
            } else if (mode === 'series') {
                data = await this.api.getSeries();
            } else if (mode === 'history') {
                data = await this.api.getHistory(1, this.settings.historyItems);
            }

            if (data) {
                await Storage.set(mode, data);
                this.render(mode, data);
            }
        } catch (error) {
            console.log('Error loading data:', error);
            const message = ErrorHandler.getUserMessage(error);
            ErrorHandler.showErrorState(this.ui.container, message, () => this.load(mode));
        }
    },

    render(mode, data) {
        this.ui.clear();
        if (mode === 'calendar') {
            this.renderCalendarGroups(data);
        } else if (mode === 'series') {
            this.ui.renderSeries(data);
        } else if (mode === 'history') {
            this.ui.renderHistory(data.records); // History API returns { records: [...] }
        }
    },

    renderCalendarGroups(data) {
        const groups = {
            'Wanted': data.wanted || [],
            'Today': [],
            'Tomorrow': [],
            'Later': []
        };

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        if (data.calendar) {
            data.calendar.forEach(ep => {
                const epDate = new Date(ep.airDateUtc);
                const epDay = new Date(epDate.getFullYear(), epDate.getMonth(), epDate.getDate());

                if (epDay.getTime() === today.getTime()) {
                    groups['Today'].push(ep);
                } else if (epDay.getTime() === tomorrow.getTime()) {
                    groups['Tomorrow'].push(ep);
                } else if (epDay > tomorrow) {
                    groups['Later'].push(ep);
                }
            });
        }

        this.ui.renderCalendarGroups(groups);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
