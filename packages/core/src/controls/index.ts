import { type DateType, type FieldState, fieldValue, fromDate, numberValue, scaleView } from '@formhaus/core/fields';
import type { FieldOption, FormField } from '../types';
import { revealable } from '../internal/reveal';
import { POINT_TYPES } from './options';
import type { ControlKind, ControlShells, ControlTextType, MappedTypes } from './types';

export { choiceControl, type ChoiceInput, type ControlClickEvent, type ControlKeyEvent } from './choice';
export { controlOptions } from './options';

export type {
  ControlEntryOf,
  ControlKind,
  ControlOption,
  ControlShells,
  ControlSpecKey,
  ControlSpecOf,
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
  reveal: readonly string[] = [],
): { [Type in MappedTypes<Controls>]: Component } {
  const entries = controls as Record<string, Controls[keyof Controls]>;
  const map: Record<string, Component> = {};
  for (const [key, entry] of Object.entries(entries)) {
    if (!entry) continue;
    const component = make(entry, key === 'input');
    for (const type of key === 'input' ? TEXT_TYPES.filter((type) => !entries[type]) : [key]) map[type] = component;
    if (reveal.includes(key)) revealable.add(component as object);
  }
  return map as { [Type in MappedTypes<Controls>]: Component };
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
  text?: string;
  setText?: (text: string) => void;
}

export function controlProps(
  field: FormField,
  state: FieldState & { value: unknown; testId?: string; options?: FieldOption[] },
  preset: ControlPreset,
) {
  const { type } = field;
  const { value, options = [] } = state;
  const { text } = preset;
  const typed = text !== undefined && type === 'autocomplete';
  const shown = toControl(field, value);
  const labelValue = (label: string) => options.find((option) => option.label === label)?.value ?? label;
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
    rows: type === 'textarea' ? field.rows : undefined,
    accept: type === 'file' ? field.accept : undefined,
    [preset.valueKey]: !typed
      ? shown
      : labelValue(text) === shown
        ? text
        : (options.find((option) => option.value === value)?.label ?? shown),
  };
  for (const key of Object.keys(control))
    if (control[key] === undefined || (preset.kind !== 'input' && INPUT_ONLY.includes(key))) delete control[key];
  const shellGroup = group && preset.shell;
  return {
    control,
    anchors: type === 'scale' ? scaleView(field).anchors : [],
    save(input: unknown, detail?: unknown): unknown {
      const next = fromControl(field, input, detail);
      if (!typed) return next;
      const typedText = String(next ?? '');
      preset.setText?.(typedText);
      return labelValue(typedText);
    },
    root: {
      'data-fh': 'field',
      'data-testid': group ? state.testId : undefined,
      'aria-invalid': shellGroup ? state.aria['aria-invalid'] : undefined,
      'aria-describedby': shellGroup ? state.describedBy : undefined,
    } as ControlRoot,
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
