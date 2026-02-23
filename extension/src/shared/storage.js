(function initLinkedInFilterStorage(globalScope) {
  const SHARED_NAMESPACE = 'LinkedInFilterShared';
  const shared = globalScope[SHARED_NAMESPACE] || {};

  function cloneDefaults() {
    return JSON.parse(JSON.stringify(shared.DEFAULT_SETTINGS));
  }

  function sanitizeNumber(value, fallbackNull) {
    if (value === null || value === undefined || value === '') {
      return fallbackNull ? null : undefined;
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return fallbackNull ? null : undefined;
    }
    return numeric;
  }

  function sanitizeToggleList(value) {
    if (!Array.isArray(value)) {
      return [];
    }

    const seen = new Set();
    const out = [];

    value.forEach((item) => {
      const candidate = typeof item === 'string' ? { value: item, enabled: true } : item;
      const clean = String(candidate && candidate.value ? candidate.value : '')
        .trim()
        .replace(/\s+/g, ' ');
      if (!clean) {
        return;
      }

      const key = clean.toLowerCase();
      if (seen.has(key)) {
        return;
      }
      seen.add(key);

      out.push({
        value: clean,
        enabled: candidate && candidate.enabled !== undefined ? Boolean(candidate.enabled) : true
      });
    });

    return out;
  }

  function sanitizeSettings(candidate) {
    const defaults = cloneDefaults();
    const safe = Object.assign({}, defaults, candidate || {});

    safe.enableFiltering = Boolean(safe.enableFiltering);

    safe.titleIncludeEnabled = Boolean(safe.titleIncludeEnabled);
    safe.titleIncludeKeywords = sanitizeToggleList(safe.titleIncludeKeywords);

    safe.titleExcludeEnabled = Boolean(safe.titleExcludeEnabled);
    safe.titleExcludeKeywords = sanitizeToggleList(safe.titleExcludeKeywords);

    safe.blockedCompaniesEnabled = Boolean(safe.blockedCompaniesEnabled);
    safe.blockedCompanies = sanitizeToggleList(safe.blockedCompanies);

    safe.labelFiltersEnabled =
      safe.labelFiltersEnabled === undefined ? true : Boolean(safe.labelFiltersEnabled);

    // Backward compatibility with previous mode fields.
    if (safe.labelEarlyApplicantMode !== undefined && safe.requireEarlyApplicant === undefined) {
      safe.requireEarlyApplicant = safe.labelEarlyApplicantMode === 'include';
    }
    if (
      safe.labelActivelyReviewingMode !== undefined &&
      safe.requireActivelyReviewing === undefined
    ) {
      safe.requireActivelyReviewing = safe.labelActivelyReviewingMode === 'include';
    }
    if (safe.labelPromotedMode !== undefined && safe.hidePromoted === undefined) {
      safe.hidePromoted = safe.labelPromotedMode !== 'include';
    }
    if (safe.labelWorksHereMode !== undefined && safe.hideWorksHere === undefined) {
      safe.hideWorksHere = safe.labelWorksHereMode === 'exclude';
    }

    safe.requireEarlyApplicant = Boolean(safe.requireEarlyApplicant);
    safe.requireActivelyReviewing = Boolean(safe.requireActivelyReviewing);
    safe.hidePromoted = Boolean(safe.hidePromoted);
    safe.hideWorksHere = Boolean(safe.hideWorksHere);
    safe.debugMode = Boolean(safe.debugMode);

    const postedHours = sanitizeNumber(safe.maxPostedHours, true);
    safe.maxPostedHours =
      Number.isFinite(postedHours) && postedHours > 0 ? Math.floor(postedHours) : null;
    safe.applyPostedHoursToUrl = Boolean(safe.applyPostedHoursToUrl);

    safe.filterMode = safe.filterMode === 'dim' ? 'dim' : 'hide';

    return safe;
  }

  function getSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get([shared.STORAGE_KEY], (result) => {
        if (chrome.runtime.lastError) {
          resolve(cloneDefaults());
          return;
        }
        resolve(sanitizeSettings(result[shared.STORAGE_KEY]));
      });
    });
  }

  function setSettings(nextSettings) {
    const sanitized = sanitizeSettings(nextSettings);
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set({ [shared.STORAGE_KEY]: sanitized }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        resolve(sanitized);
      });
    });
  }

  async function updateSettings(partial) {
    const current = await getSettings();
    const merged = Object.assign({}, current, partial || {});
    return setSettings(merged);
  }

  async function resetSettings() {
    return setSettings(cloneDefaults());
  }

  async function ensureDefaults() {
    const current = await getSettings();
    return setSettings(current);
  }

  shared.storage = {
    getSettings,
    setSettings,
    updateSettings,
    resetSettings,
    ensureDefaults,
    sanitizeSettings,
    cloneDefaults
  };

  globalScope[SHARED_NAMESPACE] = shared;
})(typeof self !== 'undefined' ? self : window);
