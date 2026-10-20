import { isGroup, isSection, type FormField, type FormNode } from '@formhaus/core';
import { fieldDomId, optionSources, providedOptions, recalled } from '@formhaus/core/internal';
import { memo, useMemo } from 'react';
import { DefaultSection } from './ContainerViews';
import { type ControllerProps, FormFieldController } from './FormFieldController';
import { FormGroupController } from './FormGroupController';
import { useRecallSnapshot, useStructureSnapshot } from './hooks/useEngineSnapshot';
import { useFieldOptions } from './hooks/useFieldOptions';
import type { FormRendererProps, OptionsProvider } from './types';

interface FormFieldsControllerProps extends ControllerProps {
  loading: boolean;
  optionsProviders?: Record<string, OptionsProvider>;
  labels?: FormRendererProps['labels'];
  confirmRemove?: boolean;
  onItemsChange: (key: string, apply: () => boolean) => boolean;
}

export const FormFieldsController = /* @__PURE__ */ memo(function FormFieldsController({
  loading,
  optionsProviders,
  labels,
  confirmRemove,
  onItemsChange,
  ...props
}: FormFieldsControllerProps) {
  const { engine, formId } = props;
  useStructureSnapshot(engine);
  useRecallSnapshot(engine);
  const fields = engine.visibleFields;
  const sources = useMemo(() => optionSources(fields), [fields]);
  const loaded = useFieldOptions(sources, engine, optionsProviders);
  const resolvedOptions = useMemo(() => providedOptions(sources, optionsProviders, loaded), [sources, optionsProviders, loaded]);
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
          onItemsChange={onItemsChange}
        />
      );
    if (!isSection(node))
      return (
        <FormFieldController
          key={node.key}
          {...props}
          field={node as FormField}
          options={resolvedOptions[node.key] ?? node.options}
          disabled={disabled}
        />
      );
    const id = fieldDomId(formId, node.key, engine.definition);
    const Section = props.components?.section ?? DefaultSection;
    const { title, description } = recalled(engine, node);
    return (
      <Section
        key={node.key}
        id={id}
        section={node}
        title={title}
        description={description}
        descriptionId={description ? `${id}-description` : undefined}
      >
        {node.fields.map(render)}
      </Section>
    );
  };

  return <div className="fh-form__fields">{engine.visibleNodes.map(render)}</div>;
});
