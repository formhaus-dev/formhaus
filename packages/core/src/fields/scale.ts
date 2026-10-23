import { scalePoints, scaleRange } from '../validation/type-checks';
import type { FormField } from '../types';

export interface ScaleAnchor {
  point: number;
  label: string;
}

export interface ScaleView {
  points: number[];
  min: number;
  max: number;
  anchors: (ScaleAnchor | undefined)[];
}

export function scaleView(field: FormField): ScaleView {
  const points = scalePoints(field);
  const [min, max] = scaleRange(field);
  const middle = (min + max) >> 1;
  return {
    points,
    min,
    max,
    anchors: [min, middle, max].map((point, index) => {
      const label =
        !points.includes(point) || (index === 1 && (point === min || point === max))
          ? undefined
          : field.options?.find((option) => option.value === String(point))?.label;
      return label === undefined ? label : { point, label };
    }),
  };
}
