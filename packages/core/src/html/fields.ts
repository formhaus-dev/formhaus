import type { DefaultFieldType } from '../types';
import { hasOwn } from '../visibility/nodes';
import { autocomplete, multiselect, radio, scale, select } from './choices';
import { type Html, html } from './markup';
import { controlAttrs, type FieldContext, type FieldRenderer, finite, shell, textOf } from './shell';

const PATTERN_TYPES = ['text', 'email', 'phone', 'password'];

function nativePattern(context: FieldContext): string | undefined {
  const pattern = context.field.validation?.pattern;
  if (typeof pattern !== 'string' || pattern === '' || !PATTERN_TYPES.includes(context.field.type)) return undefined;
  return `.*(?:${pattern}).*`;
}

function text(context: FieldContext): Html {
  const { field, value, state } = context;
  const number = field.type === 'number';
  return shell(
    context,
    undefined,
    html('input', {
      ...controlAttrs(context),
      type: state.inputType,
      class: 'fh-field__input',
      value: field.type === 'password' ? undefined : textOf(value),
      placeholder: state.placeholder,
      inputmode: state.inputMode,
      minlength: finite(state.minLength),
      maxlength: finite(state.maxLength),
      pattern: nativePattern(context),
      min: number ? finite(field.validation?.min) : undefined,
      max: number ? finite(field.validation?.max) : undefined,
      step: number ? 'any' : undefined,
    }),
  );
}

function textarea(context: FieldContext): Html {
  const { field, value, state } = context;
  const content = textOf(value);
  const rows = finite(field.rows);
  return shell(
    context,
    undefined,
    html(
      'textarea',
      {
        ...controlAttrs(context),
        class: 'fh-field__input fh-field__input--textarea',
        placeholder: state.placeholder,
        rows: rows !== undefined && rows >= 1 ? Math.floor(rows) : 3,
        minlength: finite(state.minLength),
        maxlength: finite(state.maxLength),
      },
      /^[\r\n]/.test(content) ? `\n${content}` : content,
    ),
  );
}

const temporal = (context: FieldContext): Html =>
  shell(
    context,
    undefined,
    html('input', {
      ...controlAttrs(context),
      type: context.state.inputType,
      class: `fh-field__input fh-field__input--${context.field.type}`,
      value: textOf(context.value),
    }),
  );

function toggle(context: FieldContext): Html {
  const { id, field, value, readOnly } = context;
  const variant = field.type === 'switch' ? 'switch' : 'checkbox';
  return shell(
    context,
    variant,
    html('input', {
      ...controlAttrs(context),
      type: 'checkbox',
      role: variant === 'switch' ? 'switch' : undefined,
      class: `fh-field__${variant}`,
      checked: !!value,
      disabled: readOnly,
    }),
    readOnly && !!value && html('input', { type: 'hidden', id: `${id}-value`, name: field.key, value: 'on', 'data-fh': 'static' }),
  );
}

const hidden = ({ id, field, value }: FieldContext): Html => html('input', { type: 'hidden', id, name: field.key, value: textOf(value) });

const unsupported = (): Html => html('div', { class: 'fh-field--unsupported' }, 'Unsupported field type');

const RENDERERS = {
  text,
  email: text,
  phone: text,
  number: text,
  password: text,
  select,
  autocomplete,
  multiselect,
  checkbox: toggle,
  radio,
  switch: toggle,
  file: unsupported,
  date: temporal,
  datetime: temporal,
  time: temporal,
  textarea,
  hidden,
  scale,
  rating: scale,
} satisfies Record<DefaultFieldType, FieldRenderer>;

export const fieldRenderer = (type: string): FieldRenderer => (hasOwn(RENDERERS, type) ? RENDERERS[type as DefaultFieldType] : unsupported);
