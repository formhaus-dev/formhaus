import type { FormEngine } from '../engine';
import { matrixColumns } from '../internal';
import { fieldDomId } from '../internal/ids';
import { recalled } from '../internal/recall';
import type { FormSection } from '../types';
import { type Child, type Html, html } from './markup';

export function section(engine: FormEngine, node: FormSection, formId: string | undefined, children: Child[]): Html {
  const id = fieldDomId(formId, node.key, engine.definition);
  const { title, description } = recalled(engine, node);
  const columns = matrixColumns(node, engine);
  const descriptionId = description ? `${id}-description` : undefined;
  return html(
    'fieldset',
    {
      id,
      class: columns ? 'fh-section fh-section--matrix' : 'fh-section',
      'aria-describedby': descriptionId,
      style: columns ? `--fhi-matrix-columns:${columns.length}` : undefined,
    },
    html('legend', { class: 'fh-section__title' }, title),
    !!description && html('p', { id: descriptionId, class: 'fh-field__helper fh-section__description' }, description),
    html(
      'div',
      { class: 'fh-section__body' },
      columns &&
        html(
          'div',
          { class: 'fh-section__matrix-header', 'aria-hidden': true },
          columns.map((option) =>
            html('span', { class: option.disabled === true ? 'fh-section__matrix-disabled' : undefined }, option.label),
          ),
        ),
      children,
    ),
  );
}
