import type { FieldOption, FormField } from '@formhaus/core';
import type { KitTheme } from '../kits/kit';
import { icon, solid, stack } from '../kits/primitives';
import { appendFill, choiceGroup, hairline } from './choice';

const DEFAULT_COLUMNS = 2;
const MAX_COLUMNS = 4;
const IMAGE_ICON = 24;

export type OptionInstance = (role: 'option.radio' | 'option.checkbox', values: { label: string }) => Promise<InstanceNode>;

export function hasPictures(field: FormField): boolean {
  return Boolean(field.options?.some((option) => option.image));
}

export function hideLastSeparator(row: SceneNode | undefined): void {
  const separator = row && 'findOne' in row ? row.findOne((node) => node.name === 'Separator') : null;
  if (separator) separator.visible = false;
}

function placeholder(option: FieldOption, width: number, theme: KitTheme): FrameNode {
  const frame = stack('HORIZONTAL', 'Image', { primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER' });
  frame.resize(width, Math.round((width * 3) / 4));
  frame.primaryAxisSizingMode = 'FIXED';
  frame.counterAxisSizingMode = 'FIXED';
  frame.cornerRadius = theme.control.radius / 2;
  frame.fills = solid(theme.muted, 0.12);
  if (option.image) frame.appendChild(icon('image', theme.muted, IMAGE_ICON));
  return frame;
}

async function card(
  option: FieldOption,
  width: number,
  role: 'option.radio' | 'option.checkbox',
  theme: KitTheme,
  instance: OptionInstance,
): Promise<FrameNode> {
  const inset = theme.actionsGap;
  const frame = stack('VERTICAL', option.value, { paddingTop: inset, paddingLeft: inset, paddingRight: inset });
  frame.cornerRadius = theme.control.radius;
  frame.strokes = hairline(theme);
  frame.strokeWeight = 1;
  if (theme.optionGroup.fill) frame.fills = solid(theme.optionGroup.fill);
  appendFill(frame, placeholder(option, width - 2 * inset, theme));
  const row = await instance(role, { label: option.label });
  row.name = option.value;
  appendFill(frame, row);
  hideLastSeparator(row);
  return frame;
}

export async function pictureOptions(
  field: FormField,
  role: 'option.radio' | 'option.checkbox',
  theme: KitTheme,
  instance: OptionInstance,
): Promise<FrameNode> {
  const group = choiceGroup(field, theme);
  const columns = Math.min(MAX_COLUMNS, Math.max(1, Math.round(field.columns ?? DEFAULT_COLUMNS)));
  const gap = theme.actionsGap;
  const width = (theme.card.width - 2 * theme.card.padding - gap * (columns - 1)) / columns;
  const list = stack('VERTICAL', 'Options', { itemSpacing: gap });
  appendFill(group, list);
  const options = field.options ?? [];
  for (let start = 0; start < options.length; start += columns) {
    const row = stack('HORIZONTAL', `Row ${start / columns + 1}`, { itemSpacing: gap });
    appendFill(list, row);
    for (const option of options.slice(start, start + columns)) appendFill(row, await card(option, width, role, theme, instance));
    while (row.children.length < columns) appendFill(row, stack('VERTICAL', 'Spacer'));
  }
  return group;
}
