import type { FormField } from '@formhaus/core';
import { scaleRange } from '@formhaus/core/internal';
import type { KitTheme } from '../kits/kit';
import { icon, solid, stack, text } from '../kits/primitives';
import { appendFill, captionStyle, choiceGroup, hairline } from './choice';

const MAX_POINTS = 11;
const POINT_GAP = 6;
const STAR_SIZE = 32;
const STAR_GAP = 4;
const ANCHORS = ['Start', 'Middle', 'End'] as const;

export function scalePoints(field: FormField): number[] {
  const [min, max] = scaleRange(field);
  return Array.from({ length: Math.min(MAX_POINTS, Math.max(0, max - min + 1)) }, (_, index) => min + index);
}

function anchorLabels(field: FormField, points: number[]): (string | undefined)[] {
  const min = points[0];
  const max = points[points.length - 1];
  return [min, Math.floor((min + max) / 2), max].map((point, index) =>
    index === 1 && (point === min || point === max) ? undefined : field.options?.find((option) => option.value === String(point))?.label,
  );
}

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

function point(value: number, selected: boolean, theme: KitTheme): FrameNode {
  const box = stack('HORIZONTAL', String(value), { primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER' });
  box.resize(theme.control.height, theme.control.height);
  box.counterAxisSizingMode = 'FIXED';
  box.cornerRadius = theme.control.radius;
  box.fills = selected ? solid(theme.accent) : theme.optionGroup.fill ? solid(theme.optionGroup.fill) : [];
  box.strokes = selected || theme.optionGroup.fill ? [] : hairline(theme);
  box.strokeWeight = 1;
  const color = selected ? theme.card.fill : theme.text;
  box.appendChild(text(String(value), { font: theme.fonts.medium, size: theme.bodySize, color }, 'Number'));
  return box;
}

function stars(points: number[], selected: number, theme: KitTheme): FrameNode {
  const row = stack('HORIZONTAL', 'Stars', { itemSpacing: STAR_GAP });
  for (const value of points) {
    const filled = value <= selected;
    const star = icon(filled ? 'starFill' : 'star', filled ? theme.accent : theme.muted, STAR_SIZE);
    star.name = String(value);
    row.appendChild(star);
  }
  return row;
}

export function scaleField(field: FormField, theme: KitTheme): FrameNode {
  const group = choiceGroup(field, theme);
  const points = scalePoints(field);
  const selected = typeof field.defaultValue === 'number' ? field.defaultValue : Number.NaN;
  const labels = anchors(anchorLabels(field, points), theme);
  if (field.type === 'rating') {
    const column = stack('VERTICAL', 'Rating', { itemSpacing: 8 });
    column.appendChild(stars(points, selected, theme));
    if (labels) appendFill(column, labels);
    group.appendChild(column);
    return group;
  }
  const row = stack('HORIZONTAL', 'Points', { itemSpacing: POINT_GAP });
  appendFill(group, row);
  for (const value of points) appendFill(row, point(value, value === selected, theme));
  if (labels) appendFill(group, labels);
  return group;
}
