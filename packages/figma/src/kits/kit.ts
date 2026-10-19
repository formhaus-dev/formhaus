import type { KitId } from '../config';
import type { KitFonts } from '../fonts';
import type { Role } from '../roles';
import type { KitNode, TextStyle } from './primitives';

export interface KitTheme {
  fonts: KitFonts;
  text: string;
  muted: string;
  accent: string;
  control: { height: number; radius: number };
  card: { fill: string; radius: number; padding: number; gap: number; width: number };
  actionsGap: number;
  optionGroup: { gap: number; fill?: string; radius?: number };
  titleSize: number;
  headingSize: number;
  bodySize: number;
  captionSize: number;
  groupLabel?: TextStyle;
}

export type GlyphKind = 'radio' | 'checkbox';

export interface Kit {
  id: KitId;
  name: string;
  version: number;
  fontFamilies: string[];
  theme(fonts: KitFonts): KitTheme;
  build(role: Role, fonts: KitFonts): KitNode;
  glyph(kind: GlyphKind): SceneNode;
}
