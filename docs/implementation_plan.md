# Phased Implementation Plan: Sonarr-ReConnect Refactoring

## Overview

This implementation plan prioritizes fixes and improvements by impact and dependencies. Each phase builds on the previous, allowing for incremental progress with working software at each stage.

---

## 🔴 PHASE 1: Critical Bug Fixes (Immediate - 1-2 days)

> **Goal**: Fix showstopper bugs that break core functionality  
> **Risk**: Low - Targeted fixes with minimal side effects  
> **Testing**: Manual testing of each fixed feature

### 1.1 Fix URL Construction Bug ⚡ **HIGHEST PRIORITY**

**Files to modify**:
- [background.js:53](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/background.js#L53)
- [popup.js:43](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/popup.js#L43)
- [popup.js:58](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/popup.js#L58)
- [popup-util.js:34](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/popup-util.js#L34)

**Implementation**:
1. Create shared utility function (borrow from [options.js:10-18](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/options.js#L10-L18))
2. Create new file `/js/utils.js` with:
   ```javascript
   function normalizeBaseUrl(url) {
     if (url.indexOf("http://") === -1 && url.indexOf("https://") === -1) {
       url = "http://" + url;
     }
     if (url.substr(-1) !== '/' && url.length > 7) {
       url = url + '/';
     }
     return url;
   }
   ```
3. Replace all manual URL concatenations with this utility
4. Update manifest to include `utils.js` before other scripts

**Verification**:
- Test with URL `http://localhost:8989` (no trailing slash)
- Test with URL `https://example.com/` (with trailing slash)
- Verify API calls succeed in Network tab

---

### 1.2 Fix Episode Endpoint Typo

**File**: [popup.js:10](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/popup.js#L10)

**Change**:
```diff
- episode : "api/v3/episode/\\{episodeId}?apikey={apikey}",
+ episode : "api/v3/episode/{episodeId}?apikey={apikey}",
```

**Verification**:
- Click "watched" indicator on any episode
- Verify Console shows proper PUT request to `/api/v3/episode/123?apikey=...`
- Verify monitored status toggles

---

### 1.3 Fix Badge Logic

**Files**:
- [background.js:64](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/background.js#L64)
- [popup.js:586](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/popup.js#L586)

**Changes**:
```diff
- if (text && this.settings.showBadge === "true" || parseInt(text, 10) > 0) {
+ if (text && (this.settings.showBadge === "true" || parseInt(text, 10) > 0)) {
```

**Verification**:
- Set "Show badge" to OFF in options
- Verify badge does NOT appear when `totalRecords = 0`
- Set "Show badge" to ON
- Verify badge appears even when `totalRecords = 0`

---

### 1.4 Fix Undefined Callback

**File**: [popup.js:77-79](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/popup.js#L77-L79)

**Change**:
```diff
- setSeasonData : function (seasonData){
-   sonarr.setData('season', seasonData, callback);
+ setSeasonData : function (seasonData, callback){
+   sonarr.setData('season', seasonData, callback);
```

**Note**: This function appears unused - consider removing entirely after verification

**Verification**:
- Search codebase for calls to `setSeasonData`
- If none found, mark for removal in Phase 2

---

### 1.5 Fix localStorage Initialization

**File**: [popup.js:721-734](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/popup.js#L721-L734)

**Change**:
```diff
  function prepLocalStorage() {
    if (localStorage.getItem('wanted') === null) {
-     localStorage.setItem('wanted', undefined);
+     localStorage.setItem('wanted', JSON.stringify(null));
    }
    // ... repeat for calendar, history, series
  }
```

**Verification**:
- Clear localStorage
- Open extension
- Check that `localStorage.wanted !== "undefined"` (string)

---

### 🧪 Phase 1 Testing Checklist

- [ ] Extension loads without errors
- [ ] API calls succeed (verify in Network tab)
- [ ] Wanted episodes display correctly
- [ ] Calendar shows upcoming episodes
- [ ] Badge respects user preference
- [ ] Monitor toggle works
- [ ] No console errors

---

## 🟠 PHASE 2: Security Fixes (High Priority - 2-3 days)

> **Goal**: Eliminate XSS vulnerabilities  
> **Risk**: Medium - Requires careful testing of UI rendering  
> **Testing**: Test with malicious data payloads

### 2.1 Sanitize All HTML Injections

**Files to modify**:
- [popup.js:118](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/popup.js#L118)
- [popup.js:130](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/popup.js#L130)
- [popup.js:148](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/popup.js#L148)
- [popup.js:197](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/popup.js#L197)
- [popup.js:203](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/popup.js#L203)
- [popup.js:209](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/popup.js#L209)
- [popup.js:446](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/popup.js#L446)

**Implementation**:

**Option A: Quick Fix** (Use jQuery's `.text()`)
```javascript
// Before
episode.find(".series-title").html(data.seriesTitle);
// After
episode.find(".series-title").text(data.seriesTitle);
```

**Option B: Better Fix** (Use native `textContent`)
```javascript
episode.find(".series-title")[0].textContent = data.seriesTitle;
```

**For line 148** (requires different approach as it builds HTML):
```javascript
// Before
episode.find(".episode-info .episode-info").prepend("<span class='label secondary'> " + data.episodeQuality + "</span>");

// After
const qualitySpan = document.createElement('span');
qualitySpan.className = 'label secondary';
qualitySpan.textContent = ' ' + data.episodeQuality;
episode.find(".episode-info .episode-info")[0].prepend(qualitySpan);
```

### 2.2 Audit All Data Flows

**Create security checklist**:
1. Identify all API data inputs
2. Ensure all displayed data uses `.text()` or `textContent`
3. Use `.html()` ONLY for trusted, hardcoded HTML

**Files to audit**:
- All `create.*` functions in [popup.js:83-216](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/popup.js#L83-L216)

---

### 🧪 Phase 2 Testing Checklist

Create test Sonarr data with malicious payloads:
- [ ] Series title: `<script>alert('XSS')</script>`
- [ ] Episode title: `<img src=x onerror=alert('XSS')>`
- [ ] Network name: `<iframe src="evil.com">`

Verify:
- [ ] All text displays literally (escaped)
- [ ] No script execution
- [ ] No console errors

---

## 🟡 PHASE 3: Architecture Improvements (Medium Priority - 3-5 days)

> **Goal**: Standardize storage, remove redundancy  
> **Risk**: Medium - Requires data migration  
> **Testing**: Thorough testing of data persistence

### 3.1 Migrate from localStorage to chrome.storage.local

**Files to modify**:
- [popup.js:28-29](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/popup.js#L28-L29) (getData)
- [popup.js:46](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/popup.js#L46) (setItem)
- [popup.js:721-734](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/popup.js#L721-L734) (prepLocalStorage)

**Implementation**:

**Step 1**: Create async storage wrapper in `/js/storage.js`
```javascript
const storage = {
  async get(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => {
        resolve(result[key] || null);
      });
    });
  },
  
  async set(key, value) {
    return chrome.storage.local.set({ [key]: value });
  }
};
```

**Step 2**: Replace all `localStorage.getItem()` calls
```diff
- if (localStorage.getItem(mode) != "undefined" && mode != 'episode' && mode != 'episodes') {
-   callback($.parseJSON(localStorage.getItem(mode)));
- }
+ const cachedData = await storage.get(mode);
+ if (cachedData && mode !== 'episode' && mode !== 'episodes') {
+   callback(cachedData);
+ }
```

**Step 3**: Migration helper (runs once on upgrade)
```javascript
async function migrateLocalStorageToChrome() {
  const keys = ['wanted', 'calendar', 'history', 'series'];
  for (const key of keys) {
    const value = localStorage.getItem(key);
    if (value && value !== 'undefined') {
      await storage.set(key, JSON.parse(value));
      localStorage.removeItem(key);
    }
  }
}
```

**Step 4**: Add migration call to [background.js](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/background.js)
```javascript
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'update') {
    await migrateLocalStorageToChrome();
  }
});
```

---

### 3.2 Remove Offscreen Keep-Alive

**Files to modify**:
- [background.js:72-81](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/background.js#L72-L81)
- [manifest.json:14](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/manifest.json#L14)

**Changes**:

1. Remove offscreen permission:
```diff
  "permissions": [
    "storage",
    "alarms",
-   "offscreen"
  ],
```

2. Delete in [background.js](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/background.js):
```diff
- async function createOffscreen() { ... }
- chrome.runtime.onStartup.addListener(createOffscreen);
- self.onmessage = e => {};
- createOffscreen();
```

3. Delete files:
   - `/js/offscreen.js`
   - `/offscreen.html`

**Rationale**: `chrome.alarms` already keeps service worker alive

---

### 3.3 Consolidate Duplicate getOptions()

**Files to refactor**:
- [background.js:9-37](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/background.js#L9-L37)
- [popup.js:649-674](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/popup.js#L649-L674)
- [options.js:105-127](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/options.js#L105-L127)

**Implementation**:

Create `/js/settings.js`:
```javascript
const Settings = {
  defaults: {
    apiKey: '',
    url: 'http://localhost:8989',
    numberOfDaysCalendar: 7,
    wantedItems: 15,
    historyItems: 15,
    calendarEndDate: 7,
    backgroundInterval: 5,
    sonarrConfig: {},
    showBadge: false
  },
  
  async get() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(this.defaults, resolve);
    });
  },
  
  async set(settings) {
    return chrome.storage.sync.set(settings);
  }
};
```

Replace all `getOptions()` calls with:
```javascript
const settings = await Settings.get();
```

---

### 🧪 Phase 3 Testing Checklist

- [ ] Data persists after closing extension
- [ ] Settings sync across Chrome instances (if signed in)
- [ ] Data migration works (test upgrade from previous version)
- [ ] Service worker stays alive for alarms
- [ ] No offscreen document created
- [ ] Extension size reduced (removed offscreen files)

---

## 🟢 PHASE 4: Modernization (Lower Priority - 5-7 days)

> **Goal**: Modern JavaScript, remove jQuery  
> **Risk**: High - Large refactoring  
> **Testing**: Complete regression testing

### 4.1 Replace var with const/let

**Files**: [popup.js](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/popup.js), [options.js](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/options.js)

**Strategy**:
1. Use ESLint with rules:
   ```json
   {
     "rules": {
       "no-var": "error",
       "prefer-const": "warn"
     }
   }
   ```
2. Auto-fix with: `eslint --fix js/*.js`
3. Manual review of fixes

**Guidelines**:
- Use `const` by default
- Use `let` only when reassignment needed
- Never use `var`

---

### 4.2 Remove jQuery Dependency

**Strategy**: Incremental replacement, file by file

**Priority Order**:
1. **options.js** (smallest, simplest)
2. **popup-util.js** (no jQuery usage currently)
3. **popup.js** (largest, most complex)

**Common Replacements**:

| jQuery | Vanilla JS |
|--------|-----------|
| `$(selector)` | `document.querySelector(selector)` |
| `$(selector).each()` | `document.querySelectorAll(selector).forEach()` |
| `$.ajax()` | `fetch()` |
| `$(el).addClass('foo')` | `el.classList.add('foo')` |
| `$(el).html(content)` | `el.innerHTML = content` |
| `$(el).text(content)` | `el.textContent = content` |
| `$(el).on('click', fn)` | `el.addEventListener('click', fn)` |
| `$(el).attr('data-id')` | `el.getAttribute('data-id')` |
| `$(el).clone()` | `el.cloneNode(true)` |

**Example Refactor** ([options.js:34-54](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/options.js#L34-L54)):

**Before**:
```javascript
$.ajax({
  url: url + 'api/v3/system/status?apiKey=' + apiKey,
  statusCode: {
    401: function() {
      status.textContent = 'Credentials or url are not correct';
    }
  }
});
```

**After**:
```javascript
try {
  const response = await fetch(url + 'api/v3/system/status?apiKey=' + apiKey);
  if (response.status === 401) {
    status.textContent = 'Credentials or url are not correct';
    return;
  }
  if (!response.ok) {
    status.textContent = 'Sonarr is not running on this address';
    return;
  }
  const data = await response.json();
  status.textContent = 'Connection successful!';
  getInstallationInformation(data);
  sonarrConfig = data;
} catch (error) {
  status.textContent = 'Connection failed';
}
```

---

### 4.3 Remove Moment.js Dependency

**File**: [popup.html:11](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/popup.html#L11)

**Current Usage**: [popup.js:141](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/popup.js#L141)
```javascript
var aired = moment(new Date(data.airDateUtc)).fromNow();
```

**Option A: Native Intl API** (Zero dependencies, 100% browser support)
```javascript
function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  return 'just now';
}
```

**Option B: Day.js** (~2KB minified)
```html
<script src="https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/dayjs@1/plugin/relativeTime.js"></script>
```
```javascript
dayjs.extend(dayjs_plugin_relativeTime);
var aired = dayjs(data.airDateUtc).fromNow();
```

**Recommendation**: Option A (native) for zero dependencies

**Impact**: Reduces bundle from 348KB → ~0.3KB (99.9% reduction!)

---

### 4.4 Use HTML5 Template Elements

**File**: [popup.html:17-115](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/popup.html#L17-L115)

**Before**:
```html
<div class="templates" style="display: none;">
  <div id="episode">...</div>
</div>
```

**After**:
```html
<template id="episode-template">
  <div class="episode">...</div>
</template>
```

**JavaScript changes**:
```diff
- var episode = $('.templates #episode').clone();
+ const template = document.getElementById('episode-template');
+ const episode = template.content.cloneNode(true);
```

---

### 4.5 Module Pattern for Namespace Management

**File**: [popup.js](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/popup.js)

**Current**: All objects in global scope

**Refactor to ES Modules**:

**Create** `/js/modules/sonarr-api.js`:
```javascript
export const SonarrAPI = {
  settings: { ... },
  getData: function(mode, callback, id) { ... },
  setData: function(mode, data, callback) { ... }
};
```

**Create** `/js/modules/ui-creators.js`:
```javascript
export const UICreators = {
  episode: function(data, mode) { ... },
  show: function(showdata) { ... }
};
```

**Update** [popup.html](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/popup.html):
```html
<script type="module" src="js/popup.js"></script>
```

**In popup.js**:
```javascript
import { SonarrAPI } from './modules/sonarr-api.js';
import { UICreators } from './modules/ui-creators.js';
```

---

### 🧪 Phase 4 Testing Checklist

- [ ] All functionality works without jQuery
- [ ] Bundle size reduced significantly
- [ ] No global scope pollution
- [ ] Relative time displays correctly
- [ ] Templates render correctly
- [ ] All modes work (Calendar, Series, History)
- [ ] Performance improvement measurable

---

## 🔵 PHASE 5: Polish & Optimization (Optional - 2-3 days)

> **Goal**: Address remaining issues, improve UX  
> **Risk**: Low - Quality of life improvements  
> **Testing**: User acceptance testing

### 5.1 Improve Error Handling

**File**: [background.js:49-62](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/background.js#L49-L62)

**Add user-facing error states**:
```javascript
fetchData: async function() {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      this.handleError('API request failed');
      return;
    }
    const data = await response.json();
    this.updateBadge(data.totalRecords.toString());
    await chrome.storage.local.set({ lastFetchError: null });
  } catch (error) {
    console.error('Fetch error:', error);
    this.handleError(error.message);
  }
},

handleError: async function(message) {
  chrome.action.setBadgeText({ text: '!' });
  chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
  await chrome.storage.local.set({ 
    lastFetchError: message,
    lastFetchTime: Date.now()
  });
}
```

**In popup.js**, check for errors on load:
```javascript
const { lastFetchError } = await chrome.storage.local.get('lastFetchError');
if (lastFetchError) {
  showErrorBanner(lastFetchError);
}
```

---

### 5.2 Add Missing Permissions

**File**: [manifest.json](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/manifest.json)

```diff
  "permissions": [
    "storage",
    "alarms"
- ]
+ ],
+ "host_permissions": [
+   "http://*/",
+   "https://*/"
+ ]
```

**Note**: This makes cross-origin requests explicit

---

### 5.3 Replace Event Unbind/Rebind with Delegation

**File**: [popup.js](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/popup.js)

**Before** ([popup.js:166-173](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/popup.js#L166-L173)):
```javascript
episodeClicks: function (){
  $('.series-title').unbind('click').on('click', function(){
    var seriesId = $(this).data('series-id');
    getSeries.makeShow(seriesId);
  });
}
```

**After**:
```javascript
// Set up once on page load
document.querySelector('.list').addEventListener('click', (e) => {
  if (e.target.matches('.series-title')) {
    const seriesId = e.target.dataset.seriesId;
    getSeries.makeShow(seriesId);
  }
  
  if (e.target.matches('.watched-indicator')) {
    const episodeId = e.target.dataset.episodeId;
    episodeMonitored.set(episodeId);
  }
});
```

**Benefits**:
- No memory leaks from repeated bind/unbind
- Works for dynamically added elements
- Better performance

---

### 5.4 Add Data Validation Layer

**Create** `/js/validators.js`:
```javascript
export const Validators = {
  validateSettings(settings) {
    const errors = [];
    
    if (!settings.apiKey || settings.apiKey.length < 10) {
      errors.push('API key must be at least 10 characters');
    }
    
    if (!settings.url || settings.url.length < 9) {
      errors.push('URL is required');
    }
    
    if (settings.backgroundInterval < 1 || settings.backgroundInterval > 1440) {
      errors.push('Background interval must be between 1-1440 minutes');
    }
    
    return errors;
  },
  
  validateApiResponse(data, expectedFields) {
    for (const field of expectedFields) {
      if (!(field in data)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    return true;
  }
};
```

**Usage**:
```javascript
const errors = Validators.validateSettings(settings);
if (errors.length > 0) {
  displayErrors(errors);
  return;
}
```

---

### 5.5 Fix Minor Issues

**Typos**:
- [popup.html:4](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/popup.html#L4): "Sonnarr" → "Sonarr"
- [popup.js:2](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/popup.js#L2): "Extention" → "Extension"

**Replace `==` with `===`**:
- [popup-util.js:10-18](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/popup-util.js#L10-L18)

**Extract magic numbers to constants**:
```javascript
const MAX_TITLE_LENGTH_EPISODE = 20;
const MAX_TITLE_LENGTH_SHOW = 25;
const MIN_API_KEY_LENGTH = 10;
```

**Remove commented code**:
- [popup.js:389](file:///Users/ianmeyer/Documents/dev/Sonarr-ReConnect/js/popup.js#L389)

**Remove console.log in production**:
- Wrap in `if (DEBUG)` or remove entirely

---

### 🧪 Phase 5 Testing Checklist

- [ ] Errors display to user
- [ ] Invalid settings rejected with helpful messages
- [ ] API response errors handled gracefully
- [ ] No memory leaks (check with Chrome DevTools)
- [ ] Typos fixed
- [ ] No console warnings in production build

---

## Implementation Timeline

| Phase | Duration | Complexity | Impact |
|-------|----------|------------|--------|
| Phase 1: Critical Bugs | 1-2 days | Low | High |
| Phase 2: Security | 2-3 days | Medium | High |
| Phase 3: Architecture | 3-5 days | Medium | Medium |
| Phase 4: Modernization | 5-7 days | High | Medium |
| Phase 5: Polish | 2-3 days | Low | Low |
| **Total** | **13-20 days** | | |

---

## Risk Mitigation

### Version Control Strategy
- Create feature branch for each phase
- Tag each phase completion: `v2.1.0-phase1`, etc.
- Keep `main` deployable at all times

### Testing Strategy
1. **Unit tests** for critical functions (URL normalization, validation)
2. **Integration tests** for API calls
3. **Manual testing** for UI changes
4. **Regression testing** after each phase

### Rollback Plan
- Keep old jQuery-based code in comments during Phase 4
- Maintain feature flags for major changes
- User data backup before Phase 3 migration

---

## Success Metrics

### Phase 1 Success Criteria
- ✅ All API calls return 200 status
- ✅ Zero console errors on fresh install
- ✅ Badge respects user preferences

### Phase 2 Success Criteria
- ✅ XSS tests pass (no script execution)
- ✅ All text properly escaped

### Phase 3 Success Criteria
- ✅ Data survives browser restart
- ✅ Extension size reduced by >1KB
- ✅ Service worker lifecycle stable

### Phase 4 Success Criteria
- ✅ Bundle size reduced by >300KB
- ✅ No jQuery dependency
- ✅ Lighthouse score improved

### Phase 5 Success Criteria
- ✅ User-facing errors implemented
- ✅ Zero lint warnings
- ✅ Code coverage >80%

---

## Post-Implementation

### Documentation Updates Required
- Update README.md with new architecture
- Add CONTRIBUTING.md with development setup
- Create API documentation
- Add inline JSDoc comments

### Future Enhancements (Beyond this plan)
- Add TypeScript for type safety
- Implement webpack/vite build system
- Add automated testing (Jest/Playwright)
- Create options for theme customization
- Add internationalization (i18n)
- Implement service worker caching strategy

---

## Questions for Stakeholder Review

> [!IMPORTANT]
> Before starting implementation, please confirm:

1. **Priority Alignment**: Do you agree with the phased priority order?
2. **Timeline**: Is 2-3 weeks acceptable for complete refactoring?
3. **Breaking Changes**: Phase 3 requires data migration. Acceptable?
4. **jQuery Removal**: Phase 4 is substantial. Required, or can we keep jQuery?
5. **Testing**: Do you have existing test infrastructure, or should we create it?

---

## Appendix: Quick Reference

### Files Modified by Phase

**Phase 1**:
- `js/background.js`
- `js/popup.js`
- `js/popup-util.js`
- **NEW**: `js/utils.js`

**Phase 2**:
- `js/popup.js` (extensive XSS fixes)

**Phase 3**:
- `js/background.js`
- `js/popup.js`
- `js/options.js`
- `manifest.json`
- **NEW**: `js/storage.js`
- **NEW**: `js/settings.js`
- **DELETE**: `js/offscreen.js`, `offscreen.html`

**Phase 4**:
- `js/popup.js` (complete rewrite)
- `js/options.js` (complete rewrite)
- `js/popup-util.js`
- `popup.html`
- **NEW**: `js/modules/sonarr-api.js`
- **NEW**: `js/modules/ui-creators.js`

**Phase 5**:
- `js/background.js`
- `js/popup.js`
- `manifest.json`
- **NEW**: `js/validators.js`

### Dependency Changes

**Current**:
- jQuery (~85KB)
- Moment.js (348KB)
- Foundation CSS (154KB)

**After Phase 4**:
- ~~jQuery~~ (removed)
- ~~Moment.js~~ (removed)
- Foundation CSS (154KB) - keep or replace in future

**Bundle Size Reduction**: ~433KB → ~1KB (99.8% reduction)
