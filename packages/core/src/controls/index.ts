import { type DateType, type FieldState, fieldValue, fromDate, numberValue, scaleView } from '@formhaus/core/fields';
import type { FieldOption, FormField } from '../types';
import type { ControlKind, ControlOption, ControlShells, ControlTextType, MappedTypes } from './types';

export type {
  ControlEntryOf,
  ControlKind,
  ControlOption,
  ControlShells,
  ControlTextType,
  LooseProps,
  MapControlsOptions,
  MappedTypes,
} from './types';

export interface ControlRoot {
  'data-fh': 'field';
  'data-testid'?: string;
  'aria-invalid'?: true;
  'aria-describedby'?: string;
}

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

const KINDS: Record<string, ControlKind> = {
  checkbox: 'inline',
  switch: 'inline',
  radio: 'group',
  multiselect: 'group',
  scale: 'group',
  rating: 'group',
};
const TEXT_TYPES: ControlTextType[] = ['text', 'email', 'phone', 'number', 'password', 'date', 'time', 'datetime'];
const STRING_TYPES = ['text', 'email', 'phone', 'number', 'password', 'date', 'time', 'datetime', 'textarea', 'select', 'autocomplete'];
const POINT_TYPES = ['scale', 'rating'];
const COMMIT_TYPES = ['radio', 'scale', 'rating'];
const OPTION = 'input[type=radio], button[value], [role=radio], [role=option]';
const INPUT_ONLY = ['placeholder', 'inputMode', 'autoComplete', 'autocomplete'];

export const controlKind = (type: string, kinds?: Partial<Record<string, ControlKind>>): ControlKind => {
  const kind = kinds?.[type] ?? KINDS[type];
  return kind === 'inline' || kind === 'group' ? kind : 'input';
};

export function controlShell<Shell>(shells: ControlShells<Shell>, kind: ControlKind): Shell | null {
  const map = shells as Partial<Record<ControlKind, Shell | null>> | null;
  return map && typeof map === 'object' && ['input', 'inline', 'group'].some((key) => key in map)
    ? (map[kind] ?? null)
    : (shells as Shell | null);
}

export function mapControlTypes<Controls extends object, Component>(
  controls: Controls,
  make: (entry: NonNullable<Controls[keyof Controls]>, input: boolean) => Component,
): { [Type in MappedTypes<Controls>]: Component } {
  const entries = controls as Record<string, Controls[keyof Controls]>;
  const map: Record<string, Component> = {};
  for (const [key, entry] of Object.entries(entries)) {
    if (!entry) continue;
    const component = make(entry, key === 'input');
    for (const type of key === 'input' ? TEXT_TYPES.filter((type) => !entries[type]) : [key]) map[type] = component;
  }
  return map as { [Type in MappedTypes<Controls>]: Component };
}

export function controlOptions(field: FormField, options: FieldOption[]): ControlOption[] {
  return POINT_TYPES.includes(field.type) ? scaleView(field).points.map((point) => ({ value: point, label: String(point) })) : options;
}

export function toControl(field: FormField, value: unknown): unknown {
  if (KINDS[field.type] === 'inline') return !!value;
  if (field.type === 'multiselect') return Array.isArray(value) ? value : [];
  if (field.type === 'file') return undefined;
  if (STRING_TYPES.includes(field.type)) return value == null ? '' : String(value);
  return value ?? null;
}

const isEvent = (input: unknown): input is { target: { checked?: boolean; value?: unknown; files?: ArrayLike<unknown> } } =>
  typeof input === 'object' &&
  input !== null &&
  'target' in input &&
  typeof (input as { preventDefault?: unknown }).preventDefault === 'function';

const first = (value: unknown) => {
  const list = value as ArrayLike<unknown> | null;
  return list && typeof list === 'object' && typeof list.length === 'number' ? (list[0] ?? null) : value;
};

const unwrap = (value: unknown): unknown =>
  Array.isArray(value) ? value.map(unwrap) : value && typeof value === 'object' && 'value' in value ? value.value : value;

export function fromControl(field: FormField, input: unknown, detail?: unknown): unknown {
  const { type } = field;
  let value = input;
  if (isEvent(input)) {
    const { target } = input;
    value = detail !== undefined ? detail : type === 'file' ? target.files : KINDS[type] === 'inline' ? target.checked : target.value;
  }
  if (type === 'file') return first(value) ?? null;
  if (type === 'date' || type === 'time' || type === 'datetime') {
    const date = value as { toDate?: () => Date } | null;
    if (date && typeof date === 'object') value = fromDate(date instanceof Date ? date : date.toDate?.(), type as DateType);
  } else value = unwrap(value);
  if (POINT_TYPES.includes(type)) value = typeof value === 'string' ? numberValue(value) : type === 'rating' && value === 0 ? null : value;
  return value === undefined ? null : fieldValue(field, value);
}

export interface ControlPreset {
  kind: ControlKind;
  shell: boolean;
  input: boolean;
  attrs: object;
  valueKey: string;
}

export function controlProps(field: FormField, state: FieldState & { value: unknown; testId?: string }, preset: ControlPreset) {
  const group = preset.kind === 'group';
  const control: Record<string, unknown> = {
    ...preset.attrs,
    value: undefined,
    modelValue: undefined,
    onChange: undefined,
    'onUpdate:modelValue': undefined,
    'aria-describedby': preset.shell && !group ? state.describedBy : undefined,
    'data-testid': group ? undefined : state.testId,
    type: preset.input ? state.inputType : undefined,
    [preset.valueKey]: toControl(field, state.value),
  };
  for (const key of Object.keys(control))
    if (control[key] === undefined || (preset.kind !== 'input' && INPUT_ONLY.includes(key))) delete control[key];
  const shellGroup = group && preset.shell;
  return {
    control,
    root: {
      'data-fh': 'field',
      'data-testid': group ? state.testId : undefined,
      'aria-invalid': shellGroup ? state.aria['aria-invalid'] : undefined,
      'aria-describedby': shellGroup ? state.describedBy : undefined,
    } as ControlRoot,
  };
}

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

interface LabelDocument {
  getElementsByTagName(name: 'label'): ArrayLike<{ htmlFor: string }>;
}

export function warnDoubleLabel(document: LabelDocument, id: string): void {
  const count = Array.from(document.getElementsByTagName('label')).filter((label) => label.htmlFor === id).length;
  if (count > 1)
    console.warn(
      `[formhaus] double-label: the control "${id}" has ${count} labels. Set the shell of its kind to null, or do not pass a label to the control.`,
    );
}
