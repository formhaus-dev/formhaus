import type { FormEngine, FormEngineOptions } from '@formhaus/core';
import { memo, useCallback, useEffect, useSyncExternalStore } from 'react';
import { FormActions } from './FormActions';
import { FormFieldController } from './FormFieldController';
import { FormStepProgress } from './FormStepProgress';
import { useFieldOptions } from './hooks/useFieldOptions';
import { useFormEngineStore } from './hooks/useFormEngine';
import type { FieldComponentMap, FormRendererProps, OptionsProvider } from './types';

function useFormSnapshot(engine: FormEngine): void {
  const subscribe = useCallback((listener: () => void) => engine.subscribe(listener), [engine]);
  const getSnapshot = useCallback(() => engine.getSnapshot(), [engine]);
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function useStructureSnapshot(engine: FormEngine): void {
  const subscribe = useCallback(
    (listener: () => void) => engine.subscribeStructure(listener),
    [engine],
  );
  const getSnapshot = useCallback(() => engine.getStructureSnapshot(), [engine]);
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

interface FormProgressProps {
  engine: FormEngine;
  ProgressComponent: FormRendererProps['ProgressComponent'];
}

function FormProgress({ engine, ProgressComponent }: FormProgressProps) {
  useStructureSnapshot(engine);
  if (!engine.isMultiStep) return null;

  const ProgressComp = ProgressComponent ?? FormStepProgress;
  return (
    <ProgressComp
      current={engine.progress.current}
      total={engine.progress.total}
      stepTitle={engine.currentStep?.title}
      stepDescription={engine.currentStep?.description}
    />
  );
}

interface FormFieldsProps {
  engine: FormEngine;
  loading: boolean;
  components?: FieldComponentMap;
  optionsProviders?: Record<string, OptionsProvider>;
  onChange: (key: string, value: unknown) => void;
  onBlur: (key: string) => void;
  onFocus: (key: string) => void;
}

const FormFields = memo(function FormFields({
  engine,
  loading,
  components,
  optionsProviders,
  onChange,
  onBlur,
  onFocus,
}: FormFieldsProps) {
  useStructureSnapshot(engine);
  const fields = engine.visibleFields;
  const resolvedOptions = useFieldOptions(fields, engine, optionsProviders);

  return (
    <div className="fh-form__fields">
      {fields.map((field) => (
        <FormFieldController
          key={field.key}
          engine={engine}
          field={field}
          options={resolvedOptions[field.key] ?? field.options}
          disabled={loading}
          components={components}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
        />
      ))}
    </div>
  );
});

function FormTopLevelErrors({ engine }: { engine: FormEngine }) {
  useFormSnapshot(engine);
  if (engine.topLevelErrors.length === 0) return null;

  return (
    <div className="fh-form__top-errors">
      {engine.topLevelErrors.map((error) => (
        <p key={error} className="fh-form__top-error">
          {error}
        </p>
      ))}
    </div>
  );
}

interface FormActionsControllerProps {
  engine: FormEngine;
  definition: FormRendererProps['definition'];
  loading: boolean;
  ActionsComponent: FormRendererProps['ActionsComponent'];
  onSubmit: () => void;
  onNext: () => Promise<void>;
  onPrev: () => void;
  onCancel: () => void;
}

function FormActionsController({
  engine,
  definition,
  loading,
  ActionsComponent,
  onSubmit,
  onNext,
  onPrev,
  onCancel,
}: FormActionsControllerProps) {
  useFormSnapshot(engine);

  const ActionsComp = ActionsComponent ?? FormActions;
  const effectiveIsLastStep = engine.isLastStep || !engine.isMultiStep;
  const primaryLabel = engine.isMultiStep && !effectiveIsLastStep
    ? (engine.currentStep?.next?.label ?? 'Continue')
    : (definition.submit?.label ?? 'Submit');
  const showBack = engine.isMultiStep && !engine.isFirstStep && engine.currentStep?.back !== false;
  const backLabel = typeof engine.currentStep?.back === 'object'
    ? (engine.currentStep.back.label ?? 'Back')
    : 'Back';
  const handlePrimary = useCallback(async () => {
    if (engine.isMultiStep && !effectiveIsLastStep) {
      await onNext();
    } else {
      onSubmit();
    }
  }, [effectiveIsLastStep, engine, onNext, onSubmit]);

  return (
    <ActionsComp
      submitAction={definition.submit}
      backAction={engine.currentStep?.back}
      cancelAction={definition.cancel}
      isFirstStep={engine.isFirstStep}
      isLastStep={effectiveIsLastStep}
      isMultiStep={engine.isMultiStep}
      loading={loading || engine.stepValidating}
      values={engine.values}
      onSubmit={onSubmit}
      onNext={onNext}
      onPrev={onPrev}
      onCancel={onCancel}
      primaryLabel={primaryLabel}
      showBack={showBack}
      backLabel={backLabel}
      onPrimary={handlePrimary}
    />
  );
}

export function FormRenderer({
  definition,
  initialValues,
  onSubmit,
  onCancel,
  onStepChange,
  onFieldChange,
  validators,
  onStepValidate,
  errors: externalErrors,
  loading = false,
  components,
  optionsProviders,
  ActionsComponent,
  ProgressComponent,
  onAnalyticsEvent,
}: FormRendererProps) {
  const engineOptions: FormEngineOptions = { validators, onStepValidate };
  const engine = useFormEngineStore(definition, initialValues, engineOptions);

  useEffect(() => {
    if (externalErrors) {
      engine.setErrors(externalErrors);
    }
  }, [externalErrors, engine]);

  const handleFieldUpdate = useCallback((key: string, value: unknown) => {
    engine.setValue(key, value);
    onFieldChange?.(key, value, engine.values);
  }, [engine, onFieldChange]);

  const handleFieldFocus = useCallback((key: string) => {
    onAnalyticsEvent?.({ type: 'field_focused', fieldKey: key });
  }, [onAnalyticsEvent]);

  const handleFieldBlur = useCallback((key: string) => {
    onAnalyticsEvent?.({
      type: 'field_blurred',
      fieldKey: key,
      hasValue: engine.values[key] !== undefined && engine.values[key] !== '',
    });
  }, [engine, onAnalyticsEvent]);

  const submit = useCallback(() => {
    const allErrors = engine.validate();
    for (const [key, message] of Object.entries(allErrors)) {
      onAnalyticsEvent?.({ type: 'field_error', fieldKey: key, error: message });
    }
    if (Object.keys(allErrors).length > 0) return;

    const submitValues = engine.getSubmitValues();
    onAnalyticsEvent?.({ type: 'form_submitted', fieldCount: Object.keys(submitValues).length });
    onSubmit(submitValues as Record<string, unknown>);
  }, [engine, onAnalyticsEvent, onSubmit]);

  const handleSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    submit();
  }, [submit]);

  const handleNext = useCallback(async () => {
    const previousStep = engine.currentStep;
    const success = await engine.nextStepAsync();
    if (!success) return;

    if (previousStep) {
      onAnalyticsEvent?.({ type: 'step_completed', stepId: previousStep.id });
    }
    if (engine.currentStep) {
      onStepChange?.(engine.currentStep.id, 'next');
      onAnalyticsEvent?.({
        type: 'step_viewed',
        stepId: engine.currentStep.id,
        stepIndex: engine.currentStepIndex,
      });
    }
  }, [engine, onAnalyticsEvent, onStepChange]);

  const handlePrev = useCallback(() => {
    engine.prevStep();
    if (engine.currentStep) {
      onStepChange?.(engine.currentStep.id, 'back');
    }
  }, [engine, onStepChange]);

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  return (
    <form className="fh-form" onSubmit={handleSubmit}>
      <FormProgress engine={engine} ProgressComponent={ProgressComponent} />
      <FormFields
        key={definition.id}
        engine={engine}
        loading={loading}
        components={components}
        optionsProviders={optionsProviders}
        onChange={handleFieldUpdate}
        onBlur={handleFieldBlur}
        onFocus={handleFieldFocus}
      />
      <FormTopLevelErrors engine={engine} />
      <FormActionsController
        engine={engine}
        definition={definition}
        loading={loading}
        ActionsComponent={ActionsComponent}
        onSubmit={submit}
        onNext={handleNext}
        onPrev={handlePrev}
        onCancel={handleCancel}
      />
    </form>
  );
}
