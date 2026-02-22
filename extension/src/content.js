(function runLinkedInJobFilter(globalScope) {
  const shared = globalScope.LinkedInFilterShared;
  if (!shared) {
    return;
  }

  const {
    DEFAULT_SETTINGS,
    MESSAGE_TYPES,
    normalizeText,
    isPromotedOrSponsored
  } = shared;

  let settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  let observer = null;
  let scanTimer = null;
  let latestHref = location.href;
  let latestStats = {
    processed: 0,
    filtered: 0,
    hidden: 0,
    timestamp: Date.now()
  };
  let latestDebugReport = null;

  const CARD_ROOT_SELECTORS = [
    "li.jobs-search-results__list-item",
    "div[data-job-id]",
    "div[data-occludable-job-id]",
    ".job-card-container"
  ];

  const TITLE_SELECTORS = [
    "a.job-card-list__title",
    "a.job-card-container__link",
    "a.job-card-container__title",
    "a[href*='/jobs/view/']",
    ".artdeco-entity-lockup__title a"
  ];

  const COMPANY_SELECTORS = [
    ".job-card-container__company-name",
    ".artdeco-entity-lockup__subtitle",
    ".job-card-list__subtitle",
    ".base-search-card__subtitle"
  ];

  function safeText(element) {
    return element && typeof element.textContent === "string" ? element.textContent.trim() : "";
  }

  function firstText(card, selectors) {
    for (const selector of selectors) {
      const node = card.querySelector(selector);
      const text = safeText(node);
      if (text) {
        return text;
      }
    }
    return "";
  }

  function normalizeCardRoot(node) {
    if (!(node instanceof HTMLElement)) {
      return null;
    }
    return node.closest("li.jobs-search-results__list-item, div[data-job-id], div[data-occludable-job-id], .job-card-container");
  }

  function getCardIdentity(card) {
    if (!(card instanceof HTMLElement)) {
      return "";
    }

    const dataJobId = card.getAttribute("data-job-id") || card.getAttribute("data-occludable-job-id");
    if (dataJobId) {
      return `job:${dataJobId}`;
    }

    const link = card.querySelector("a[href*='/jobs/view/']");
    const href = link ? link.getAttribute("href") || "" : "";
    const idMatch = href.match(/\/jobs\/view\/(\d+)/);
    if (idMatch && idMatch[1]) {
      return `job:${idMatch[1]}`;
    }

    const title = firstText(card, TITLE_SELECTORS);
    const company = firstText(card, COMPANY_SELECTORS);
    if (title || company) {
      return `fallback:${normalizeText(`${title} ${company}`)}`;
    }

    return "";
  }

  function getCandidateCards() {
    const cards = [];
    const seenNodes = new Set();
    const seenIdentities = new Set();

    const collect = (node) => {
      const root = normalizeCardRoot(node);
      if (!(root instanceof HTMLElement) || seenNodes.has(root)) {
        return;
      }

      const identity = getCardIdentity(root);
      if (identity && seenIdentities.has(identity)) {
        return;
      }

      seenNodes.add(root);
      if (identity) {
        seenIdentities.add(identity);
      }
      cards.push(root);
    };

    for (const selector of CARD_ROOT_SELECTORS) {
      document.querySelectorAll(selector).forEach(collect);
    }

    document.querySelectorAll("a[href*='/jobs/view/']").forEach((link) => {
      collect(link);
    });

    return cards.filter((card) => safeText(card).length > 0);
  }

  function getCardsForScan(cards) {
    // Apply rules to all currently loaded tiles, not only viewport-adjacent ones.
    return cards;
  }

  function normalizeKeyword(value) {
    return normalizeText(value).replace(/\s+/g, " ").trim();
  }

  function toWords(value) {
    return normalizeKeyword(value)
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  function getEnabledValues(list) {
    if (!Array.isArray(list)) {
      return [];
    }

    const out = [];
    for (const item of list) {
      if (typeof item === "string") {
        const legacy = normalizeKeyword(item);
        if (legacy) {
          out.push(legacy);
        }
        continue;
      }
      if (!item || item.enabled === false) {
        continue;
      }
      const value = normalizeKeyword(item.value);
      if (value) {
        out.push(value);
      }
    }
    return out;
  }

  function phraseMatchesWords(phraseWords, titleWords) {
    if (!phraseWords.length || !titleWords.length || phraseWords.length > titleWords.length) {
      return false;
    }

    for (let start = 0; start <= titleWords.length - phraseWords.length; start += 1) {
      let ok = true;
      for (let i = 0; i < phraseWords.length; i += 1) {
        const queryWord = phraseWords[i];
        const titleWord = titleWords[start + i];
        if (!titleWord.startsWith(queryWord)) {
          ok = false;
          break;
        }
      }
      if (ok) {
        return true;
      }
    }

    return false;
  }

  function findMatchedTitlePhrases(titleText, phrases) {
    if (!titleText || !Array.isArray(phrases) || !phrases.length) {
      return [];
    }

    const titleWords = toWords(titleText);
    if (!titleWords.length) {
      return [];
    }

    const matches = [];
    phrases.forEach((phrase) => {
      const phraseWords = toWords(phrase);
      if (!phraseWords.length) {
        return;
      }
      if (phraseMatchesWords(phraseWords, titleWords)) {
        matches.push(phrase);
      }
    });
    return matches;
  }

  function findMatchedCompanyTokens(companyText, tokens) {
    const normalized = normalizeKeyword(companyText);
    if (!normalized || !Array.isArray(tokens) || !tokens.length) {
      return [];
    }

    const matches = [];
    tokens.forEach((token) => {
      const clean = normalizeKeyword(token);
      if (clean && normalized.includes(clean)) {
        matches.push(clean);
      }
    });
    return matches;
  }

  function getActiveFiltersSnapshot() {
    return {
      enableFiltering: settings.enableFiltering,
      filterMode: settings.filterMode,
      titleIncludeEnabled: settings.titleIncludeEnabled,
      titleIncludeKeywords: getEnabledValues(settings.titleIncludeKeywords),
      titleExcludeEnabled: settings.titleExcludeEnabled,
      titleExcludeKeywords: getEnabledValues(settings.titleExcludeKeywords),
      blockedCompaniesEnabled: settings.blockedCompaniesEnabled,
      blockedCompanies: getEnabledValues(settings.blockedCompanies),
      labelFiltersEnabled: settings.labelFiltersEnabled,
      requireEarlyApplicant: settings.requireEarlyApplicant,
      requireActivelyReviewing: settings.requireActivelyReviewing,
      hidePromoted: settings.hidePromoted,
      requireWorksHere: settings.hideWorksHere,
      hideWorksHere: settings.hideWorksHere,
      debugMode: settings.debugMode
    };
  }

  function parseCard(card) {
    let title = firstText(card, TITLE_SELECTORS);
    let company = firstText(card, COMPANY_SELECTORS);
    const rawCardText = safeText(card);
    const cardText = normalizeText(rawCardText);
    const lines = rawCardText
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (title) {
      title = title.replace(/\s+with verification$/i, "").trim();
      title = title.replace(/\s+/g, " ").trim();

      // LinkedIn can duplicate title text in accessibility spans.
      const duplicate = title.match(/^(.{4,}?)\1$/);
      if (duplicate && duplicate[1]) {
        title = duplicate[1].trim();
      }
    }

    if (!title && lines.length > 0) {
      title = lines[0];
    }

    // Fallback for LinkedIn variants where company selector is missing.
    if (!company) {
      if (lines.length > 1) {
        for (let i = 0; i < lines.length; i += 1) {
          const line = lines[i];
          if (title && line.toLowerCase() === title.toLowerCase() && i + 1 < lines.length) {
            company = lines[i + 1];
            break;
          }
        }
        if (!company) {
          company = lines[1];
        }
      }
    }

    return {
      title,
      company,
      cardText,
      hasEarlyApplicant: /\bearly applicant\b/.test(cardText),
      hasActivelyReviewing: /\bactively reviewing applicants?\b/.test(cardText),
      hasPromoted: isPromotedOrSponsored(cardText) || /\bpromoted by\b/.test(cardText),
      hasWorksHere: /\bworks? here\b/.test(cardText)
    };
  }

  function evaluateFilters(parsed) {
    const reasons = [];
    const matched = [];

    if (!settings.enableFiltering) {
      return { pass: true, reasons, matched };
    }

    const titleTarget = parsed.title || parsed.cardText;
    const includeKeywords = getEnabledValues(settings.titleIncludeKeywords);
    if (settings.titleIncludeEnabled && includeKeywords.length) {
      const includeMatches = findMatchedTitlePhrases(titleTarget, includeKeywords);
      if (!includeMatches.length) {
        reasons.push("include:no-match");
      } else {
        matched.push(...includeMatches.map((token) => `include:${token}`));
      }
    }

    const excludeKeywords = getEnabledValues(settings.titleExcludeKeywords);
    if (settings.titleExcludeEnabled && excludeKeywords.length) {
      const excludeMatches = findMatchedTitlePhrases(titleTarget, excludeKeywords);
      if (excludeMatches.length) {
        reasons.push("exclude:matched");
        matched.push(...excludeMatches.map((token) => `exclude:${token}`));
      }
    }

    if (settings.blockedCompaniesEnabled) {
      const blockedValues = getEnabledValues(settings.blockedCompanies);
      const companyMatches = findMatchedCompanyTokens(parsed.company, blockedValues);
      const tileMatches = findMatchedCompanyTokens(parsed.cardText, blockedValues);
      const blockedMatches = [...new Set([...companyMatches, ...tileMatches])];
      if (blockedMatches.length) {
        reasons.push("company:blocked");
        matched.push(...blockedMatches.map((token) => `company:${token}`));
      }
    }

    if (settings.labelFiltersEnabled) {
      if (settings.requireEarlyApplicant && !parsed.hasEarlyApplicant) {
        reasons.push("label:missing-early-applicant");
      }

      if (settings.requireActivelyReviewing && !parsed.hasActivelyReviewing) {
        reasons.push("label:missing-actively-reviewing");
      }

      if (settings.hidePromoted && parsed.hasPromoted) {
        reasons.push("label:promoted");
      }

      if (settings.hideWorksHere && !parsed.hasWorksHere) {
        reasons.push("label:missing-works-here");
      }
    }

    return {
      pass: reasons.length === 0,
      reasons,
      matched
    };
  }

  function ensureStyles() {
    if (document.getElementById("linkedin-filter-style")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "linkedin-filter-style";
    style.textContent = `
      .linkedin-filter-dimmed {
        opacity: 0.32 !important;
        transition: opacity 0.2s ease;
      }
      .linkedin-filter-hidden {
        display: none !important;
      }
      .linkedin-filter-badge {
        display: inline-block;
        margin-left: 6px;
        padding: 2px 6px;
        font-size: 10px;
        line-height: 1.4;
        border-radius: 999px;
        background: #f3f6f8;
        color: #5e6a73;
        border: 1px solid #d8dfe3;
        vertical-align: middle;
      }
    `;

    document.documentElement.appendChild(style);
  }

  function addFilteredBadge(card) {
    let badge = card.querySelector(".linkedin-filter-badge");
    if (badge) {
      return;
    }

    const anchor = card.querySelector("a.job-card-list__title, a.job-card-container__link, a[href*='/jobs/view/']");
    if (!(anchor instanceof HTMLElement)) {
      return;
    }

    badge = document.createElement("span");
    badge.className = "linkedin-filter-badge";
    badge.textContent = "Filtered";
    anchor.insertAdjacentElement("afterend", badge);
  }

  function removeFilteredBadge(card) {
    const badge = card.querySelector(".linkedin-filter-badge");
    if (badge) {
      badge.remove();
    }
  }

  function applyCardState(card, passFilters) {
    if (!card.dataset.linkedinFilterOriginalDisplay) {
      card.dataset.linkedinFilterOriginalDisplay = card.style.display || "";
    }

    const listItem = card.closest("li.jobs-search-results__list-item");
    card.classList.remove("linkedin-filter-dimmed");
    card.classList.remove("linkedin-filter-hidden");
    if (listItem) {
      listItem.classList.remove("linkedin-filter-hidden");
    }
    removeFilteredBadge(card);

    if (passFilters || !settings.enableFiltering) {
      card.style.display = card.dataset.linkedinFilterOriginalDisplay || "";
      return;
    }

    if (settings.filterMode === "dim") {
      card.style.display = card.dataset.linkedinFilterOriginalDisplay || "";
      card.classList.add("linkedin-filter-dimmed");
      addFilteredBadge(card);
      return;
    }

    card.classList.add("linkedin-filter-hidden");
    if (listItem) {
      listItem.classList.add("linkedin-filter-hidden");
    }
    card.style.display = "none";
  }

  function getDesiredTprValue() {
    if (!settings.maxPostedHours || settings.maxPostedHours <= 0) {
      return null;
    }
    return `r${Math.floor(settings.maxPostedHours * 3600)}`;
  }

  function applyPostedHoursUrlFilter(force, allowManual) {
    const shouldApply = settings.applyPostedHoursToUrl || allowManual;
    if (!shouldApply) {
      return false;
    }

    const desired = getDesiredTprValue();
    if (!desired) {
      return false;
    }

    let url;
    try {
      url = new URL(location.href);
    } catch (_error) {
      return false;
    }

    if (!url.pathname.includes("/jobs/")) {
      return false;
    }

    const currentF = url.searchParams.get("f_TPR");
    const currentLegacy = url.searchParams.get("TPR");

    if (!force && currentF === desired && !currentLegacy) {
      return false;
    }

    url.searchParams.delete("TPR");
    url.searchParams.set("f_TPR", desired);

    const next = url.toString();
    if (next === location.href) {
      return false;
    }

    location.assign(next);
    return true;
  }

  function performScan(scanReason, captureDetails) {
    try {
      ensureStyles();
      const cards = getCardsForScan(getCandidateCards());

      let filtered = 0;
      let hidden = 0;
      const shouldCaptureDetails = Boolean(captureDetails) || Boolean(settings.debugMode);
      const debugCards = shouldCaptureDetails ? [] : null;

      cards.forEach((card) => {
        const parsed = parseCard(card);
        const evaluation = evaluateFilters(parsed);
        const passFilters = evaluation.pass;

        if (!passFilters) {
          filtered += 1;
          if (settings.filterMode === "hide") {
            hidden += 1;
          }

        }

        applyCardState(card, passFilters);
        card.dataset.linkedinFilterFiltered = passFilters ? "0" : "1";

        if (shouldCaptureDetails) {
          const action = passFilters ? "show" : (settings.filterMode === "hide" ? "hide" : "dim");
          debugCards.push({
            title: parsed.title || "",
            company: parsed.company || "",
            pass: passFilters,
            action,
            reasons: evaluation.reasons,
            matched: evaluation.matched,
            hasEarlyApplicant: parsed.hasEarlyApplicant,
            hasActivelyReviewing: parsed.hasActivelyReviewing,
            hasPromoted: parsed.hasPromoted,
            hasWorksHere: parsed.hasWorksHere
          });
        }
      });

      latestStats = {
        processed: cards.length,
        filtered,
        hidden,
        timestamp: Date.now(),
        reason: scanReason || "auto"
      };

      if (shouldCaptureDetails) {
        latestDebugReport = {
          timestamp: Date.now(),
          href: location.href,
          reason: scanReason || "auto",
          stats: Object.assign({}, latestStats),
          activeFilters: getActiveFiltersSnapshot(),
          cards: debugCards || []
        };
      }
    } catch (error) {
      console.error("[LinkedInFilter] scan failure", error);
    }
  }

  function scheduleScan(reason) {
    if (scanTimer) {
      clearTimeout(scanTimer);
    }

    scanTimer = setTimeout(() => {
      performScan(reason, false);
      scanTimer = null;
    }, 250);
  }

  function startObserver() {
    if (observer) {
      observer.disconnect();
    }

    observer = new MutationObserver((mutations) => {
      if (mutations.some((m) => m.type === "childList")) {
        scheduleScan("mutation");
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false
    });
  }

  function watchUrlChanges() {
    setInterval(() => {
      if (location.href !== latestHref) {
        latestHref = location.href;
        scheduleScan("url-change");
      }
    }, 1000);
  }

  async function refreshSettings() {
    try {
      settings = await shared.storage.getSettings();
      if (applyPostedHoursUrlFilter(false, false)) {
        return;
      }
      scheduleScan("settings-refresh");
    } catch (error) {
      settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
      console.warn("[LinkedInFilter] Failed to refresh settings", error);
    }
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync" || !changes[shared.STORAGE_KEY]) {
      return;
    }

    settings = shared.storage.sanitizeSettings(changes[shared.STORAGE_KEY].newValue);
    if (applyPostedHoursUrlFilter(false, false)) {
      return;
    }
    scheduleScan("storage-change");
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || !message.type) {
      return;
    }

    if (message.type === MESSAGE_TYPES.SETTINGS_UPDATED) {
      if (message.settings) {
        settings = shared.storage.sanitizeSettings(message.settings);
        if (applyPostedHoursUrlFilter(false, false)) {
          sendResponse({ ok: true });
          return;
        }
        scheduleScan("settings-message");
        sendResponse({ ok: true });
        return;
      }
      refreshSettings().finally(() => sendResponse({ ok: true }));
      return true;
    }

    if (message.type === MESSAGE_TYPES.APPLY_POSTED_HOURS_URL) {
      const changed = applyPostedHoursUrlFilter(Boolean(message.force), Boolean(message.manual));
      if (!changed) {
        scheduleScan("apply-posted-hours-noop");
      }
      sendResponse({ ok: true, changed });
      return;
    }

    if (message.type === MESSAGE_TYPES.RESCAN) {
      scheduleScan("manual-rescan");
      sendResponse({ ok: true });
      return;
    }

    if (message.type === MESSAGE_TYPES.REQUEST_STATUS) {
      sendResponse({ ok: true, data: latestStats });
      return;
    }

    if (message.type === MESSAGE_TYPES.REQUEST_DEBUG_REPORT) {
      performScan("debug-report", true);
      sendResponse({
        ok: true,
        data: latestDebugReport || {
          timestamp: Date.now(),
          href: location.href,
          reason: "not-captured",
          stats: Object.assign({}, latestStats),
          activeFilters: getActiveFiltersSnapshot(),
          cards: []
        }
      });
      return;
    }

    if (message.type === MESSAGE_TYPES.CLEAR_DEBUG_REPORT) {
      latestDebugReport = null;
      sendResponse({ ok: true });
    }
  });

  async function init() {
    await refreshSettings();
    startObserver();
    watchUrlChanges();
    scheduleScan("init");
  }

  init().catch((error) => {
    console.error("[LinkedInFilter] init failed", error);
  });
})(typeof self !== "undefined" ? self : window);
