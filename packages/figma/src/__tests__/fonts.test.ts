import { beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveFonts } from '../fonts';

function stubFonts(fonts: [string, string][]) {
  vi.stubGlobal('figma', {
    listAvailableFontsAsync: async () => fonts.map(([family, style]) => ({ fontName: { family, style } })),
    loadFontAsync: vi.fn().mockResolvedValue(undefined),
  });
}

describe('resolveFonts', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('uses the first available preferred family with matching styles', async () => {
    stubFonts([['SF Pro', 'Regular'], ['SF Pro', 'Medium'], ['SF Pro', 'Semibold'], ['Inter', 'Regular']]);
    expect(await resolveFonts(['SF Pro Display', 'SF Pro'])).toEqual({
      regular: { family: 'SF Pro', style: 'Regular' },
      medium: { family: 'SF Pro', style: 'Medium' },
      semibold: { family: 'SF Pro', style: 'Semibold' },
    });
  });

  it('falls back to Inter and its Semi Bold spelling', async () => {
    stubFonts([['Inter', 'Regular'], ['Inter', 'Semi Bold']]);
    expect(await resolveFonts(['Roboto'])).toEqual({
      regular: { family: 'Inter', style: 'Regular' },
      medium: { family: 'Inter', style: 'Semi Bold' },
      semibold: { family: 'Inter', style: 'Semi Bold' },
    });
  });
});
