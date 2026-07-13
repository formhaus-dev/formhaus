import type { FormEngineOptions } from '@formhaus/core';
import { useCallback, useEffect } from 'react';
import { FormActionsController } from './FormActionsController';
import { FormFieldsController } from './FormFieldsController';
import { FormProgressController } from './FormProgressController';
import { FormTopLevelErrors } from './FormTopLevelErrors';
import { useFormEngineStore } from './hooks/useFormEngine';
import type { FormRendererProps } from './types';

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
    if (externalErrors) engine.setErrors(externalErrors);
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
    const errors = engine.validate();
    for (const [key, message] of Object.entries(errors)) {
      onAnalyticsEvent?.({ type: 'field_error', fieldKey: key, error: message });
    }
    if (Object.keys(errors).length > 0) return;
    const values = engine.getSubmitValues();
    onAnalyticsEvent?.({ type: 'form_submitted', fieldCount: Object.keys(values).length });
    onSubmit(values);
  }, [engine, onAnalyticsEvent, onSubmit]);

  const handleSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    submit();
  }, [submit]);

  const handleNext = useCallback(async () => {
    const previousStep = engine.currentStep;
    if (!await engine.nextStepAsync()) return;
    if (previousStep) {
      onAnalyticsEvent?.({ type: 'step_completed', stepId: previousStep.id });
    }
    if (!engine.currentStep) return;
    onStepChange?.(engine.currentStep.id, 'next');
    onAnalyticsEvent?.({
      type: 'step_viewed',
      stepId: engine.currentStep.id,
      stepIndex: engine.currentStepIndex,
    });
  }, [engine, onAnalyticsEvent, onStepChange]);

  const handlePrev = useCallback(() => {
    engine.prevStep();
    if (engine.currentStep) onStepChange?.(engine.currentStep.id, 'back');
  }, [engine, onStepChange]);

  const handleCancel = useCallback(() => onCancel?.(), [onCancel]);

  return (
    <form className="fh-form" onSubmit={handleSubmit}>
      <FormProgressController engine={engine} ProgressComponent={ProgressComponent} />
      <FormFieldsController
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
