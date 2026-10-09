import type { KitId } from '../config';
import type { KitFonts } from '../fonts';
import type { Role } from '../roles';
import type { KitNode } from './primitives';

export interface KitTheme {
  fonts: KitFonts;
  text: string;
  muted: string;
  card: { fill: string; radius: number; padding: number; gap: number; width: number };
  actionsGap: number;
  optionGroup: { gap: number; fill?: string; radius?: number };
  titleSize: number;
  bodySize: number;
  captionSize: number;
}

export interface Kit {
  id: KitId;
  name: string;
  version: number;
  fontFamilies: string[];
  theme(fonts: KitFonts): KitTheme;
  build(role: Role, fonts: KitFonts): KitNode;
}
