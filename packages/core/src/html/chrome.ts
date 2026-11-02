import type { FormEngine } from '../engine';
import { engineLabel } from '../i18n/labels';
import { actionValues } from '../internal/actions';
import { errorSummary } from '../internal/items';
import type { LabelSource } from '../types';
import { isActionDisabled } from '../visibility';
import { type Child, type Html, html } from './markup';

export function actions(engine: FormEngine, labels?: LabelSource): Html {
  const { submit } = engine.definition;
  return html(
    'div',
    { class: 'fh-form-actions', 'data-fh': 'actions' },
    html('div', { class: 'fh-form-actions__secondary' }),
    html(
      'button',
      {
        type: 'submit',
        class: 'fh-form-actions__button fh-form-actions__button--primary',
        disabled: !!submit.disabled && isActionDisabled(submit, actionValues(engine)),
      },
      submit.label ?? engineLabel(engine, 'submit', {}, labels),
    ),
  );
}

export function summary(engine: FormEngine, formId: string | undefined, labels: LabelSource | undefined): Html | false {
  if (Object.keys(engine.errors).length === 0) return false;
  const entries = errorSummary(engine, { idPrefix: formId, labels }).groups.flatMap((group) => group.entries);
  if (entries.length === 0) return false;
  return html(
    'div',
    { class: 'fh-error-summary', 'data-fh': 'error-summary', role: 'alert', tabindex: -1 },
    html('strong', { class: 'fh-error-summary__title' }, engineLabel(engine, 'errorSummary', {}, labels)),
    html(
      'ul',
      { class: 'fh-error-summary__list' },
      entries.map(({ id, text }) => html('li', {}, html('a', { class: 'fh-error-summary__link', href: `#${id}` }, text))),
    ),
  );
}

export function formErrors(errors: readonly string[]): Child {
  return (
    errors.length > 0 &&
    html(
      'div',
      { class: 'fh-form__top-errors', 'data-fh': 'form-errors', role: 'alert' },
      errors.map((error) => html('p', { class: 'fh-form__top-error' }, error)),
    )
  );
}
