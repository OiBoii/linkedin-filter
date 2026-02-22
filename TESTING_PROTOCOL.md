# LinkedIn Filter Testing Protocol

## Goal
Capture exactly why each visible job tile was shown, dimmed, or hidden so filter logic issues can be diagnosed quickly.

## Setup
1. Open a LinkedIn jobs search results page.
2. Open extension popup.
3. In `Diagnostics`, enable the diagnostics toggle.
4. Keep your filter setup as-is for the scenario you want to test.

## Run One Test Cycle
1. Scroll the jobs list so target cards are loaded.
2. Click `Capture report` in `Diagnostics`.
3. Click `Copy report`.
4. Paste into an issue/comment along with:
   - Search URL.
   - What you expected to happen.
   - Which cards looked wrong.

## What The Report Contains
- Scan metadata: reason, timestamp, URL, counts.
- Active filters snapshot at scan time.
- Per-card results:
  - Title and company.
  - `pass=true/false`.
  - Final action (`show`, `dim`, `hide`).
  - Exact rejection reasons (e.g. `include:no-match`, `label:promoted`).
  - Matched tokens (e.g. `exclude:senior`, `company:jobgether`).
  - Label flags detected on tile (`early`, `activelyReviewing`, `promoted`, `worksHere`).

## Toggle Off / Cleanup
- Turn diagnostics toggle OFF to stop logging.
- Click `Clear` to remove current report from memory.
- Optional cleanup after validation: comment out the `DEBUG TOOLING` section in `extension/src/popup.html`.

## Repro Matrix (Recommended)
Run these scenarios independently and capture one report each:
1. Include-only roles enabled.
2. Exclude-only roles enabled.
3. Company exclusions enabled.
4. Label filters enabled one-by-one.
5. Combined filters (all enabled).
6. Main toggle OFF (sanity check: all cards should pass).
