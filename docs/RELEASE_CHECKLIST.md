# Release Checklist (inRole)

- [ ] Update version in `extension/manifest.json`.
- [ ] Update `CHANGELOG.md`.
- [ ] Run `npm run ci`.
- [ ] Build with `npm run build`.
- [ ] Create upload ZIP with `npm run package`.
- [ ] Validate fresh install in Chrome.
- [ ] Validate update path from prior unpacked version.
- [ ] Validate uninstall removes extension storage.
- [ ] Upload ZIP to Chrome Developer Dashboard.
- [ ] Populate store listing and policy fields from `docs/STORE_LISTING_DRAFT.md`.
