import type { FieldOption, FormField } from '../types';
import { controlOptions } from './options';

export interface ControlKeyEvent {
  key: string;
  repeat: boolean;
  target: unknown;
  preventDefault(): void;
}

export interface ControlClickEvent {
  detail: number;
  target: unknown;
}

export interface ChoiceInput {
  field: FormField;
  value: unknown;
  options: FieldOption[];
  disabled: boolean;
}

const COMMIT_TYPES = ['radio', 'scale', 'rating'];
const OPTION = 'input[type=radio], button[value], [role=radio], [role=option]';

const empty = (value: unknown) => value == null || value === '' || (Array.isArray(value) && !value.length);

export function choiceControl(read: () => ChoiceInput, change: (value: unknown) => void, commit: (value: unknown) => void) {
  let arrow = false;
  let pending = false;
  let fresh = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const active = () => {
    const { field, disabled } = read();
    return !!field.autoAdvance && COMMIT_TYPES.includes(field.type) && !disabled;
  };
  const optionOf = (target: unknown) => {
    const { field, options } = read();
    const text = (target as { value?: unknown } | null)?.value;
    return controlOptions(field, options).find((option) => typeof text === 'string' && String(option.value) === text)?.value;
  };
  const finish = (value: unknown) => {
    clearTimeout(timer);
    pending = false;
    if (empty(value)) return;
    fresh = true;
    setTimeout(() => {
      fresh = false;
    }, 0);
    commit(value);
  };
  const optionAt = (target: unknown) => (target as { closest?: (selector: string) => unknown } | null)?.closest?.(OPTION);
  const pressed = (event: ControlKeyEvent, key: string) => {
    const element = optionAt(event.target);
    if (event.key !== key || !active() || !element) return;
    event.preventDefault();
    if (pending) finish(optionOf(element) ?? read().value);
  };
  return {
    pick(value: unknown) {
      if (!active() || arrow || empty(value)) change(value);
      else finish(value);
    },
    stop() {
      clearTimeout(timer);
    },
    pointerDown() {
      arrow = false;
    },
    keyDownCapture(event: ControlKeyEvent) {
      arrow = event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End';
      if (!event.repeat) pending = event.key === ' ' || event.key === 'Enter';
    },
    keyDown(event: ControlKeyEvent) {
      if (event.key === ' ' && active() && optionAt(event.target)) event.preventDefault();
      pressed(event, 'Enter');
    },
    keyUp(event: ControlKeyEvent) {
      arrow = false;
      pressed(event, ' ');
    },
    click({ detail, target }: ControlClickEvent) {
      const element = optionAt(target);
      if (!active() || arrow || fresh || detail > 1 || !element) return;
      const value = read().value;
      const picked = optionOf(element);
      clearTimeout(timer);
      if (picked === undefined || String(picked) === String(value))
        timer = setTimeout(() => {
          if (!fresh) finish(read().value);
        }, 0);
    },
  };
}
