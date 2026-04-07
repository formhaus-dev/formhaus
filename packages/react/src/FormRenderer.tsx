import type { FormEngineOptions } from '@formhaus/core';
import { useEffect } from 'react';
import { FormActions } from './FormActions';
import { FormField } from './FormField';
import { FormStepProgress } from './FormStepProgress';
import { useFieldOptions } from './hooks/useFieldOptions';
import { useFormEngine } from './hooks/useFormEngine';
import type { FormRendererProps } from './types';

export function FormRenderer({
  schema,
  initialValues,
  onSubmit,
  onCancel,
  onStepChange,
  onFieldChange,
  validators,
  errors: externalErrors,
  loading = false,
  components,
  optionsProviders,
  ActionsComponent,
  ProgressComponent,
  onAnalyticsEvent,
}: FormRendererProps) {
  const engineOptions: FormEngineOptions = { validators };
  const engine = useFormEngine(schema, initialValues, engineOptions);
  const resolvedOptions = useFieldOptions(engine.visibleFields, engine.values, optionsProviders);

  useEffect(() => {
    if (externalErrors) {
      engine.setErrors(externalErrors);
    }
  }, [externalErrors, engine]);

  function handleFieldUpdate(key: string, value: unknown) {
    engine.setValue(key, value);
    onFieldChange?.(key, value, engine.values);
  }

  function handleFieldFocus(key: string) {
    onAnalyticsEvent?.({ type: 'field_focused', fieldKey: key });
  }

  function handleFieldBlur(key: string) {
    onAnalyticsEvent?.({
      type: 'field_blurred',
      fieldKey: key,
      hasValue: engine.values[key] !== undefined && engine.values[key] !== '',
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const allErrors = engine.validate();
    for (const [key, msg] of Object.entries(allErrors)) {
      onAnalyticsEvent?.({ type: 'field_error', fieldKey: key, error: msg });
    }
    if (Object.keys(allErrors).length > 0) return;
    const submitValues = engine.getSubmitValues();
    onAnalyticsEvent?.({ type: 'form_submitted', fieldCount: Object.keys(submitValues).length });
    onSubmit(submitValues as Record<string, unknown>);
  }

  function handleNext() {
    const prevStep = engine.currentStep;
    const success = engine.nextStep();
    if (success) {
      if (prevStep) {
        onAnalyticsEvent?.({ type: 'step_completed', stepId: prevStep.id });
      }
      if (engine.currentStep) {
        onStepChange?.(engine.currentStep.id, 'next');
        onAnalyticsEvent?.({
          type: 'step_viewed',
          stepId: engine.currentStep.id,
          stepIndex: engine.currentStepIndex,
        });
      }
    }
  }

  function handlePrev() {
    engine.prevStep();
    if (engine.currentStep) {
      onStepChange?.(engine.currentStep.id, 'back');
    }
  }

  function handleCancel() {
    onCancel?.();
  }

  const ProgressComp = ProgressComponent ?? FormStepProgress;
  const ActionsComp = ActionsComponent ?? FormActions;

  const effectiveIsLastStep = engine.isLastStep || !engine.isMultiStep;
  const computedPrimaryLabel = engine.isMultiStep && !effectiveIsLastStep
    ? (engine.currentStep?.next?.label ?? 'Continue')
    : (schema.submit?.label ?? 'Submit');
  const computedShowBack = engine.isMultiStep && !engine.isFirstStep && engine.currentStep?.back !== false;
  const computedBackLabel = typeof engine.currentStep?.back === 'object'
    ? (engine.currentStep.back.label ?? 'Back')
    : 'Back';

  function handlePrimary() {
    if (engine.isMultiStep && !effectiveIsLastStep) {
      handleNext();
    } else {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    }
  }

  return (
    <form className="fh-form" onSubmit={handleSubmit}>
      {engine.isMultiStep && (
        <ProgressComp
          current={engine.progress.current}
          total={engine.progress.total}
          stepTitle={engine.currentStep?.title}
          stepDescription={engine.currentStep?.description}
        />
      )}

      <div className="fh-form__fields">
        {engine.visibleFields.map((field) => {
          const fieldWithOptions = resolvedOptions[field.key]
            ? { ...field, options: resolvedOptions[field.key] }
            : field;
          return (
            <FormField
              key={field.key}
              field={fieldWithOptions}
              value={engine.values[field.key]}
              error={engine.errors[field.key]}
              loading={engine.fieldLoading[field.key]}
              disabled={loading}
              components={components}
              onChange={(v) => handleFieldUpdate(field.key, v)}
              onBlur={() => handleFieldBlur(field.key)}
              onFocus={() => handleFieldFocus(field.key)}
            />
          );
        })}
      </div>

      {engine.topLevelErrors.length > 0 && (
        <div className="fh-form__top-errors">
          {engine.topLevelErrors.map((error) => (
            <p key={error} className="fh-form__top-error">
              {error}
            </p>
          ))}
        </div>
      )}

      <ActionsComp
        submitAction={schema.submit}
        backAction={engine.currentStep?.back}
        cancelAction={schema.cancel}
        isFirstStep={engine.isFirstStep}
        isLastStep={effectiveIsLastStep}
        isMultiStep={engine.isMultiStep}
        loading={loading}
        values={engine.values}
        onSubmit={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
        onNext={handleNext}
        onPrev={handlePrev}
        onCancel={handleCancel}
        primaryLabel={computedPrimaryLabel}
        showBack={computedShowBack}
        backLabel={computedBackLabel}
        onPrimary={handlePrimary}
      />
    </form>
  );
}
