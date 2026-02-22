importScripts("./shared/constants.js", "./shared/storage.js");

const shared = self.LinkedInFilterShared;

async function initializeDefaults() {
  try {
    await shared.storage.ensureDefaults();
  } catch (error) {
    console.error("[LinkedInFilter] Failed to initialize defaults", error);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  initializeDefaults();
});

chrome.runtime.onStartup.addListener(() => {
  initializeDefaults();
});
