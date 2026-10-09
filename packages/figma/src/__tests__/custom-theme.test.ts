import { describe, expect, it, vi } from 'vitest';
import type { KitTheme } from '../kits/kit';
import { customTheme, textButtonStyle } from '../renderers/custom-theme';
import { ROLE_FALLBACKS } from '../roles';

const base = { card: { width: 400 }, fonts: { regular: { family: 'Roboto', style: 'Regular' } } } as unknown as KitTheme;

function text(name: string, style: string, size: number) {
  return { type: 'TEXT', name, fontName: { family: 'Acme Sans', style }, fontSize: size, fills: [{ type: 'SOLID', color: { r: 0.1, g: 0.2, b: 0.3 } }] };
}

describe('customTheme', () => {
  it('takes fonts and the group label style from the bound text field label', async () => {
    vi.stubGlobal('figma', {
      mixed: Symbol('mixed'),
      loadFontAsync: vi.fn().mockResolvedValue(undefined),
      listAvailableFontsAsync: async () => ['Regular', 'Medium', 'Semibold'].map((style) => ({ fontName: { family: 'Acme Sans', style } })),
    });
    const sample = { findAllWithCriteria: () => [text('Placeholder', 'Regular', 15), text('Label', 'Medium', 13)] } as unknown as ComponentNode;
    const theme = await customTheme(base, sample);
    expect(theme.fonts.regular).toEqual({ family: 'Acme Sans', style: 'Regular' });
    expect(theme.groupLabel).toEqual({ font: { family: 'Acme Sans', style: 'Medium' }, size: 13, color: '#1a334d' });
    expect(theme.card).toMatchObject({ fill: '#FFFFFF', width: 400 });
  });

  it('keeps kit fonts without a bound text field', async () => {
    expect((await customTheme(base)).fonts).toBe(base.fonts);
  });
});

describe('ROLE_FALLBACKS', () => {
  it('falls back from specialised inputs to the text field', () => {
    expect(ROLE_FALLBACKS['field.date']).toEqual(['field.select', 'field.text']);
    expect(ROLE_FALLBACKS['field.textarea']).toEqual(['field.text']);
  });
});

describe('textButtonStyle', () => {
  it('uses the primary button label font and its fill as the text colour', async () => {
    vi.stubGlobal('figma', { mixed: Symbol('mixed'), loadFontAsync: vi.fn().mockResolvedValue(undefined) });
    const label = { ...text('Label', 'Semibold', 15), fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }] };
    const primary = { fills: [{ type: 'SOLID', color: { r: 0.12, g: 0.44, b: 0.29 } }], findOne: () => label } as unknown as ComponentNode;
    const fallback = { font: { family: 'Inter', style: 'Medium' }, size: 14, color: '#000000' };
    expect(await textButtonStyle(primary, fallback)).toEqual({ font: { family: 'Acme Sans', style: 'Semibold' }, size: 15, color: '#1f704a' });
  });
});
