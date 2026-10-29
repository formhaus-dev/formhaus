import type { FormEngine } from '../engine';
import type { EngineInternals } from '../engine/runtime-internals';
import type { FormField } from '../types';

export const fileLimitMessage = (engine: FormEngine, field: FormField, max: number): string =>
  field.validation?.maxLengthMessage ?? (engine as unknown as EngineInternals).messages('maxItems', { max }, field);

interface Focusable {
  focus(): void;
}

interface ButtonList {
  querySelectorAll(selector: 'button'): ArrayLike<Focusable>;
}

export const nextRemove = (list: ButtonList | null | undefined, position: number): Focusable | undefined => {
  const buttons = list?.querySelectorAll('button');
  return buttons?.[position] ?? buttons?.[position - 1];
};
