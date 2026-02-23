import { describe, it, expect } from 'vitest';

function toWords(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function phraseMatchesWords(phraseWords, titleWords) {
  if (!phraseWords.length || !titleWords.length || phraseWords.length > titleWords.length) return false;
  for (let start = 0; start <= titleWords.length - phraseWords.length; start += 1) {
    let ok = true;
    for (let i = 0; i < phraseWords.length; i += 1) {
      if (!titleWords[start + i].startsWith(phraseWords[i])) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

describe('title phrase matching semantics', () => {
  it('matches phrase prefixes with boundaries', () => {
    expect(phraseMatchesWords(toWords('solution engineer'), toWords('Solution Engineering Lead'))).toBe(true);
  });

  it('does not match random substrings inside words', () => {
    expect(phraseMatchesWords(toWords('ui'), toWords('Building Engineer'))).toBe(false);
  });

  it('matches single word include', () => {
    expect(phraseMatchesWords(toWords('ux'), toWords('Senior UX Designer'))).toBe(true);
  });
});
