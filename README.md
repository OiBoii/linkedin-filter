# inRole (Chrome Extension, MV3)

inRole filters LinkedIn job listing tiles using local, user-defined rules.

## Core Capabilities
- Include role phrases (OR logic)
- Exclude role phrases
- Company exclusions
- Strict tile-label rules
- Filtered display mode: hide or dim
- URL posted-time filter (manual apply)

## Privacy
- No remote code
- No external network calls
- No data exfiltration
- Settings stored locally in `chrome.storage.sync`

## Install (Unpacked)
1. Open `chrome://extensions`
2. Enable Developer Mode
3. Click **Load unpacked**
4. Select the `extension/` folder

## Development
### Install
```bash
npm install
```

### Quality gates
```bash
npm run lint
npm run test:unit
npm run test:e2e
npm run build
```

### Package for upload
```bash
npm run package
```
Output ZIP: `dist/inrole-extension.zip`

## Project Layout
- `extension/` extension source
- `tests/` unit + e2e smoke tests
- `docs/` policy and store readiness docs
- `.github/workflows/ci.yml` CI pipeline
