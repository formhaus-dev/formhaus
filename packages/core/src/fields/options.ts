import { optionTexts } from '../internal/options';
import type { FieldOption } from '../types';

export const optionText = (options: FieldOption[], value: unknown): string =>
  optionTexts(options)[options.findIndex((option) => option.value === value)] ?? String(value ?? '');

export const optionValue = (options: FieldOption[], text: string): string => options[optionTexts(options).indexOf(text)]?.value ?? text;
