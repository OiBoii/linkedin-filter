import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import vm from 'node:vm';

function loadSharedParsers() {
  const context = { self: {}, window: {}, console };
  vm.createContext(context);
  const src = fs.readFileSync('extension/src/shared/parsers.js', 'utf8');
  vm.runInContext(src, context);
  return context.self.LinkedInFilterShared || context.window.LinkedInFilterShared;
}

describe('shared parsers', () => {
  const shared = loadSharedParsers();

  it('parses applicant counts', () => {
    expect(shared.parseApplicants('Over 100 people clicked apply')).toBe(100);
    expect(shared.parseApplicants('1,346 applicants')).toBe(1346);
  });

  it('detects promoted/sponsored', () => {
    expect(shared.isPromotedOrSponsored('Promoted by hirer')).toBe(true);
    expect(shared.isPromotedOrSponsored('Regular listing')).toBe(false);
  });

  it('normalizes time values', () => {
    const t = shared.normalizeTime('Reposted 2 weeks ago');
    expect(t).not.toBeNull();
    expect(t.totalDays).toBeGreaterThanOrEqual(14);
  });

  it('handles empty input', () => {
    expect(shared.parseApplicants('')).toBeNull();
    expect(shared.normalizeTime('')).toBeNull();
  });
});
