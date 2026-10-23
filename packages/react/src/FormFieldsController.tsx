import { isGroup, isSection, type FieldOption, type FormField, type FormNode } from '@formhaus/core';
import { fieldDomId, matrixColumns, optionSources, providedOptions, ROOT_PROPS, recalled } from '@formhaus/core/internal';
import { memo, useMemo } from 'react';
import { DefaultSection } from './ContainerViews';
import { type ControllerProps, FormFieldController } from './FormFieldController';
import { FormGroupController } from './FormGroupController';
import { useRecallSnapshot, useStructureSnapshot } from './hooks/useEngineSnapshot';
import { useFieldOptions } from './hooks/useFieldOptions';
import type { FieldsContainerProps, FormRendererProps, LayoutComponentMap, OptionsProvider } from './types';

interface FormFieldsControllerProps extends ControllerProps {
  loading: boolean;
  optionsProviders?: Record<string, OptionsProvider>;
  labels?: FormRendererProps['labels'];
  confirmRemove?: boolean;
  layout?: LayoutComponentMap;
  onItemsChange: (key: string, apply: () => boolean) => boolean;
}

function DefaultFields({ rootProps, children }: FieldsContainerProps) {
  return (
    <div className="fh-form__fields" {...rootProps}>
      {children}
    </div>
  );
}

export const FormFieldsController = /* @__PURE__ */ memo(function FormFieldsController({
  loading,
  optionsProviders,
  labels,
  confirmRemove,
  layout,
  onItemsChange,
  ...props
}: FormFieldsControllerProps) {
  const { engine, formId } = props;
  useStructureSnapshot(engine);
  useRecallSnapshot(engine);
  const fields = engine.visibleFields;
  const sources = useMemo(() => optionSources(fields), [fields]);
  const [loaded, busy] = useFieldOptions(sources, engine, optionsProviders);
  const resolvedOptions = useMemo(() => providedOptions(sources, optionsProviders, loaded), [sources, optionsProviders, loaded]);

  const render = (node: FormNode, columns?: FieldOption[], row?: number) => {
    if (isGroup(node))
      return (
        <FormGroupController
          key={node.key}
          {...props}
          group={node}
          disabled={loading}
          options={resolvedOptions}
          busy={busy}
          labels={labels}
          confirmRemove={confirmRemove}
          layout={layout}
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
          busy={busy[node.key]}
          disabled={loading}
          columns={columns}
          row={row}
        />
      );
    const id = fieldDomId(formId, node.key, engine.definition);
    const Section = layout?.section ?? props.components?.section ?? DefaultSection;
    const { title, description } = recalled(engine, node);
    const matrix = matrixColumns(node);
    return (
      <Section
        key={node.key}
        id={id}
        section={node}
        title={title}
        description={description}
        descriptionId={description ? `${id}-description` : undefined}
      >
        {node.fields.map((child, index) => render(child, matrix, index))}
      </Section>
    );
  };

  const Fields = layout?.fields ?? DefaultFields;
  return <Fields rootProps={ROOT_PROPS.fields}>{engine.visibleNodes.map((node) => render(node))}</Fields>;
});
