import type { FieldOption } from '../types';
import { optionText, optionValue } from './options';

export interface FreeText {
  text: string;
  setText: (text: string) => void;
}

export function freeText(options: FieldOption[], value: unknown, text: string, save: (value: string, text: string) => void): FreeText {
  return {
    text: optionValue(options, text) === (value == null ? '' : String(value)) ? text : optionText(options, value),
    setText: (typed) => save(optionValue(options, typed), typed),
  };
}
