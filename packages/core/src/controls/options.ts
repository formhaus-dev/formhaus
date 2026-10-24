import { scaleView } from '@formhaus/core/fields';
import type { FieldOption, FormField, RevealView } from '../types';
import type { ControlOption } from './types';

export const POINT_TYPES = ['scale', 'rating'];

export function withReveals<Option extends { value: string | number }, Children>(
  options: Option[],
  reveals?: RevealView<Children>[],
): (Option & { reveal?: RevealView<Children> })[] {
  if (!reveals) return options;
  return options.map((option) => {
    const reveal = reveals.find((view) => view.value === String(option.value));
    return reveal ? { ...option, reveal } : option;
  });
}

export function controlOptions<Children = never>(
  field: FormField,
  options: FieldOption[],
  reveals?: RevealView<Children>[],
): ControlOption<Children>[] {
  return POINT_TYPES.includes(field.type)
    ? scaleView(field).points.map((point) => ({ value: point, label: String(point) }))
    : withReveals(options, reveals);
}
