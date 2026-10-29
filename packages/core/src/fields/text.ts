import type { FieldOption } from '../types';

export interface FreeText {
  text: string;
  setText: (text: string) => void;
}

export function freeText(options: FieldOption[], value: unknown, text: string, save: (value: string, text: string) => void): FreeText {
  const shown = value == null ? '' : String(value);
  const labelValue = (typed: string) => options.find((option) => option.label === typed)?.value ?? typed;
  return {
    text: labelValue(text) === shown ? text : (options.find((option) => option.value === value)?.label ?? shown),
    setText: (typed) => save(labelValue(typed), typed),
  };
}
