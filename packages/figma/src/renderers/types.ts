import type { ButtonKind } from '../roles';
import type { FormField } from '@formhaus/core';
import type { GlyphKind, KitTheme } from '../kits/kit';

export interface FormRenderer {
  theme: KitTheme;
  field(field: FormField): Promise<SceneNode>;
  button(label: string, kind: ButtonKind): Promise<SceneNode | null>;
  glyph(kind: GlyphKind): SceneNode;
}

export function labelText(field: FormField): string {
  return field.validation?.required ? `${field.label} *` : field.label;
}
