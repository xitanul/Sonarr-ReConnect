import { getRelativeTime, normalizeBaseUrl } from '../utils.js';
import { calculateEpisodeQuoteColor, formatEpisodeNumer, getImageUrl, seriesComparator, getEpisodeStatus } from '../popup-util.js';
import { HISTORY_EVENT_TYPES } from '../constants.js';

export class UI {
    constructor(settings) {
        this.settings = settings;
        this.templates = {
            episode: document.getElementById('template-episode'),
            calendar: document.getElementById('template-calendar'),
            series: document.getElementById('template-series'),
            show: document.getElementById('template-show')
        };
        this.container = document.querySelector('.list');
    }

    /**
     * Attach monitor toggle event handler to an episode element
     * @param {Element} element - The episode element containing the monitor icon
     * @param {Object} episode - The episode data object with id and monitored status
     */
    _attachMonitorToggle(element, episode) {
        const monitorIcon = element.querySelector('.watched-indicator');
        if (!monitorIcon) return;

        // Set initial state
        if (episode.monitored) {
            monitorIcon.classList.remove('icon-negative');
        } else {
            monitorIcon.classList.add('icon-negative');
        }

        // Add click handler
        monitorIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            const isMonitored = !monitorIcon.classList.contains('icon-negative');
            const newMonitored = !isMonitored;

            // Update UI
            if (newMonitored) {
                monitorIcon.classList.remove('icon-negative');
            } else {
                monitorIcon.classList.add('icon-negative');
            }

            // Dispatch event
            const event = new CustomEvent('toggle-monitor', {
                detail: {
                    episodeId: episode.id,
                    monitored: newMonitored
                },
                bubbles: true
            });
            this.container.dispatchEvent(event);
        });
    }

    /**
     * Attach series navigation event handler to an element
     * @param {Element} element - The element to make clickable
     * @param {number} seriesId - The series ID to navigate to
     */
    _attachSeriesNavigation(element, seriesId) {
        if (!element || !seriesId) return;

        element.style.cursor = 'pointer';
        element.addEventListener('click', (e) => {
            e.stopPropagation();
            const event = new CustomEvent('show-details', {
                detail: { seriesId },
                bubbles: true
            });
            this.container.dispatchEvent(event);
        });
    }

    renderCalendarGroups(groups) {
        const order = ['Wanted', 'Today', 'Tomorrow', 'Later'];

        order.forEach(title => {
            const episodes = groups[title];
            if (episodes && episodes.length > 0) {
                const calendarRow = this.templates.calendar.content.cloneNode(true);
                calendarRow.querySelector('.title').textContent = title;

                if (title === 'Wanted') {
                    calendarRow.querySelector('.num').textContent = episodes.length;
                } else {
                    calendarRow.querySelector('.num').style.display = 'none';
                }

                const episodesContainer = calendarRow.querySelector('.episodes');
                episodes.forEach(ep => {
                    const epEl = this.createEpisodeElement(ep, ep.series?.title);

                    // Attach event handlers using helper methods
                    this._attachMonitorToggle(epEl, ep);

                    const titleEl = epEl.querySelector('.series-title');
                    const seriesId = ep.seriesId || ep.series?.id;
                    this._attachSeriesNavigation(titleEl, seriesId);

                    episodesContainer.appendChild(epEl);
                });

                // Collapsible
                const header = calendarRow.querySelector('.calendar-date');
                header.addEventListener('click', () => {
                    const currentDisplay = episodesContainer.style.display;
                    episodesContainer.style.display = currentDisplay === 'none' ? 'block' : 'none';
                });

                if (title === 'Wanted') {
                    episodesContainer.style.display = 'none';
                }

                this.container.appendChild(calendarRow);
            }
        });
    }

    renderSeries(seriesList) {
        // Filter input
        const filterRow = document.createElement('div');
        filterRow.className = 'row collapse';
        filterRow.style.padding = '0.5rem';
        filterRow.innerHTML = '<input type="text" placeholder="filter by name" style="margin:0;">';
        this.container.appendChild(filterRow);

        const listContainer = document.createElement('div');
        this.container.appendChild(listContainer);

        const input = filterRow.querySelector('input');
        input.addEventListener('keyup', () => {
            const term = input.value.toLowerCase();
            const items = listContainer.querySelectorAll('.series');
            items.forEach(item => {
                const title = item.querySelector('.series-title').textContent.toLowerCase();
                item.style.display = title.includes(term) ? 'block' : 'none';
            });
        });

        seriesList.sort(seriesComparator);
        seriesList.forEach(serie => {
            const clone = this.templates.series.content.cloneNode(true);
            const el = clone.querySelector('.serie-general');

            el.querySelector('.series-title').textContent = serie.title;
            el.querySelector('.series-title').addEventListener('click', () => {
                const event = new CustomEvent('show-details', { detail: { seriesId: serie.id }, bubbles: true });
                this.container.dispatchEvent(event);
            });

            el.querySelector('#network').textContent = serie.network;

            const statusMap = {
                'continuing': 'label success',
                'ended': 'label alert'
            };
            const statusClass = statusMap[serie.status] || 'label secondary';
            el.querySelector('#status').className = statusClass;
            el.querySelector('#status').textContent = serie.status;

            const epCount = el.querySelector('#episodesCount');
            epCount.textContent = `${serie.statistics.episodeFileCount}/${serie.statistics.episodeCount}`;
            epCount.className = calculateEpisodeQuoteColor(serie.statistics.episodeFileCount, serie.statistics.episodeCount, serie.monitored, serie.status);

            // Handle image
            const poster = el.querySelector('#poster');
            // getImageUrl expects object with url property? 
            // In popup-util.js: data.url.indexOf('MediaCover')
            // serie.images is array. Usually poster is type 'poster'.
            const posterImg = serie.images.find(i => i.coverType === 'poster');
            if (posterImg) {
                poster.src = getImageUrl(posterImg, this.settings.url, this.settings.apiKey);
            }

            listContainer.appendChild(clone);
        });
    }

    renderShow(series, episodes) {
        const clone = this.templates.show.content.cloneNode(true);
        const showEl = clone.querySelector('.show');

        // Banner
        const fanart = series.images.find(i => i.coverType === 'fanart');
        if (fanart) {
            const bannerUrl = getImageUrl(fanart, this.settings.url, this.settings.apiKey);
            showEl.querySelector('.banner').style.backgroundImage = `url('${bannerUrl}')`;
        }

        // Poster
        const poster = series.images.find(i => i.coverType === 'poster');
        if (poster) {
            const posterUrl = getImageUrl(poster, this.settings.url, this.settings.apiKey);
            showEl.querySelector('.poster img').src = posterUrl;
        }

        showEl.querySelector('#title').textContent = series.title;
        // showEl.querySelector('#network').textContent = series.network; // Template uses #network inside h6?
        // Template: <span id="network" class="network label secondary round"></span>
        showEl.querySelector('#network').textContent = series.network;

        showEl.querySelector('#show-status').innerHTML = `<i class="fi-play"></i> ${series.status}`;
        showEl.querySelector('#air-time').textContent = series.airTime;
        showEl.querySelector('#summary').textContent = series.overview;

        showEl.querySelector('#seasons').textContent = series.seasons ? series.seasons.length : 0;
        showEl.querySelector('#episodes').textContent = series.statistics ? series.statistics.episodeCount : 0;

        // Group episodes by season
        const seasons = {};
        episodes.forEach(ep => {
            if (!seasons[ep.seasonNumber]) seasons[ep.seasonNumber] = [];
            seasons[ep.seasonNumber].push(ep);
        });

        // Populate selector
        const selector = showEl.querySelector('#selected-season');
        selector.innerHTML = '';
        Object.keys(seasons).sort((a, b) => b - a).forEach(seasonNum => {
            const option = document.createElement('option');
            option.value = seasonNum;
            option.textContent = seasonNum == 0 ? 'Specials' : `Season ${seasonNum}`;
            selector.appendChild(option);
        });

        const episodesContainer = showEl.querySelector('.row.episodes');

        selector.addEventListener('change', () => {
            this.renderSeasonEpisodes(seasons[selector.value], episodesContainer);
        });

        if (selector.options.length > 0) {
            selector.value = selector.options[0].value;
            this.renderSeasonEpisodes(seasons[selector.value], episodesContainer);
        }

        this.container.appendChild(clone);
    }

    renderSeasonEpisodes(episodes, container) {
        Array.from(container.children).forEach(child => {
            if (!child.classList.contains('season-selector')) {
                container.removeChild(child);
            }
        });

        episodes.sort((a, b) => b.episodeNumber - a.episodeNumber);

        episodes.forEach(ep => {
            const el = this.createEpisodeElement(ep, null);

            // Attach monitor toggle using helper method
            this._attachMonitorToggle(el, ep);

            container.appendChild(el);
        });
    }

    renderHistory(historyList) {
        historyList.forEach(item => {
            const clone = this.templates.episode.content.cloneNode(true);
            const el = clone.querySelector('.episode');

            const seriesTitleEl = el.querySelector('.series-title');
            seriesTitleEl.textContent = item.series?.title || 'Unknown Series';
            this._attachSeriesNavigation(seriesTitleEl, item.seriesId);

            el.querySelector('.episodename').textContent = item.episode?.title || 'Unknown Episode';
            if (item.episode) {
                el.querySelector('.episodenum').textContent = formatEpisodeNumer(item.episode.seasonNumber, item.episode.episodeNumber);
            }
            el.querySelector('.date').textContent = getRelativeTime(item.date);

            // Map event type to display name
            const eventType = HISTORY_EVENT_TYPES[item.eventType] || item.eventType;
            el.querySelector('.status').textContent = eventType;
            el.querySelector('.status').classList.add(item.eventType); // Use original for class

            if (item.quality && item.quality.quality) {
                el.querySelector('.quality').textContent = item.quality.quality.name;
            }

            // Attach monitor toggle using helper method
            // For history items, we need to create a pseudo-episode object
            const pseudoEpisode = {
                id: item.episodeId,
                monitored: item.episode ? item.episode.monitored : false
            };
            this._attachMonitorToggle(clone, pseudoEpisode);

            this.container.appendChild(clone);
        });
    }

    showLoader() {
        this.container.innerHTML = '<div class="load"></div>';
    }

    clear() {
        this.container.innerHTML = '';
    }

    createEpisodeElement(episode, seriesTitle) {
        const clone = this.templates.episode.content.cloneNode(true);
        const el = clone.querySelector('.episode');

        if (seriesTitle) {
            el.querySelector('.series-title').textContent = seriesTitle;
            el.querySelector('.series-title').dataset.seriesId = episode.seriesId;
        } else {
            // Hide series title if not provided (e.g. inside series view)
            // Logic depends on CSS, maybe remove element?
            const st = el.querySelector('.series-title');
            if (st) st.remove();
        }

        el.dataset.episodeId = episode.id;
        el.querySelector('.episodenum').textContent = formatEpisodeNumer(episode.seasonNumber, episode.episodeNumber);
        el.querySelector('.episodename').textContent = episode.title;

        // Font size adjustment (logic from original popup.js)
        if (episode.title.length > 20) {
            el.querySelector('.episodename').style.fontSize = '12px';
        }

        // Status logic
        const statusClass = getEpisodeStatus(episode);
        // Preserve 'label' class from template while adding status classes
        el.querySelector('.status').className = `status label ${statusClass.replace('label ', '')}`;

        let statusText = '';
        if (statusClass.includes('success')) statusText = 'downloaded';
        else if (statusClass.includes('missing')) statusText = 'Missing';
        else if (statusClass.includes('warning')) statusText = 'unmonitored';

        el.querySelector('.status').textContent = statusText;



        const dateEl = el.querySelector('.date');
        dateEl.textContent = getRelativeTime(episode.airDateUtc);

        if (episode.episodeQuality) {
            const qualitySpan = document.createElement('span');
            qualitySpan.className = 'label secondary';
            qualitySpan.textContent = episode.episodeQuality;
            const infoEl = el.querySelector('.episode-info');
            infoEl.prepend(qualitySpan);
            infoEl.prepend(document.createTextNode(' '));
        }

        return clone;
    }
}
