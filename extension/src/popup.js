(function initPopup(globalScope) {
  const shared = globalScope.LinkedInFilterShared;
  const { MESSAGE_TYPES } = shared;

  const elements = {
    enableFiltering: document.getElementById("enableFiltering"),

    titleIncludeEnabled: document.getElementById("titleIncludeEnabled"),
    titleIncludeInput: document.getElementById("titleIncludeInput"),
    addTitleIncludeBtn: document.getElementById("addTitleIncludeBtn"),
    titleIncludeList: document.getElementById("titleIncludeList"),

    titleExcludeEnabled: document.getElementById("titleExcludeEnabled"),
    titleExcludeInput: document.getElementById("titleExcludeInput"),
    addTitleExcludeBtn: document.getElementById("addTitleExcludeBtn"),
    titleExcludeList: document.getElementById("titleExcludeList"),
    titleConflictWarning: document.getElementById("titleConflictWarning"),

    blockedCompaniesEnabled: document.getElementById("blockedCompaniesEnabled"),
    blockedCompanyInput: document.getElementById("blockedCompanyInput"),
    addBlockedCompanyBtn: document.getElementById("addBlockedCompanyBtn"),
    blockedCompaniesList: document.getElementById("blockedCompaniesList"),

    labelFiltersEnabled: document.getElementById("labelFiltersEnabled"),
    requireEarlyApplicant: document.getElementById("requireEarlyApplicant"),
    requireActivelyReviewing: document.getElementById("requireActivelyReviewing"),
    hidePromoted: document.getElementById("hidePromoted"),
    hideWorksHere: document.getElementById("hideWorksHere"),
    labelStrictnessWarning: document.getElementById("labelStrictnessWarning"),

    maxPostedHours: document.getElementById("maxPostedHours"),
    applyPostedHoursNowBtn: document.getElementById("applyPostedHoursNowBtn"),

    displayHide: document.getElementById("displayHide"),
    displayDim: document.getElementById("displayDim"),

    resetBtn: document.getElementById("resetBtn"),
    resetModal: document.getElementById("resetModal"),
    cancelResetBtn: document.getElementById("cancelResetBtn"),
    confirmResetBtn: document.getElementById("confirmResetBtn")
  };

  let titleIncludeKeywords = [];
  let titleExcludeKeywords = [];
  let blockedCompanies = [];

  function parseOptionalInteger(value) {
    if (value === "" || value === null || value === undefined) {
      return null;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }
    return Math.floor(parsed);
  }

  function normalizeToken(value) {
    return String(value || "").trim().replace(/\s+/g, " ");
  }

  function renderTokenList(container, values, emptyText, listClass) {
    container.innerHTML = "";

    if (!values.length) {
      const empty = document.createElement("div");
      empty.className = "token-empty";
      empty.textContent = emptyText;
      container.appendChild(empty);
      return;
    }

    values.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "token-item";

      const label = document.createElement("label");
      label.className = "token-label";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "token-enabled";
      checkbox.dataset.listClass = listClass;
      checkbox.dataset.index = String(index);
      checkbox.checked = item.enabled !== false;

      const text = document.createElement("span");
      text.textContent = item.value;

      label.appendChild(checkbox);
      label.appendChild(text);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "ghost token-delete";
      removeBtn.dataset.listClass = listClass;
      removeBtn.dataset.index = String(index);
      removeBtn.textContent = "×";
      removeBtn.setAttribute("aria-label", `Delete ${item.value}`);

      row.appendChild(label);
      row.appendChild(removeBtn);
      container.appendChild(row);
    });
  }

  function toWords(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  function phraseContainedIn(containerPhrase, containedPhrase) {
    const containerWords = toWords(containerPhrase);
    const containedWords = toWords(containedPhrase);
    if (!containerWords.length || !containedWords.length || containedWords.length > containerWords.length) {
      return false;
    }

    for (let i = 0; i <= containerWords.length - containedWords.length; i += 1) {
      let ok = true;
      for (let j = 0; j < containedWords.length; j += 1) {
        if (!containerWords[i + j].startsWith(containedWords[j])) {
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

  function getEnabledTokens(list) {
    return (Array.isArray(list) ? list : [])
      .filter((item) => item && item.enabled !== false && normalizeToken(item.value))
      .map((item) => normalizeToken(item.value));
  }

  function updateConflictWarnings() {
    const includeEnabled = elements.titleIncludeEnabled.checked;
    const excludeEnabled = elements.titleExcludeEnabled.checked;
    const include = getEnabledTokens(titleIncludeKeywords);
    const exclude = getEnabledTokens(titleExcludeKeywords);

    const warnings = [];
    if (includeEnabled && excludeEnabled && include.length && exclude.length) {
      include.forEach((inc) => {
        exclude.forEach((exc) => {
          const incLc = inc.toLowerCase();
          const excLc = exc.toLowerCase();
          if (incLc === excLc) {
            warnings.push(`“${inc}” is in both include and exclude. Exclude wins.`);
            return;
          }
          const excInsideInc = phraseContainedIn(inc, exc);
          const incInsideExc = phraseContainedIn(exc, inc);
          if (excInsideInc && !incInsideExc) {
            warnings.push(`Exclude phrase “${exc}” is broader than include “${inc}”; many matching includes will be filtered out.`);
          } else if (incInsideExc && !excInsideInc) {
            warnings.push(`Exclude phrase “${exc}” overlaps include “${inc}”; some included jobs will still be filtered out.`);
          }
        });
      });
    }

    const deduped = [...new Set(warnings)].slice(0, 4);
    if (elements.titleConflictWarning) {
      if (deduped.length) {
        elements.titleConflictWarning.hidden = false;
        elements.titleConflictWarning.textContent = deduped.join(" ");
      } else {
        elements.titleConflictWarning.hidden = true;
        elements.titleConflictWarning.textContent = "";
      }
    }

    const strictRules = [
      elements.requireEarlyApplicant.checked,
      elements.requireActivelyReviewing.checked,
      elements.hidePromoted.checked,
      elements.hideWorksHere.checked
    ].filter(Boolean).length;

    const strictEnabled = elements.labelFiltersEnabled.checked;
    if (elements.labelStrictnessWarning) {
      if (strictEnabled && strictRules >= 2) {
        elements.labelStrictnessWarning.hidden = false;
        elements.labelStrictnessWarning.textContent = "Multiple strict label rules are enabled together. This can reduce visible jobs dramatically.";
      } else {
        elements.labelStrictnessWarning.hidden = true;
        elements.labelStrictnessWarning.textContent = "";
      }
    }
  }

  function renderAllLists() {
    renderTokenList(elements.titleIncludeList, titleIncludeKeywords, "No include role keywords yet.", "include");
    renderTokenList(elements.titleExcludeList, titleExcludeKeywords, "No excluded role keywords yet.", "exclude");
    renderTokenList(elements.blockedCompaniesList, blockedCompanies, "No excluded companies yet.", "company");
    updateConflictWarnings();
  }

  function updateSectionVisualStates() {
    const masterEnabled = elements.enableFiltering.checked;

    document.querySelectorAll("section.card[data-gate]").forEach((section) => {
      const gateId = section.getAttribute("data-gate");
      const gateControl = gateId ? elements[gateId] : null;
      const sectionEnabled = masterEnabled && gateControl && gateControl.checked;
      section.classList.toggle("is-disabled", !sectionEnabled);
    });

    [".card-display", ".card-time"].forEach((selector) => {
      const card = document.querySelector(selector);
      if (card) {
        card.classList.toggle("is-disabled", !masterEnabled);
      }
    });
  }

  function bindSettingsToUI(settings) {
    elements.enableFiltering.checked = settings.enableFiltering;

    elements.titleIncludeEnabled.checked = settings.titleIncludeEnabled;
    elements.titleExcludeEnabled.checked = settings.titleExcludeEnabled;
    elements.blockedCompaniesEnabled.checked = settings.blockedCompaniesEnabled;

    titleIncludeKeywords = Array.isArray(settings.titleIncludeKeywords) ? settings.titleIncludeKeywords.slice() : [];
    titleExcludeKeywords = Array.isArray(settings.titleExcludeKeywords) ? settings.titleExcludeKeywords.slice() : [];
    blockedCompanies = Array.isArray(settings.blockedCompanies) ? settings.blockedCompanies.slice() : [];
    renderAllLists();

    elements.labelFiltersEnabled.checked = settings.labelFiltersEnabled;
    elements.requireEarlyApplicant.checked = settings.requireEarlyApplicant;
    elements.requireActivelyReviewing.checked = settings.requireActivelyReviewing;
    elements.hidePromoted.checked = settings.hidePromoted;
    elements.hideWorksHere.checked = settings.hideWorksHere;

    elements.maxPostedHours.value = settings.maxPostedHours === null ? "" : String(settings.maxPostedHours);

    elements.displayHide.checked = settings.filterMode === "hide";
    elements.displayDim.checked = settings.filterMode === "dim";

    elements.titleIncludeInput.value = "";
    elements.titleExcludeInput.value = "";
    elements.blockedCompanyInput.value = "";

    setControlsEnabled(settings.enableFiltering);
    updateSectionVisualStates();
    updateConflictWarnings();
  }

  function readSettingsFromUI() {
    return {
      enableFiltering: elements.enableFiltering.checked,
      titleIncludeEnabled: elements.titleIncludeEnabled.checked,
      titleIncludeKeywords: titleIncludeKeywords.slice(),
      titleExcludeEnabled: elements.titleExcludeEnabled.checked,
      titleExcludeKeywords: titleExcludeKeywords.slice(),
      blockedCompaniesEnabled: elements.blockedCompaniesEnabled.checked,
      blockedCompanies: blockedCompanies.slice(),

      labelFiltersEnabled: elements.labelFiltersEnabled.checked,
      requireEarlyApplicant: elements.requireEarlyApplicant.checked,
      requireActivelyReviewing: elements.requireActivelyReviewing.checked,
      hidePromoted: elements.hidePromoted.checked,
      hideWorksHere: elements.hideWorksHere.checked,

      applyPostedHoursToUrl: false,
      maxPostedHours: parseOptionalInteger(elements.maxPostedHours.value),

      filterMode: elements.displayDim.checked ? "dim" : "hide"
    };
  }

  function setControlsEnabled(enabled) {
    const disabled = !enabled;
    [
      elements.titleIncludeEnabled,
      elements.titleIncludeInput,
      elements.addTitleIncludeBtn,
      elements.titleExcludeEnabled,
      elements.titleExcludeInput,
      elements.addTitleExcludeBtn,
      elements.blockedCompaniesEnabled,
      elements.blockedCompanyInput,
      elements.addBlockedCompanyBtn,
      elements.labelFiltersEnabled,
      elements.requireEarlyApplicant,
      elements.requireActivelyReviewing,
      elements.hidePromoted,
      elements.hideWorksHere,
      elements.maxPostedHours,
      elements.applyPostedHoursNowBtn,
      elements.displayHide,
      elements.displayDim
    ].forEach((node) => {
      node.disabled = disabled;
    });

    document.querySelectorAll(".token-enabled,.token-delete,.preset-btn").forEach((node) => {
      node.disabled = disabled;
    });
  }

  function addToken(list, raw) {
    const value = normalizeToken(raw);
    if (!value) {
      return false;
    }
    const exists = list.some((item) => normalizeToken(item.value).toLowerCase() === value.toLowerCase());
    if (exists) {
      return false;
    }
    list.push({ value, enabled: true });
    return true;
  }

  function resolveList(key) {
    if (key === "include") {
      return titleIncludeKeywords;
    }
    if (key === "exclude") {
      return titleExcludeKeywords;
    }
    if (key === "company") {
      return blockedCompanies;
    }
    return null;
  }

  function getActiveTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
          resolve(null);
          return;
        }
        resolve(tabs[0]);
      });
    });
  }

  function sendMessageToTab(tabId, message) {
    return new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, response: null });
          return;
        }
        resolve({ ok: true, response: response || null });
      });
    });
  }

  async function ensureContentScriptInjected(tabId) {
    if (!chrome.scripting || !tabId) {
      return false;
    }

    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: [
          "src/shared/constants.js",
          "src/shared/parsers.js",
          "src/shared/storage.js",
          "src/content.js"
        ]
      });
      return true;
    } catch (_error) {
      return false;
    }
  }

  async function pingContentScript(message) {
    const tab = await getActiveTab();
    if (!tab || !tab.id || !tab.url || !tab.url.includes("linkedin.com")) {
      return null;
    }

    const firstAttempt = await sendMessageToTab(tab.id, message);
    if (firstAttempt.ok) {
      return firstAttempt.response;
    }

    const injected = await ensureContentScriptInjected(tab.id);
    if (!injected) {
      return null;
    }

    const secondAttempt = await sendMessageToTab(tab.id, message);
    return secondAttempt.ok ? secondAttempt.response : null;
  }

  async function applySettings() {
    const partial = readSettingsFromUI();
    const saved = await shared.storage.updateSettings(partial);
    bindSettingsToUI(saved);
    await pingContentScript({ type: MESSAGE_TYPES.SETTINGS_UPDATED, settings: saved });
  }

  async function addAndSave(list, input) {
    if (!addToken(list, input.value)) {
      input.value = "";
      input.focus();
      return;
    }
    renderAllLists();
    await applySettings();
    input.value = "";
    input.focus();
  }

  function wireListContainer(container) {
    container.addEventListener("change", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.classList.contains("token-enabled")) {
        return;
      }
      const list = resolveList(target.dataset.listClass);
      if (!list) {
        return;
      }
      const index = Number(target.dataset.index);
      if (!Number.isInteger(index) || index < 0 || index >= list.length) {
        return;
      }
      list[index] = Object.assign({}, list[index], { enabled: target.checked });
      await applySettings();
    });

    container.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || !target.classList.contains("token-delete")) {
        return;
      }
      const list = resolveList(target.dataset.listClass);
      if (!list) {
        return;
      }
      const index = Number(target.dataset.index);
      if (!Number.isInteger(index) || index < 0 || index >= list.length) {
        return;
      }
      list.splice(index, 1);
      renderAllLists();
      await applySettings();
    });
  }

  function openResetModal() {
    elements.resetModal.classList.add("open");
    elements.resetModal.setAttribute("aria-hidden", "false");
  }

  function closeResetModal() {
    elements.resetModal.classList.remove("open");
    elements.resetModal.setAttribute("aria-hidden", "true");
  }

  function addEventListeners() {
    const controls = [
      elements.enableFiltering,
      elements.titleIncludeEnabled,
      elements.titleExcludeEnabled,
      elements.blockedCompaniesEnabled,
      elements.labelFiltersEnabled,
      elements.requireEarlyApplicant,
      elements.requireActivelyReviewing,
      elements.hidePromoted,
      elements.hideWorksHere,
      elements.maxPostedHours,
      elements.displayHide,
      elements.displayDim
    ];

    controls.forEach((node) => {
      node.addEventListener("change", async () => {
        if (node === elements.enableFiltering) {
          setControlsEnabled(elements.enableFiltering.checked);
        }
        updateSectionVisualStates();
        updateConflictWarnings();
        await applySettings();
      });
    });

    elements.addTitleIncludeBtn.addEventListener("click", () => addAndSave(titleIncludeKeywords, elements.titleIncludeInput));
    elements.addTitleExcludeBtn.addEventListener("click", () => addAndSave(titleExcludeKeywords, elements.titleExcludeInput));
    elements.addBlockedCompanyBtn.addEventListener("click", () => addAndSave(blockedCompanies, elements.blockedCompanyInput));

    [elements.titleIncludeInput, elements.titleExcludeInput, elements.blockedCompanyInput].forEach((input) => {
      input.addEventListener("keydown", (event) => {
        if (event.key !== "Enter") {
          return;
        }
        event.preventDefault();
        if (input === elements.titleIncludeInput) {
          elements.addTitleIncludeBtn.click();
        } else if (input === elements.titleExcludeInput) {
          elements.addTitleExcludeBtn.click();
        } else {
          elements.addBlockedCompanyBtn.click();
        }
      });
    });

    wireListContainer(elements.titleIncludeList);
    wireListContainer(elements.titleExcludeList);
    wireListContainer(elements.blockedCompaniesList);

    document.querySelectorAll(".help-tip-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const helpId = button.getAttribute("data-help-id");
        if (!helpId) {
          return;
        }
        const panel = document.getElementById(helpId);
        if (!panel) {
          return;
        }
        const open = panel.classList.toggle("open");
        button.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });

    document.querySelectorAll(".preset-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const hours = Number(button.getAttribute("data-hours"));
        if (!Number.isFinite(hours) || hours <= 0) {
          return;
        }
        elements.maxPostedHours.value = String(hours);
        await applySettings();
      });
    });

    elements.applyPostedHoursNowBtn.addEventListener("click", async () => {
      await applySettings();
      await pingContentScript({ type: MESSAGE_TYPES.APPLY_POSTED_HOURS_URL, force: true, manual: true });
    });

    elements.resetBtn.addEventListener("click", openResetModal);
    elements.cancelResetBtn.addEventListener("click", closeResetModal);

    elements.confirmResetBtn.addEventListener("click", async () => {
      const defaults = await shared.storage.resetSettings();
      bindSettingsToUI(defaults);
      closeResetModal();
      await pingContentScript({ type: MESSAGE_TYPES.SETTINGS_UPDATED, settings: defaults });
    });

    elements.resetModal.addEventListener("click", (event) => {
      if (event.target === elements.resetModal) {
        closeResetModal();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && elements.resetModal.classList.contains("open")) {
        closeResetModal();
      }
    });
  }

  async function init() {
    try {
      const settings = await shared.storage.getSettings();
      bindSettingsToUI(settings);
      addEventListeners();
    } catch (error) {
      console.error("[inRole] Popup init failed", error);
    }
  }

  init();
})(typeof self !== "undefined" ? self : window);
