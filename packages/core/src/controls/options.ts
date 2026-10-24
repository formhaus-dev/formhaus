import { scaleView } from '@formhaus/core/fields';
import type { FieldOption, FormField } from '../types';
import type { ControlOption } from './types';

export const POINT_TYPES = ['scale', 'rating'];

export function controlOptions(field: FormField, options: FieldOption[]): ControlOption[] {
  return POINT_TYPES.includes(field.type) ? scaleView(field).points.map((point) => ({ value: point, label: String(point) })) : options;
}
