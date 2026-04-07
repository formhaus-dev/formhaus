import type { FormEngineOptions } from '@formhaus/core';
import { useEffect } from 'react';
import { FormActions } from './FormActions';
import { FormField } from './FormField';
import { FormStepProgress } from './FormStepProgress';
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
  ActionsComponent,
  ProgressComponent,
}: FormRendererProps) {
  const engineOptions: FormEngineOptions = { validators };
  const engine = useFormEngine(schema, initialValues, engineOptions);

  // Sync external errors
  useEffect(() => {
    if (externalErrors) {
      engine.setErrors(externalErrors);
    }
  }, [externalErrors, engine]);

  function handleFieldUpdate(key: string, value: unknown) {
    engine.setValue(key, value);
    onFieldChange?.(key, value, engine.values);
  }

  function handleFieldBlur(_key: string) {
    // Intentionally no validation on blur.
    // Validation runs only on Submit / Continue click.
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const allErrors = engine.validate();
    if (Object.keys(allErrors).length > 0) return;
    const submitValues = engine.getSubmitValues();
    onSubmit(submitValues as Record<string, unknown>);
  }

  function handleNext() {
    const success = engine.nextStep();
    if (success && engine.currentStep) {
      onStepChange?.(engine.currentStep.id, 'next');
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
        {engine.visibleFields.map((field) => (
          <FormField
            key={field.key}
            field={field}
            value={engine.values[field.key]}
            error={engine.errors[field.key]}
            loading={engine.fieldLoading[field.key]}
            disabled={loading}
            components={components}
            onChange={(v) => handleFieldUpdate(field.key, v)}
            onBlur={() => handleFieldBlur(field.key)}
          />
        ))}
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
        isLastStep={engine.isLastStep || !engine.isMultiStep}
        isMultiStep={engine.isMultiStep}
        loading={loading}
        onSubmit={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
        onNext={handleNext}
        onPrev={handlePrev}
        onCancel={handleCancel}
      />
    </form>
  );
}
