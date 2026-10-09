import { shouldApplyExternalErrors, type FormEngineOptions } from '@formhaus/core';
import { useCallback, useEffect, useRef } from 'react';
import { FormActionsController } from './FormActionsController';
import { FormFieldsController } from './FormFieldsController';
import { FormProgressController } from './FormProgressController';
import { FormTopLevelErrors } from './FormTopLevelErrors';
import { useFormEngineStore } from './hooks/useFormEngine';
import { useFormSnapshot } from './hooks/useEngineSnapshot';
import { useRendererActions } from './hooks/useRendererActions';
import type { FormRendererProps } from './types';

export function HeadlessFormRenderer(props: FormRendererProps) {
  const { definition, initialValues, loading = false, components, optionsProviders,
    ActionsComponent, ProgressComponent, onAnalyticsEvent } = props;
  const formRef = useRef<HTMLFormElement>(null);
  const focusPending = useRef(false);
  const focusReturn = useRef<HTMLElement | null>(null);
  const wasBusy = useRef(false);
  const engineOptions: FormEngineOptions = {
    ...props,
    onAfterStepChange: async (context) => {
      focusPending.current = true;
      props.onStepChange?.(context.toStepId, context.direction);
      if (context.direction === 'next') {
        onAnalyticsEvent?.({ type: 'step_completed', stepId: context.fromStepId });
        onAnalyticsEvent?.({ type: 'step_viewed', stepId: context.toStepId, stepIndex: engine.currentStepIndex });
      }
      await props.onAfterStepChange?.(context);
    },
  };
  const engine = useFormEngineStore(definition, initialValues, engineOptions);
  const version = useFormSnapshot(engine);
  const previousStep = useRef(engine.currentStep?.id);
  const actions = useRendererActions(engine, props);

  const appliedErrors = useRef<{ engine: typeof engine; errors: Record<string, string> } | null>(null);
  useEffect(() => {
    if (!props.errors) return;
    const previous = appliedErrors.current?.engine === engine ? appliedErrors.current.errors : undefined;
    if (!shouldApplyExternalErrors(engine, previous, props.errors)) return;
    appliedErrors.current = { engine, errors: props.errors };
    engine.setErrors(props.errors);
  }, [props.errors, engine]);

  useEffect(() => {
    if (previousStep.current !== engine.currentStep?.id) focusPending.current = true;
    previousStep.current = engine.currentStep?.id;
    if (engine.stepValidating || engine.submitting) {
      wasBusy.current = true;
      return;
    }
    const restore = wasBusy.current;
    wasBusy.current = false;
    if (!focusPending.current) {
      const document = formRef.current?.ownerDocument;
      if (restore && document?.activeElement === document?.body && focusReturn.current?.isConnected) focusReturn.current.focus();
      return;
    }
    focusPending.current = false;
    const target = formRef.current?.querySelector<HTMLElement>(
      '.fh-form__fields input:not(:disabled), .fh-form__fields select:not(:disabled), .fh-form__fields textarea:not(:disabled), .fh-form__fields button:not(:disabled)',
    );
    (target ?? formRef.current)?.focus();
  }, [engine, version]);

  const handleFieldFocus = useCallback((key: string) => {
    onAnalyticsEvent?.({ type: 'field_focused', fieldKey: key });
  }, [onAnalyticsEvent]);
  const handleFieldBlur = useCallback((key: string) => {
    onAnalyticsEvent?.({ type: 'field_blurred', fieldKey: key,
      hasValue: engine.values[key] !== undefined && engine.values[key] !== '' });
  }, [engine, onAnalyticsEvent]);
  const handleCancel = useCallback(() => props.onCancel?.(), [props.onCancel]);

  return (
    <form ref={formRef} onFocusCapture={(event) => { focusReturn.current = event.target; }} className="fh-form" tabIndex={-1} aria-busy={engine.stepValidating || engine.submitting || loading}
      onSubmit={(event) => { event.preventDefault(); void (engine.isLastStep ? actions.submit() : actions.next()); }}>
      <FormProgressController engine={engine} ProgressComponent={ProgressComponent} />
      <FormFieldsController key={definition.id} engine={engine} loading={loading} components={components}
        optionsProviders={optionsProviders} onChange={actions.update} onCommit={actions.commit}
        onBlur={handleFieldBlur} onFocus={handleFieldFocus} />
      <FormTopLevelErrors engine={engine} />
      <FormActionsController engine={engine} definition={definition} loading={loading}
        ActionsComponent={ActionsComponent} onSubmit={actions.submit} onNext={actions.next}
        onPrev={actions.prev} onCancel={handleCancel} />
    </form>
  );
}
