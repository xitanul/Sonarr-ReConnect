import { Settings } from './settings.js';
import { Storage } from './storage.js';
import { SonarrApi } from './modules/sonarr-api.js';
import { UI } from './modules/ui.js';
import { formatDate } from './popup-util.js';
import { ErrorHandler } from './error-handler.js';
import { MODES } from './constants.js';

const app = {
    settings: {},
    api: null,
    ui: null,
    currentMode: MODES.CALENDAR,

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
        this.load(this.settings.mode || MODES.CALENDAR);
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
            const { episodeId, monitored, toggleElement } = e.detail;
            this.api.toggleEpisodeMonitor([episodeId], monitored)
                .catch(err => {
                    console.error(err);
                    // Revert optimistic toggle on failure
                    if (toggleElement) {
                        if (monitored) {
                            toggleElement.classList.add('icon-negative');
                        } else {
                            toggleElement.classList.remove('icon-negative');
                        }
                    }
                    const message = ErrorHandler.getUserMessage(err);
                    ErrorHandler.showToast(message);
                });
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
        // Only show loader if we don't have data visible (approximate check)
        if (this.ui.container.children.length === 0 || this.ui.container.querySelector('.load')) {
            this.ui.showLoader();
        }

        try {
            const cached = await Storage.get(mode);
            if (cached) {
                try {
                    this.render(mode, cached);
                } catch (renderError) {
                    console.warn('[Popup] Failed to render cached data, will use fresh data:', renderError);
                    // Clear corrupted cache
                    await Storage.remove(mode);
                    this.ui.showLoader(); // Show loader again since render failed
                }
            }

            let data;
            if (mode === MODES.CALENDAR) {
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
            } else if (mode === MODES.SERIES) {
                data = await this.api.getSeries();

                // Validate series data before caching
                // Some series may not have statistics (unmonitored, newly added, etc.) - this is normal
                // Don't cache if ANY series lack statistics to avoid inconsistent cache state
                if (data && Array.isArray(data)) {
                    const allValid = data.every(serie => serie && serie.statistics);
                    if (!allValid) {
                        // Don't cache incomplete data, but still render it (defensive rendering handles it)
                        this.render(mode, data);
                        return; // Skip the normal cache + render flow
                    }
                }
            } else if (mode === MODES.HISTORY) {
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
        if (mode === MODES.CALENDAR) {
            this.renderCalendarGroups(data);
        } else if (mode === MODES.SERIES) {
            this.ui.renderSeries(data);
        } else if (mode === MODES.HISTORY) {
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
