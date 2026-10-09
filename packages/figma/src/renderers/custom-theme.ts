import { resolveFonts } from '../fonts';
import type { KitTheme } from '../kits/kit';
import type { TextStyle } from '../kits/primitives';
import { slotForName } from '../text-slots';

const NEUTRAL = {
  text: '#1A1A1A',
  muted: '#6B6B6B',
  card: { fill: '#FFFFFF', radius: 16, padding: 24, gap: 16 },
  actionsGap: 8,
  optionGroup: { gap: 8 },
  titleSize: 24,
  headingSize: 20,
  bodySize: 15,
  captionSize: 12,
};

function toHex(value: number): string {
  return Math.round(value * 255).toString(16).padStart(2, '0');
}

function labelNode(component?: ComponentNode): TextNode | undefined {
  const texts = (component?.findAllWithCriteria({ types: ['TEXT'] }) ?? []).filter((node) => node.fontName !== figma.mixed);
  return texts.find((node) => slotForName(node.name) === 'label') ?? texts[0];
}

async function styleOf(node: TextNode): Promise<TextStyle | undefined> {
  const fill = Array.isArray(node.fills) ? (node.fills as Paint[]).find((paint) => paint.type === 'SOLID') : undefined;
  if (!fill || fill.type !== 'SOLID' || typeof node.fontSize !== 'number') return undefined;
  const font = node.fontName as FontName;
  const loaded = await figma.loadFontAsync(font).then(() => true, () => false);
  if (!loaded) return undefined;
  return { font, size: node.fontSize, color: `#${toHex(fill.color.r)}${toHex(fill.color.g)}${toHex(fill.color.b)}` };
}

export async function customTheme(base: KitTheme, sample?: ComponentNode): Promise<KitTheme> {
  const label = labelNode(sample);
  const fonts = label ? await resolveFonts([(label.fontName as FontName).family]) : base.fonts;
  const groupLabel = label ? await styleOf(label) : undefined;
  return { ...NEUTRAL, fonts, groupLabel, card: { ...NEUTRAL.card, width: base.card.width } };
}

function solidHex(node: SceneNode): string | undefined {
  const fills = 'fills' in node && Array.isArray(node.fills) ? (node.fills as Paint[]) : [];
  const fill = fills.find((paint) => paint.type === 'SOLID' && paint.visible !== false);
  return fill?.type === 'SOLID' ? `#${toHex(fill.color.r)}${toHex(fill.color.g)}${toHex(fill.color.b)}` : undefined;
}

function accent(primary: ComponentNode): string | undefined {
  return solidHex(primary) ?? primary.findAll((node) => node.type !== 'TEXT').map(solidHex).find(Boolean);
}

export async function textButtonStyle(primary: ComponentNode, fallback: TextStyle): Promise<TextStyle> {
  const label = primary.findOne((node) => node.type === 'TEXT') as TextNode | null;
  const style = label ? await styleOf(label) : undefined;
  return { ...(style ?? fallback), color: accent(primary) ?? fallback.color };
}
