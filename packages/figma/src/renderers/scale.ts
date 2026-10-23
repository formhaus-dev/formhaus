import type { FormField } from '@formhaus/core';
import { scaleView } from '@formhaus/core/fields';
import type { KitTheme } from '../kits/kit';
import { icon, solid, stack, text } from '../kits/primitives';
import { appendFill, captionStyle, choiceGroup, hairline, spacer } from './choice';

const POINT_GAP = 6;
const STAR_SIZE = 40;
const STAR_INSET = 4;
const SCALE_NARROW = 444;
const SCALE_MEDIUM = 544;
const RATING_NARROW = 440;
const ANCHORS = ['Start', 'Middle', 'End'] as const;

function anchors(labels: (string | undefined)[], theme: KitTheme): FrameNode | null {
  if (!labels.some(Boolean)) return null;
  const row = stack('HORIZONTAL', 'Anchors', { itemSpacing: 12 });
  labels.forEach((label, index) => {
    if (index === 1 && !label) return;
    const node = text(label ?? '', captionStyle(theme), ANCHORS[index]);
    row.appendChild(node);
    if (index === 1) return;
    node.layoutSizingHorizontal = 'FILL';
    node.textAutoResize = 'HEIGHT';
    if (index === 2) node.textAlignHorizontal = 'RIGHT';
  });
  return row;
}

export function fitColumns(count: number, preferred: number, width: number, cell: number, gap: number): number {
  const wanted = Math.min(preferred, count);
  const fits = Math.max(1, Math.floor((width + gap) / (cell + gap)));
  return wanted <= fits ? wanted : Math.ceil(count / Math.ceil(count / fits));
}

export function scaleColumns(count: number, width: number, cell: number): number {
  const narrow = width < SCALE_NARROW && count >= 8 ? (count >= 11 ? 6 : count >= 9 ? 5 : 4) : count;
  const medium = width < SCALE_MEDIUM && count >= 10 ? (count >= 11 ? 6 : 5) : count;
  return fitColumns(count, Math.min(narrow, medium), width, cell, POINT_GAP);
}

export function ratingColumns(count: number, width: number, cell: number): number {
  return fitColumns(count, width < RATING_NARROW && count >= 9 ? 5 : count, width, cell, 0);
}

function grid(name: string, cells: FrameNode[], columns: number, gap: number, stretch: boolean): FrameNode {
  const frame = stack('VERTICAL', name, { itemSpacing: gap });
  for (let start = 0; start < cells.length; start += columns) {
    const row = stack('HORIZONTAL', `Row ${start / columns + 1}`, { itemSpacing: gap });
    if (stretch) appendFill(frame, row);
    else frame.appendChild(row);
    for (const cell of cells.slice(start, start + columns)) {
      if (stretch) appendFill(row, cell);
      else row.appendChild(cell);
    }
    while (stretch && row.children.length < columns) appendFill(row, spacer());
  }
  return frame;
}

function point(value: number, selected: boolean, theme: KitTheme): FrameNode {
  const box = stack('HORIZONTAL', String(value), { primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER' });
  const size = Math.max(theme.control.height, theme.control.target);
  box.resize(size, size);
  box.counterAxisSizingMode = 'FIXED';
  box.cornerRadius = theme.control.radius;
  box.fills = selected ? solid(theme.accent) : theme.optionGroup.fill ? solid(theme.optionGroup.fill) : [];
  box.strokes = selected || theme.optionGroup.fill ? [] : hairline(theme);
  box.strokeWeight = 1;
  const color = selected ? theme.card.fill : theme.text;
  box.appendChild(text(String(value), { font: theme.fonts.medium, size: theme.bodySize, color }, 'Number'));
  return box;
}

function star(value: number, filled: boolean, size: number, theme: KitTheme): FrameNode {
  const cell = stack('HORIZONTAL', String(value), { primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER' });
  cell.resize(size, size);
  cell.appendChild(icon(filled ? 'starFill' : 'star', filled ? theme.accent : theme.muted, STAR_SIZE));
  return cell;
}

export function scaleField(field: FormField, theme: KitTheme): FrameNode {
  const group = choiceGroup(field, theme);
  const view = scaleView(field);
  const points = view.points;
  const selected = typeof field.defaultValue === 'number' ? field.defaultValue : Number.NaN;
  const labels = anchors(
    view.anchors.map((anchor) => anchor?.label),
    theme,
  );
  const width = theme.card.width - 2 * theme.card.padding;
  if (field.type === 'rating') {
    const size = Math.max(STAR_SIZE + STAR_INSET, theme.control.target);
    const cells = points.map((value) => star(value, value <= selected, size, theme));
    const column = stack('VERTICAL', 'Rating', { itemSpacing: 8 });
    column.appendChild(grid('Stars', cells, ratingColumns(points.length, width, size), 0, false));
    if (labels) appendFill(column, labels);
    group.appendChild(column);
    return group;
  }
  const cells = points.map((value) => point(value, value === selected, theme));
  appendFill(group, grid('Points', cells, scaleColumns(points.length, width, theme.control.target), POINT_GAP, true));
  if (labels) appendFill(group, labels);
  return group;
}
