import { describe, expect, it } from 'vitest';
import { footerColumns } from './footer';
import { navGroups } from './nav';
import { promoVariant } from './promo';
import { cloudPromotionEnabled, hiddenMarketingPath } from './visibility';

describe('temporary Cloud visibility', () => {
  it('hides promotion without changing routes', () => {
    expect(cloudPromotionEnabled).toBe(false);
    expect(navGroups.some((group) => group.id === 'cloud')).toBe(false);
    expect(footerColumns.flatMap((column) => column.links).some((link) => hiddenMarketingPath(link.href))).toBe(false);
    expect(promoVariant('index.md')).toBeNull();
    expect(promoVariant('cloud.md')).toBe('cloud');
  });
  it('presents open-source resources rather than a company', () => {
    expect(footerColumns.map((column) => column.title)).toEqual(['Resources', 'Developers', 'Project']);
    expect(footerColumns.flatMap((column) => column.links).some((link) => link.href.startsWith('mailto:'))).toBe(false);
  });
  it('matches only Cloud and legal paths', () => {
    for (const path of ['/cloud', '/cloud/plans', '/cloud#pricing', '/legal/', '/legal/privacy'])
      expect(hiddenMarketingPath(path)).toBe(true);
    for (const path of ['/guide/', '/cloudy', '/build', '/api/definition']) expect(hiddenMarketingPath(path)).toBe(false);
  });
});
