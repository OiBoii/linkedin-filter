# LinkedIn Jobs Filter Extension PRD

## Problem statement
LinkedIn job search pages surface large volumes of mixed-quality results. Users need a local, reliable way to automatically filter visible job cards by applicant volume, promoted/sponsored labels, reposted labels, and posting recency, without changing their query behavior.

## User stories
- As a job seeker, I want promoted jobs hidden by default so I can focus on organic listings.
- As a job seeker, I want to filter by applicant count to prioritize lower-competition jobs.
- As a job seeker, I want reposted jobs optionally hidden to avoid stale listings.
- As a job seeker, I want to see only jobs posted within the last N days.
- As a job seeker, I want filtering to persist and apply automatically whenever I navigate LinkedIn jobs pages.
- As a user, I want an optional dim mode instead of full hiding.
- As a user, I want quick visibility into how many cards were processed/filtered and how much data was missing.

## Non-goals
- No job application automation.
- No server-side scraping or data exfiltration.
- No bypass of LinkedIn security controls.
- No attempt to normalize job quality beyond requested filters.

## Success criteria
- Extension auto-runs on `linkedin.com/jobs/search/*`, `linkedin.com/jobs/collections/*`, and related job-list pages.
- Filters are applied in under 500ms for visible-card scans on common result pages.
- Settings persist via `chrome.storage.sync` and survive refresh/browser restart.
- Dynamic page updates/infinite scroll trigger re-scan without breaking LinkedIn UI.
- Popup status reflects processed and filtered counts plus unknown-data counters.

## Constraints and risks
- LinkedIn DOM structure can change frequently (class names, wrappers, data attributes).
- Locale and A/B tests can alter text labels for applicants/time/promoted markers.
- LinkedIn uses dynamic rendering and infinite scroll; cards appear after initial load.
- Anti-scraping protections exist; implementation must only inspect rendered DOM and avoid request interception.

### DOM inspection strategy (resilience)
Use fallback selectors and text-based detection, avoiding brittle deep selectors:
- Candidate card roots:
  - `li.jobs-search-results__list-item`
  - `[data-occludable-job-id]`
  - `.job-card-container`
  - `.job-card-list__entity-lockup`
  - Closest `li/div/article` from anchors matching `/jobs/view/`
- Metadata extraction through multiple optional selectors plus card-level text fallback.
- Promote/repost detection from normalized visible text (`promoted`, `sponsored`, `reposted`) rather than a single class hook.

## Data model
Per parsed card:
- `id: string` stable identifier from job URL or generated fallback
- `url: string | null`
- `title: string | null`
- `company: string | null`
- `location: string | null`
- `applicants: number | null`
- `isPromoted: boolean`
- `isReposted: boolean`
- `postedAge: {
    value: number,
    unit: 'minute' | 'hour' | 'day',
    totalMinutes: number,
    totalDays: number
  } | null`
- `rawText: string` (debug only)

## UI spec (popup)
Fields:
- Master toggle: `Enable filtering` (default `true`)
- Applicants:
  - `Min applicants` (optional number)
  - `Max applicants` (optional number)
  - `Include jobs with unknown applicants` (default `true`)
- Promoted:
  - `Hide promoted/sponsored` (default `true`)
- Reposted:
  - `Hide reposted` (default `false`)
- Posted date:
  - `Show only jobs posted within last N days` (default `7`)
  - `Include jobs with unknown posted date` (default `true`)
- Mode:
  - `Hide` (default)
  - `Dim`
- Debug:
  - `Enable debug logging` (default `false`)

Controls:
- `Re-scan` button
- `Reset to defaults` button
- Status area text: `Processed X cards, hidden Y, unknown applicants Z, unknown date W`

## Persistence spec
Storage key: `linkedinFilterSettingsV1` in `chrome.storage.sync`.

Settings schema:
- `enableFiltering: boolean`
- `minApplicants: number | null`
- `maxApplicants: number | null`
- `includeUnknownApplicants: boolean`
- `hidePromoted: boolean`
- `hideReposted: boolean`
- `maxAgeDays: number`
- `includeUnknownDate: boolean`
- `filterMode: 'hide' | 'dim'`
- `debug: boolean`

Behavior:
- Defaults seeded on install/startup.
- Content script listens to storage changes and reapplies filters immediately.

## Performance spec
- MutationObserver on document body and likely result containers.
- Debounced scan (250ms) to coalesce bursts of mutations.
- Process only cards in/near viewport (with margin) to reduce heavy loops.
- Lightweight parsing with selector fallback and bounded text checks.

## Testing plan (manual checklist)
1. Load extension unpacked and open LinkedIn jobs search.
2. Verify promoted jobs hidden by default.
3. Toggle promoted filter off and confirm cards reappear.
4. Set applicant min/max and verify inclusion/exclusion.
5. Toggle unknown applicants handling and verify behavior.
6. Set posted-within days and verify recent-only filtering.
7. Toggle unknown date handling and verify behavior.
8. Toggle reposted filter and verify reposted cards are affected.
9. Switch mode `Hide` vs `Dim` and validate rendering + badge.
10. Scroll to load more results and confirm new cards are filtered.
11. Change query/location and confirm filtering reapplies automatically.
12. Refresh page/browser and confirm settings persist.
13. Enable debug and verify parse/filter logs in console.
