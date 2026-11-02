import { FormEngine } from '../engine';
import { parsed, validDefinition } from '../definition-validation/check-definition';
import { trustDefinition } from '../engine/warnings';
import { engineLabel } from '../i18n/labels';
import { fieldDomId } from '../internal/ids';
import { recalled } from '../internal/recall';
import { fieldRules } from '../internal/rules';
import { shownOptions } from '../internal/options';
import { linkSource } from '../internal/urls';
import type { FieldOption, FormDefinition, FormField, FormNode } from '../types';
import { copyField } from '../validation/type-checks';
import { isSection } from '../visibility/nodes';
import { actions, formErrors, summary } from './chrome';
import { section } from './containers';
import { fieldRenderer } from './fields';
import { type Child, html } from './markup';
import { assertNames, pageFields } from './support';
import { fieldContext } from './shell';
import type { StaticLabel, StaticMarkupOptions } from './types';
import { plainErrors, plainTexts, plainValues } from './values';

interface Page {
  engine: FormEngine;
  options: StaticMarkupOptions;
  text: StaticLabel;
}

function renderField({ engine, options, text }: Page, field: FormField): Child {
  const provided = options.options?.[field.key];
  const given = field.optionsFrom && Array.isArray(provided) ? (provided as FieldOption[]) : field.options;
  const rules = fieldRules(engine, field, shownOptions(engine, field.key, field, given, false));
  return fieldRenderer(field.type)(
    fieldContext({
      id: fieldDomId(options.id, field.key, engine.definition),
      field: recalled(engine, rules.options === field.options ? field : copyField(field, { options: rules.options })),
      value: engine.values[field.key],
      error: engine.errors[field.key],
      readOnly: !!options.readOnly || rules.readOnly,
      text,
    }),
  );
}

function renderNodes(page: Page, nodes: readonly FormNode[]): Child[] {
  return nodes.map((node) =>
    isSection(node) ? section(page.engine, node, page.options.id, renderNodes(page, node.fields)) : renderField(page, node as FormField),
  );
}

export function renderToStaticMarkup(definition: FormDefinition, options: StaticMarkupOptions = {}): string {
  assertNames(pageFields(definition), options.hiddenInputs);
  if (!parsed.get(definition)) trustDefinition(validDefinition(definition));
  const { locale, messages, lang, seed, research, hiddenValues } = options;
  const engine = new FormEngine(definition, plainValues(options.values), { locale, messages, lang, seed, research, hiddenValues });
  if (options.errors) engine.setErrors(plainErrors(options.errors));
  const page: Page = { engine, options, text: (key, params = {}) => engineLabel(engine, key, params, options.labels) };
  const alert = options.errorSummary === false ? false : summary(engine, options.id, options.labels);
  const top = options.errorSummary === 'top';
  const hidden = options.hiddenInputs ?? {};
  return html(
    'form',
    {
      id: options.id,
      class: options.className ? `fh-form ${options.className}` : 'fh-form',
      method: options.method === 'get' ? 'get' : 'post',
      action: linkSource(options.action),
      novalidate: options.novalidate,
      lang: engine.definition.lang,
    },
    Object.keys(hidden).map((name) => html('input', { type: 'hidden', name, value: plainTexts([hidden[name]])[0] ?? '' })),
    top && alert,
    html('div', { class: 'fh-form__fields', 'data-fh': 'fields' }, renderNodes(page, engine.visibleNodes)),
    formErrors([...engine.topLevelErrors, ...plainTexts(options.formErrors)]),
    !top && alert,
    actions(engine, options.labels),
  ).value;
}
