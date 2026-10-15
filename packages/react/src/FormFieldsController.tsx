import { isGroup, isSection, type FormField, type FormNode } from '@formhaus/core';
import { fieldDomId } from '@formhaus/core/internal';
import { memo, useMemo } from 'react';
import { DefaultSection } from './ContainerViews';
import { type ControllerProps, FormFieldController } from './FormFieldController';
import { FormGroupController } from './FormGroupController';
import { useFormSnapshot, useStructureSnapshot } from './hooks/useEngineSnapshot';
import { useFieldOptions } from './hooks/useFieldOptions';
import type { FormRendererProps, OptionsProvider } from './types';

interface FormFieldsControllerProps extends ControllerProps {
  loading: boolean;
  optionsProviders?: Record<string, OptionsProvider>;
  labels?: FormRendererProps['labels'];
  confirmRemove?: boolean;
}

export const FormFieldsController = memo(function FormFieldsController({
  loading,
  optionsProviders,
  labels,
  confirmRemove,
  ...props
}: FormFieldsControllerProps) {
  const { engine, formId } = props;
  useStructureSnapshot(engine);
  useFormSnapshot(engine);
  const fields = engine.visibleFields;
  const optionFields = useMemo(
    (): FormField[] => fields.flatMap((field) => (isGroup(field) ? [field, ...field.fields] : [field])),
    [fields],
  );
  const loaded = useFieldOptions(optionFields, engine, optionsProviders);
  const resolvedOptions = useMemo(
    () =>
      Object.fromEntries(
        optionFields.flatMap((field) =>
          field.optionsFrom && optionsProviders?.[field.optionsFrom] && loaded[field.key] ? [[field.key, loaded[field.key]]] : [],
        ),
      ),
    [optionFields, optionsProviders, loaded],
  );
  const disabled = loading || engine.stepValidating || engine.submitting;

  const render = (node: FormNode) => {
    if (isGroup(node))
      return (
        <FormGroupController
          key={node.key}
          {...props}
          group={node}
          disabled={disabled}
          options={resolvedOptions}
          labels={labels}
          confirmRemove={confirmRemove}
        />
      );
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
    const id = fieldDomId(formId, node.key, engine.definition);
    const Section = props.components?.section ?? DefaultSection;
    return (
      <Section
        key={node.key}
        id={id}
        section={node}
        title={node.title}
        description={node.description}
        descriptionId={node.description ? `${id}-description` : undefined}
      >
        {node.fields.map(render)}
      </Section>
    );
  };

  return <div className="fh-form__fields">{engine.visibleNodes.map(render)}</div>;
});
