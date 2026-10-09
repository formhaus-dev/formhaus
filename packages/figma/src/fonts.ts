export type FontWeight = 'regular' | 'medium' | 'semibold';

export type KitFonts = Record<FontWeight, FontName>;

const STYLES: Record<FontWeight, string[]> = {
  regular: ['Regular'],
  medium: ['Medium', 'Semi Bold', 'Semibold', 'Regular'],
  semibold: ['Semibold', 'Semi Bold', 'Bold', 'Medium'],
};

export async function resolveFonts(preferredFamilies: string[]): Promise<KitFonts> {
  const available = await figma.listAvailableFontsAsync();
  const stylesByFamily = new Map<string, Set<string>>();
  for (const { fontName } of available) {
    const styles = stylesByFamily.get(fontName.family) ?? new Set<string>();
    styles.add(fontName.style);
    stylesByFamily.set(fontName.family, styles);
  }
  const family = [...preferredFamilies, 'Inter'].find((name) => stylesByFamily.get(name)?.has('Regular')) ?? 'Inter';
  const styles = stylesByFamily.get(family) ?? new Set(['Regular']);
  const pick = (weight: FontWeight): FontName => ({
    family,
    style: STYLES[weight].find((style) => styles.has(style)) ?? 'Regular',
  });
  const fonts: KitFonts = { regular: pick('regular'), medium: pick('medium'), semibold: pick('semibold') };
  await Promise.all(Object.values(fonts).map((font) => figma.loadFontAsync(font)));
  return fonts;
}
