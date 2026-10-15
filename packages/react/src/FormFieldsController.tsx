import { isGroup, isSection, type FormNode } from '@formhaus/core';
import { fieldDomId } from '@formhaus/core/internal';
import { memo, useMemo } from 'react';
import { type ControllerProps, FormFieldController } from './FormFieldController';
import { FormGroupController } from './FormGroupController';
import { useFormSnapshot, useStructureSnapshot } from './hooks/useEngineSnapshot';
import { useFieldOptions } from './hooks/useFieldOptions';
import type { FormRendererProps, OptionsProvider } from './types';

interface FormFieldsControllerProps extends ControllerProps {
  loading: boolean;
  optionsProviders?: Record<string, OptionsProvider>;
  labels?: FormRendererProps['labels'];
}

export const FormFieldsController = memo(function FormFieldsController({
  loading,
  optionsProviders,
  labels,
  ...props
}: FormFieldsControllerProps) {
  const { engine, formId } = props;
  useStructureSnapshot(engine);
  useFormSnapshot(engine);
  const fields = engine.visibleFields;
  const optionFields = useMemo(() => fields.flatMap((field) => (isGroup(field) ? [field, ...field.fields] : [field])), [fields]);
  const resolvedOptions = useFieldOptions(optionFields, engine, optionsProviders);
  const disabled = loading || engine.stepValidating || engine.submitting;

  const render = (node: FormNode) => {
    if (isGroup(node))
      return <FormGroupController key={node.key} {...props} group={node} disabled={disabled} options={resolvedOptions} labels={labels} />;
    if (!isSection(node))
      return (
        <FormFieldController
          key={node.key}
          {...props}
          field={node}
          options={resolvedOptions[node.key] ?? node.options}
          disabled={disabled}
        />
      );
    const id = fieldDomId(formId, node.key);
    return (
      <fieldset key={node.key} id={id} className="fh-section" aria-describedby={node.description ? `${id}-description` : undefined}>
        <legend className="fh-section__title">{node.title}</legend>
        {node.description && (
          <p id={`${id}-description`} className="fh-field__helper fh-section__description">
            {node.description}
          </p>
        )}
        <div className="fh-section__body">{node.fields.map(render)}</div>
      </fieldset>
    );
  };

  return <div className="fh-form__fields">{engine.visibleNodes.map(render)}</div>;
});
