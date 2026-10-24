import { scaleView } from '@formhaus/core/fields';
import type { FieldOption, FormField, RevealView } from '../types';
import type { ControlOption } from './types';

export const POINT_TYPES = ['scale', 'rating'];

export function withReveals<Option extends { value: string | number }, Children>(
  options: Option[],
  reveals?: RevealView<Children>[],
): (Option & { reveal?: RevealView<Children> })[] {
  if (!reveals) return options;
  const byValue = new Map(reveals.map((view) => [view.value, view]));
  return options.map((option) => {
    const reveal = byValue.get(String(option.value));
    return reveal ? { ...option, reveal } : option;
  });
}

export function controlOptions<Children = unknown>(
  field: FormField,
  options: FieldOption[],
  reveals?: RevealView<Children>[],
): ControlOption<Children>[] {
  return POINT_TYPES.includes(field.type)
    ? scaleView(field).points.map((point) => ({ value: point, label: String(point) }))
    : withReveals(options, reveals);
}
