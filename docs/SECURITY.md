# Security (inRole)

## Threat Model Summary

Primary risk areas:

- DOM volatility and race conditions on LinkedIn SPA pages.
- Over-broad permissions.
- Unsafe DOM operations.

## Mitigations

- MV3 service worker and static packaged scripts only.
- No `eval`, no remote script loading, no dynamic code fetch.
- Content script uses text extraction; no untrusted HTML injection.
- Host permissions limited to LinkedIn only.
- MutationObserver scan controls to reduce runaway loops.

## Permissions Rationale

- `storage`: persist user filter settings.
- `activeTab`: interact with the active page context.
- `scripting`: content-script reinjection fallback for robust messaging on active tab.
- `host_permissions`: `https://www.linkedin.com/*` required because extension operates only on LinkedIn jobs pages.

## Vulnerability Reporting

Please report security issues privately via support channel in `docs/SUPPORT.md` with:

- Reproduction steps
- Browser version
- Extension version
- Impact assessment
