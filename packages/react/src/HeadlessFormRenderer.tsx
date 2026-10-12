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

let nextKey = 0;
const engineKeys = new WeakMap<object, number>();

function engineKey(engine: object): number {
  let key = engineKeys.get(engine);
  if (key === undefined) engineKeys.set(engine, key = nextKey++);
  return key;
}

const CONTROLS = 'input:not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled)';

function firstControl(root: Element | null | undefined) {
  return root?.matches(CONTROLS) ? root : root?.querySelector(CONTROLS);
}

export function HeadlessFormRenderer(props: FormRendererProps) {
  const { definition, initialValues, loading = false, components, optionsProviders,
    actionsComponent, progressComponent, headingLevel = 2, onAnalyticsEvent } = props;
  const formRef = useRef<HTMLFormElement>(null);
  const focusPending = useRef(false);
  const focusReturn = useRef<HTMLElement | null>(null);
  const wasBusy = useRef(false);
  const engineOptions: FormEngineOptions = {
    ...props,
    onAfterStepChange: async (context) => {
      focusPending.current = true;
      if (context.reason !== 'back') {
        onAnalyticsEvent?.({ type: context.reason === 'skip' ? 'step_skipped' : 'step_completed', stepId: context.fromStepId });
        onAnalyticsEvent?.({ type: 'step_viewed', stepId: context.toStepId, stepIndex: engine.currentStepIndex });
      }
      await props.onAfterStepChange?.(context);
    },
  };
  const engine = useFormEngineStore(definition, initialValues, engineOptions);
  const version = useFormSnapshot(engine);
  const previousStep = useRef(engine.currentStep?.id);
  const actions = useRendererActions(engine, props);
  const handledInvalid = useRef(0);

  const appliedErrors = useRef<{ engine: typeof engine; errors: Record<string, string> } | null>(null);
  useEffect(() => {
    if (!props.errors) return;
    const previous = appliedErrors.current?.engine === engine ? appliedErrors.current.errors : undefined;
    if (!shouldApplyExternalErrors(engine, previous, props.errors)) return;
    appliedErrors.current = { engine, errors: props.errors };
    engine.setErrors(props.errors);
  }, [props.errors, engine]);

  useEffect(() => {
    if (previousStep.current !== engine.currentStep?.id || handledInvalid.current !== actions.invalidAttempts) focusPending.current = true;
    previousStep.current = engine.currentStep?.id;
    handledInvalid.current = actions.invalidAttempts;
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
    const fields = formRef.current?.querySelector('.fh-form__fields');
    const target = firstControl(fields?.querySelector('[aria-invalid="true"]')) ?? firstControl(fields);
    ((target as HTMLElement | null | undefined) ?? formRef.current)?.focus();
  }, [engine, version, actions.invalidAttempts]);

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
      <FormProgressController engine={engine} ProgressComponent={progressComponent} headingLevel={headingLevel} />
      <FormFieldsController key={engineKey(engine)} engine={engine} loading={loading} components={components}
        optionsProviders={optionsProviders} onChange={actions.update} onCommit={actions.commit}
        onBlur={handleFieldBlur} onFocus={handleFieldFocus} />
      <FormTopLevelErrors engine={engine} actionError={actions.actionError} />
      <FormActionsController engine={engine} definition={definition} loading={loading}
        ActionsComponent={actionsComponent} onSubmit={actions.submit} onNext={actions.next}
        onPrev={actions.prev} onSkip={actions.skip} onCancel={handleCancel} />
    </form>
  );
}
