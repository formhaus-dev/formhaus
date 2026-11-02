import { fieldState, readOnlyAttrs, type FieldState } from '../fields/state';
import type { FormField } from '../types';
import { type Attrs, type Child, type Html, html } from './markup';
import type { StaticLabel } from './types';

export type FieldVariant = 'checkbox' | 'switch' | 'radio' | 'multiselect' | 'scale' | 'rating';

export interface FieldContext {
  id: string;
  field: FormField;
  value: unknown;
  error?: string;
  readOnly: boolean;
  text: StaticLabel;
  state: FieldState;
}

export type FieldRenderer = (context: FieldContext) => Html;

export function fieldContext(input: Omit<FieldContext, 'state'>): FieldContext {
  const { id, field, error, readOnly } = input;
  return { ...input, state: fieldState({ id, field, error, readOnly }) };
}

export const finite = (value: unknown): number | undefined => (typeof value === 'number' && Number.isFinite(value) ? value : undefined);

export const textOf = (value: unknown): string => (value == null ? '' : String(value));

const NONE: Attrs = {};

export function readonlyAttrs({ field, readOnly }: FieldContext, group = false): Attrs {
  if (!readOnly) return NONE;
  const { readOnly: readonly, ...rest } = readOnlyAttrs({ field, readOnly }, group);
  return { ...rest, readonly };
}

export function controlAttrs(context: FieldContext): Attrs {
  const { id, field, state } = context;
  return {
    id,
    name: field.key,
    autocomplete: field.autocomplete,
    required: !!state.required,
    ...readonlyAttrs(context),
    ...state.aria,
  };
}

const requiredMark = ({ field }: FieldContext): Html | false =>
  !!field.validation?.required && html('span', { class: 'fh-field__required', 'aria-hidden': true }, ' *');

export function shell(context: FieldContext, variant: FieldVariant | undefined, ...children: Child[]): Html {
  const { id, field, error, text, state } = context;
  const inline = variant === 'checkbox' || variant === 'switch';
  const group = !!variant && !inline;
  const helper = !!field.helperText && html('p', { id: state.helperId, class: 'fh-field__helper' }, field.helperText);
  const message = !!error && html('p', { id: state.errorId, class: 'fh-field__error', role: 'alert' }, error);
  const container = `fh-field__${variant === 'rating' ? 'scale' : variant}-${group ? 'group' : 'wrapper'}`;
  const label =
    !!field.label && html('label', { id: `${id}-label`, class: 'fh-field__label', for: id }, field.label, requiredMark(context));
  const legend =
    group &&
    !!field.label &&
    html(
      'legend',
      { class: 'fh-field__label' },
      field.label,
      requiredMark(context),
      !!field.validation?.required && [' ', html('span', { class: 'fh-field__required-text' }, text('required'))],
    );
  return html(
    group ? 'fieldset' : 'div',
    {
      class: variant ? `fh-field fh-field--${variant}` : 'fh-field',
      'aria-invalid': group && !!error,
      'aria-describedby': group ? state.describedBy : undefined,
      ...(group ? readonlyAttrs(context, true) : NONE),
    },
    legend,
    !variant && label,
    !inline && helper,
    variant
      ? html(
          'div',
          {
            class: group && field.layout === 'inline' ? `${container} ${container}--inline` : container,
            'data-columns': finite(field.columns),
          },
          children,
          inline && !!field.label && html('label', { class: 'fh-field__label', for: id }, field.label),
        )
      : children,
    inline && helper,
    message,
  );
}
