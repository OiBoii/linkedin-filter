(function initLinkedInFilterConstants(globalScope) {
  const SHARED_NAMESPACE = 'LinkedInFilterShared';

  const DEFAULT_SETTINGS = Object.freeze({
    enableFiltering: true,

    titleIncludeEnabled: false,
    titleIncludeKeywords: [],

    titleExcludeEnabled: true,
    titleExcludeKeywords: [],

    blockedCompaniesEnabled: true,
    blockedCompanies: [],

    labelFiltersEnabled: true,
    requireEarlyApplicant: false,
    requireActivelyReviewing: false,
    hidePromoted: true,
    hideWorksHere: false,

    debugMode: false,

    maxPostedHours: null,
    applyPostedHoursToUrl: false,

    filterMode: 'hide'
  });

  const STORAGE_KEY = 'linkedinFilterSettingsV1';

  const MESSAGE_TYPES = Object.freeze({
    SETTINGS_UPDATED: 'LINKEDIN_FILTER_SETTINGS_UPDATED',
    REQUEST_STATUS: 'LINKEDIN_FILTER_REQUEST_STATUS',
    RESPONSE_STATUS: 'LINKEDIN_FILTER_RESPONSE_STATUS',
    RESCAN: 'LINKEDIN_FILTER_RESCAN',
    APPLY_POSTED_HOURS_URL: 'LINKEDIN_FILTER_APPLY_POSTED_HOURS_URL',
    REQUEST_DEBUG_REPORT: 'LINKEDIN_FILTER_REQUEST_DEBUG_REPORT',
    CLEAR_DEBUG_REPORT: 'LINKEDIN_FILTER_CLEAR_DEBUG_REPORT'
  });

  const shared = globalScope[SHARED_NAMESPACE] || {};
  shared.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
  shared.STORAGE_KEY = STORAGE_KEY;
  shared.MESSAGE_TYPES = MESSAGE_TYPES;
  globalScope[SHARED_NAMESPACE] = shared;
})(typeof self !== 'undefined' ? self : window);
