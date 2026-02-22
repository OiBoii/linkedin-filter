# LinkedIn Jobs Filter (Chrome Extension, MV3)

Chrome extension to automatically filter LinkedIn job result cards by:
- applicant count
- promoted/sponsored marker
- reposted marker
- posted age

All filtering is local in the browser and only applies to rendered LinkedIn job cards.

## Features
- Auto-applies on LinkedIn jobs surfaces:
  - `https://www.linkedin.com/jobs/search/*`
  - `https://www.linkedin.com/jobs/collections/*`
  - Other LinkedIn pages where job-list cards are detected
- Filters:
  - Applicants: min/max + unknown handling
  - Promoted/sponsored: hide toggle
  - Reposted: hide toggle
  - Company blocklist: add/remove blocked company names in popup chips (case-insensitive partial + typo-tolerant match)
  - Posted age: show only within last N days + unknown handling
- Modes:
  - `Hide` (default)
  - `Dim` (adds a small `Filtered` badge)
- Popup status:
  - Processed cards
  - Hidden cards
  - Unknown applicants count
  - Unknown date count
- Persistent settings via `chrome.storage.sync`
- Debug logging toggle
- Debounced MutationObserver for dynamic/infinite-scroll pages

## Install (Load unpacked)
1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the `extension` folder from this repository.

## Usage
1. Open LinkedIn jobs results (for example `https://www.linkedin.com/jobs/search/`).
2. Click the extension icon to open the popup.
3. Configure filters.
4. Changes apply immediately.
5. Use **Re-scan** to force immediate reprocessing.
6. Use **Reset to defaults** to restore baseline settings.

## Project structure
- `PRD.md`
- `extension/manifest.json`
- `extension/src/background.js`
- `extension/src/content.js`
- `extension/src/popup.html`
- `extension/src/popup.css`
- `extension/src/popup.js`
- `extension/src/shared/constants.js`
- `extension/src/shared/parsers.js`
- `extension/src/shared/storage.js`

## Limitations
- LinkedIn DOM and labels can change due to A/B tests or UI updates.
- Parsing is best-effort and uses selector + text fallbacks.
- Locale differences may reduce detection accuracy for applicants/time labels if non-English wording differs significantly.
- On many LinkedIn layouts, applicant count and exact posted age are only exposed in the right detail pane after selecting a job card. The extension now caches these values per selected job when available.
- LinkedIn controls page size/pagination server-side. This extension cannot force `100` jobs per page if LinkedIn only returns smaller batches.
- Only already-rendered cards are processed; no network interception or hidden-data extraction is performed.

## Security and privacy
- No remote scripts.
- No external requests.
- No data exfiltration.
- Data remains local to extension storage.

## Manual testing checklist
- LinkedIn jobs search page with many cards:
  - hide promoted on/off
  - applicants min/max thresholds
  - posted within N days
  - unknown handling toggles
  - reposted toggle on/off
  - company blocklist (single name and multiple names)
  - mode switch hide vs dim
  - debug on/off (check console logs)
- Scroll to load more and confirm filtering continues.
- Change search query/location and confirm filtering still applies.
- Hard refresh and confirm settings persist.
