import { optionChecked, optionDescriptionId, optionLocked } from '../fields/state';
import { optionText } from '../fields/options';
import { scaleView } from '../fields/scale';
import { dividerBefore, optionTexts } from '../internal/options';
import { imageSource } from '../internal/urls';
import type { FieldOption } from '../types';
import { type Child, type Html, html } from './markup';
import { controlAttrs, type FieldContext, readonlyAttrs, shell, textOf } from './shell';

type OptionVariant = 'radio' | 'multiselect';

const optionsOf = ({ field }: FieldContext): FieldOption[] => (Array.isArray(field.options) ? field.options : []);

const picture = (option: FieldOption): Html | false => {
  const source = imageSource(option.image);
  return (
    !!source &&
    html('img', {
      class: 'fh-field__option-image',
      src: source,
      alt: '',
      loading: 'lazy',
      decoding: 'async',
      referrerpolicy: 'no-referrer',
    })
  );
};

function optionLabel(option: FieldOption, id: string, variant: OptionVariant): Child[] {
  return [
    html('label', { class: `fh-field__${variant}-label`, for: id }, option.label),
    !!option.description && html('span', { id: optionDescriptionId(id), class: 'fh-field__option-description' }, option.description),
    picture(option),
  ];
}

function optionInput(context: FieldContext, option: FieldOption, id: string, type: 'radio' | 'checkbox'): Html {
  const { field, value, readOnly } = context;
  return html('input', {
    id,
    name: field.key,
    autocomplete: field.autocomplete,
    type,
    class: `fh-field__${type}`,
    value: option.value,
    checked: optionChecked(value, option),
    disabled: optionLocked(option, value, readOnly),
    required: type === 'radio' && !!field.validation?.required,
    'aria-describedby': option.description ? optionDescriptionId(id) : undefined,
    ...readonlyAttrs(context),
  });
}

export function radio(context: FieldContext): Html {
  const { id } = context;
  return shell(
    context,
    'radio',
    optionsOf(context).map((option, index) => {
      const optionId = `${id}-${index}`;
      return html(
        'div',
        { class: 'fh-field__radio-option' },
        optionInput(context, option, optionId, 'radio'),
        optionLabel(option, optionId, 'radio'),
      );
    }),
  );
}

export function multiselect(context: FieldContext): Html {
  const { id, text, field } = context;
  const options = optionsOf(context);
  return shell(
    context,
    'multiselect',
    options.map((option, index) => {
      const optionId = `${id}-${index}`;
      return [
        dividerBefore(field, options, index) && html('div', { class: 'fh-field__option-divider' }, text('or')),
        html(
          'div',
          { class: 'fh-field__multiselect-option' },
          optionInput(context, option, optionId, 'checkbox'),
          optionLabel(option, optionId, 'multiselect'),
        ),
      ];
    }),
  );
}

export function scale(context: FieldContext): Html {
  const { id, field, value, readOnly } = context;
  const { points, anchors } = scaleView(field);
  return shell(
    context,
    field.type === 'rating' ? 'rating' : 'scale',
    points.map((point) => {
      const anchor = anchors.findIndex((item) => item?.point === point);
      const locked = readOnly && String(value) !== String(point);
      return html(
        'div',
        { class: 'fh-field__scale-option' },
        html('input', {
          id: `${id}-${point}`,
          type: 'radio',
          class: 'fh-field__scale-input',
          name: field.key,
          value: point,
          checked: String(value) === String(point),
          disabled: locked,
          required: !!field.validation?.required,
          'aria-describedby': anchor < 0 ? undefined : `${id}-anchor-${anchor}`,
        }),
        html('label', { class: 'fh-field__scale-label', for: `${id}-${point}` }, point),
      );
    }),
    anchors.some(Boolean) &&
      html(
        'div',
        { class: 'fh-field__scale-anchors', style: `--fhi-scale-points:${points.length}` },
        anchors.map((option, index) =>
          html('span', { id: option && `${id}-anchor-${index}`, class: 'fh-field__scale-anchor' }, option?.label),
        ),
      ),
  );
}

export function select(context: FieldContext): Html {
  const { field, value, readOnly } = context;
  const current = textOf(value);
  const placeholder = field.placeholder;
  return shell(
    context,
    undefined,
    html(
      'select',
      { ...controlAttrs(context), class: 'fh-field__input fh-field__input--select' },
      (!!placeholder || current === '') &&
        html('option', { value: '', disabled: true, hidden: !placeholder, selected: current === '' }, placeholder),
      optionsOf(context).map((option) =>
        html(
          'option',
          { value: option.value, disabled: optionLocked(option, value, readOnly), selected: option.value === current },
          option.label,
        ),
      ),
    ),
  );
}

export function autocomplete(context: FieldContext): Html {
  const { id, field, value, state } = context;
  const options = optionsOf(context);
  const list = `${id}-list`;
  return shell(
    context,
    undefined,
    html('input', {
      ...controlAttrs(context),
      autocomplete: field.autocomplete ?? 'off',
      type: 'text',
      list,
      class: 'fh-field__input fh-field__input--autocomplete',
      value: value == null ? '' : optionText(options, value),
      placeholder: state.placeholder,
    }),
    html(
      'datalist',
      { id: list },
      optionTexts(options).map((text) => html('option', { value: text })),
    ),
  );
}
