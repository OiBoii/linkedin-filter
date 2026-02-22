(function initLinkedInFilterParsers(globalScope) {
  const SHARED_NAMESPACE = "LinkedInFilterShared";
  const shared = globalScope[SHARED_NAMESPACE] || {};

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function parseApplicants(text) {
    if (!text) {
      return null;
    }

    const normalized = normalizeText(text);
    const applicantsContext = /(applicant|application|clicked apply|people clicked apply)/.test(normalized);
    if (!applicantsContext) {
      return null;
    }

    const specificPatterns = [
      /over\s+([\d,.]+)\s+(?:people\s+)?clicked apply/,
      /([\d,.]+)\+?\s+(?:people\s+)?clicked apply/,
      /([\d,.]+)\+?\s+(?:applicants?|applications?)/,
      /(?:applicants?|applications?)\s*[:\-]?\s*([\d,.]+)\+?/
    ];

    for (const pattern of specificPatterns) {
      const match = normalized.match(pattern);
      if (!match || !match[1]) {
        continue;
      }
      const parsed = parseInt(match[1].replace(/,/g, ""), 10);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return null;
  }

  function normalizeTime(text) {
    if (!text) {
      return null;
    }

    const normalized = normalizeText(text);
    if (!normalized) {
      return null;
    }

    if (/just now|moments? ago|now\b/.test(normalized)) {
      return {
        value: 0,
        unit: "minute",
        totalMinutes: 0,
        totalDays: 0
      };
    }

    const agoMatch = normalized.match(/(?:reposted\s+)?(\d+)\s*(minute|minutes|min|mins|m|hour|hours|hr|hrs|h|day|days|d|week|weeks|wk|wks|month|months|mo|year|years|yr|yrs|y)\s+ago/);
    if (!agoMatch) {
      return null;
    }

    const value = parseInt(agoMatch[1], 10);
    const unitRaw = agoMatch[2];

    if (!Number.isFinite(value)) {
      return null;
    }

    let totalMinutes = 0;

    if (unitRaw === "minute" || unitRaw === "minutes" || unitRaw === "min" || unitRaw === "mins" || unitRaw === "m") {
      totalMinutes = value;
    } else if (unitRaw === "hour" || unitRaw === "hours" || unitRaw === "hr" || unitRaw === "hrs" || unitRaw === "h") {
      totalMinutes = value * 60;
    } else if (unitRaw === "day" || unitRaw === "days" || unitRaw === "d") {
      totalMinutes = value * 60 * 24;
    } else if (unitRaw === "week" || unitRaw === "weeks" || unitRaw === "wk" || unitRaw === "wks") {
      totalMinutes = value * 60 * 24 * 7;
    } else if (unitRaw === "month" || unitRaw === "months" || unitRaw === "mo") {
      totalMinutes = value * 60 * 24 * 30;
    } else if (unitRaw === "year" || unitRaw === "years" || unitRaw === "yr" || unitRaw === "yrs" || unitRaw === "y") {
      totalMinutes = value * 60 * 24 * 365;
    } else {
      return null;
    }

    let displayUnit = "day";
    if (totalMinutes < 60) {
      displayUnit = "minute";
    } else if (totalMinutes < 1440) {
      displayUnit = "hour";
    }

    let displayValue = value;
    if (displayUnit === "hour") {
      displayValue = Math.round(totalMinutes / 60);
    } else if (displayUnit === "day") {
      displayValue = Math.round(totalMinutes / 1440);
    }

    return {
      value: displayValue,
      unit: displayUnit,
      totalMinutes,
      totalDays: totalMinutes / 1440
    };
  }

  function isPromotedOrSponsored(text) {
    const normalized = normalizeText(text);
    return /\b(promoted|sponsored)\b/.test(normalized);
  }

  function isReposted(text) {
    const normalized = normalizeText(text);
    return /\bre[-\s]?posted\b/.test(normalized);
  }

  shared.normalizeText = normalizeText;
  shared.parseApplicants = parseApplicants;
  shared.normalizeTime = normalizeTime;
  shared.isPromotedOrSponsored = isPromotedOrSponsored;
  shared.isReposted = isReposted;

  globalScope[SHARED_NAMESPACE] = shared;
})(typeof self !== "undefined" ? self : window);
