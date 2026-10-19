import type { FormField } from '@formhaus/core';
import type { KitTheme } from '../kits/kit';
import { fill, solid, stack, text, type TextStyle } from '../kits/primitives';
import { labelText } from './types';

export function labelStyle(theme: KitTheme): TextStyle {
  return theme.groupLabel ?? { font: theme.fonts.medium, size: theme.captionSize + 2, color: theme.muted };
}

export function captionStyle(theme: KitTheme): TextStyle {
  return { font: theme.fonts.regular, size: theme.captionSize, color: theme.muted };
}

export function hairline(theme: KitTheme): SolidPaint[] {
  return solid(theme.muted, 0.35);
}

export function appendFill(parent: FrameNode, child: SceneNode & LayoutMixin): void {
  parent.appendChild(child);
  fill(child);
  if (child.type === 'TEXT') child.textAutoResize = 'HEIGHT';
}

export function spacer(): FrameNode {
  const frame = stack('HORIZONTAL', 'Spacer');
  frame.resize(1, 1);
  return frame;
}

export function choiceGroup(field: FormField, theme: KitTheme): FrameNode {
  const group = stack('VERTICAL', field.key, { itemSpacing: 8 });
  appendFill(group, text(labelText(field), labelStyle(theme), 'Label'));
  if (field.helperText) appendFill(group, text(field.helperText, captionStyle(theme), 'Helper'));
  return group;
}
