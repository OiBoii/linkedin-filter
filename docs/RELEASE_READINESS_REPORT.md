# Release Readiness Report (Pre-Final)

## 1) Architecture Summary

- Manifest: MV3 (`extension/manifest.json`)
- Background: service worker (`extension/src/background.js`), initializes default settings.
- Content script: LinkedIn page scanner/filter engine (`extension/src/content.js`), DOM parsing + filtering + SPA reactivity.
- Popup UI: settings editor (`extension/src/popup.html`, `extension/src/popup.js`, `extension/src/popup.css`).
- Shared modules: constants/parsers/storage (`extension/src/shared/*.js`).

## 2) Permissions Inventory

- `storage`: persist user settings.
- `activeTab`: communicate with active tab context.
- `scripting`: fallback reinjection of content script for robust popup->tab messaging.
- `host_permissions`: `https://www.linkedin.com/*` only.

Least-privilege note: host scope is constrained to LinkedIn only.

## 3) Data Flow and Retention

- Accessed data: rendered LinkedIn job tile text/title/company/labels.
- Processing: entirely local in content script.
- Stored data: only filter preferences in `chrome.storage.sync`.
- Transmission: none off-device.
- Retention: until reset/uninstall.

## 4) Third-Party Dependencies

Runtime: none (all extension logic is vanilla JS).
Dev/tooling:

- eslint, prettier
- vitest
- playwright
  Risk: dev-only and not shipped in extension package.

## 5) Performance Hotspots

- MutationObserver-triggered scanning on dynamic LinkedIn pages.
- Full loaded-tile rescans after mutations/settings updates.
- Message bursts during rapid toggle changes.

Mitigations implemented:

- Debounced scheduler and single-flight scan queue (`isScanning` + pending reason).
- Re-entrancy guard during DOM writes (`isApplyingCardState`).
- Removed badge DOM churn in filtered state.

## 6) Known Gaps vs Chrome Web Store Requirements

Addressed in this release:

- Policy docs: privacy, terms, security, support.
- CI, lint, unit/e2e smoke tests, build/package scripts.

Remaining operator tasks:

- Final screenshot capture for listing.
- Chrome Developer Dashboard form population.
