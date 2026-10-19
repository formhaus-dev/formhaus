import type { FormEngineOptions, FormEvent } from '@formhaus/core';
import {
  applySources,
  canMoveFocus,
  errorDomId,
  focusField,
  hasValue,
  labelFor,
  restoreFocus,
  shouldApplyExternalErrors,
  warnMissingComponents,
} from '@formhaus/core/internal';
import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import { FormActionsController } from './FormActionsController';
import { FormErrorSummary } from './FormErrorSummary';
import { FormFieldsController } from './FormFieldsController';
import { FormProgressController } from './FormProgressController';
import { FormTopLevelErrors } from './FormTopLevelErrors';
import { LabelContext } from './labels';
import { useFormEngineStore } from './hooks/useFormEngine';
import { useFormSnapshot } from './hooks/useEngineSnapshot';
import { useRendererActions } from './hooks/useRendererActions';
import type { FormRendererHandle, FormRendererProps } from './types';

let nextKey = 0;
const engineKeys = new WeakMap<object, number>();
const sourced = new WeakMap<object, object>();

function engineKey(engine: object): number {
  let key = engineKeys.get(engine);
  if (key === undefined) engineKeys.set(engine, (key = nextKey++));
  return key;
}

export const HeadlessFormRenderer = forwardRef<FormRendererHandle, FormRendererProps>(function HeadlessFormRenderer(props, ref) {
  const {
    definition,
    initialValues,
    loading = false,
    components,
    optionsProviders,
    actionsComponent,
    progressComponent,
    headingLevel = 2,
  } = props;
  const handlers = useRef(props);
  handlers.current = props;
  const onFormEvent = useCallback((event: FormEvent) => {
    handlers.current.onFormEvent?.(event);
    handlers.current.onAnalyticsEvent?.(event);
  }, []);
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const focusPending = useRef(false);
  const focusKey = useRef<string | null>(null);
  const focusReturn = useRef<HTMLElement | null>(null);
  const [focusRequest, setFocusRequest] = useState(0);
  const requestFocus = () => {
    focusPending.current = true;
    setFocusRequest((request) => request + 1);
  };
  const wasBusy = useRef(false);
  const engineOptions: FormEngineOptions = {
    ...props,
    onFormEvent: props.onFormEvent || props.onAnalyticsEvent ? onFormEvent : undefined,
    onAfterStepChange: async (context) => {
      focusPending.current = true;
      await props.onAfterStepChange?.(context);
    },
  };
  const engine = useFormEngineStore(definition, initialValues, engineOptions);
  const version = useFormSnapshot(engine);
  const previousStep = useRef(engine.currentStep?.id);
  const actions = useRendererActions(engine, props);
  useImperativeHandle(ref, () => ({ setValue: (key, value) => engine.setValue(key, value), getValues: () => ({ ...engine.values }) }), [
    engine,
  ]);
  const handledInvalid = useRef(0);

  const onValuesChange = useRef(props.onValuesChange);
  onValuesChange.current = props.onValuesChange;
  const emitted = useRef<object | null>(null);
  useEffect(() => {
    if (sourced.get(engine) !== engine.definition) {
      applySources(engine, sourced.has(engine) ? engine.values : initialValues);
      sourced.set(engine, engine.definition);
    }
    engine.start();
    const emit = () => {
      const values = onValuesChange.current && engine.getValuesSnapshot();
      if (values && values !== emitted.current) onValuesChange.current!((emitted.current = values));
    };
    const unsubscribe = engine.subscribeValues(emit);
    try {
      emit();
    } catch (error) {
      unsubscribe();
      throw error;
    }
    return unsubscribe;
  }, [engine, definition]);

  const [warned] = useState(() => new Set<string>());
  useEffect(() => {
    let warn: (() => void) | undefined;
    try {
      if (process.env.NODE_ENV !== 'production') warn = () => warnMissingComponents(definition, components, warned, props.onWarning);
    } catch {}
    warn?.();
  }, [definition, components]);

  const appliedErrors = useRef<{ engine: typeof engine; errors: Record<string, string> } | null>(null);
  useEffect(() => {
    if (!props.errors) return;
    const previous = appliedErrors.current?.engine === engine ? appliedErrors.current.errors : undefined;
    if (!shouldApplyExternalErrors(engine, previous, props.errors)) return;
    appliedErrors.current = { engine, errors: props.errors };
    engine.setErrors(props.errors);
    if (Object.keys(props.errors).length > 0 && canMoveFocus(formRef.current)) requestFocus();
  }, [props.errors, engine]);

  useEffect(() => {
    if (version !== engine.getSnapshot()) return;
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
      if (restore) restoreFocus(formRef.current, focusReturn.current);
      return;
    }
    focusPending.current = false;
    const key = focusKey.current;
    focusKey.current = null;
    focusField(formRef.current, key && errorDomId(engine, formId, key));
  }, [engine, version, actions.invalidAttempts, focusRequest]);

  const handleFieldFocus = useCallback(
    (key: string) => {
      onFormEvent({ type: 'field_focused', fieldKey: key });
    },
    [onFormEvent],
  );
  const handleFieldBlur = useCallback(
    (key: string) => {
      onFormEvent({ type: 'field_blurred', fieldKey: key, hasValue: hasValue(engine, key) });
    },
    [engine, onFormEvent],
  );
  const handleCancel = useCallback(() => props.onCancel?.(), [props.onCancel]);
  const showField = useCallback(
    (key: string) => {
      focusKey.current = key;
      requestFocus();
      engine.goToStepWithField(key);
    },
    [engine],
  );

  return (
    <form
      ref={formRef}
      lang={definition.lang}
      onFocusCapture={(event) => {
        focusReturn.current = event.target;
      }}
      className="fh-form"
      tabIndex={-1}
      aria-busy={engine.stepValidating || engine.submitting || loading}
      onSubmit={(event) => {
        event.preventDefault();
        void (engine.isLastStep ? actions.submit() : actions.next());
      }}
    >
      <FormProgressController
        engine={engine}
        ProgressComponent={progressComponent}
        headingLevel={headingLevel}
        marks={props.stepErrorMarks}
        labels={props.labels}
      />
      {props.errorSummary && <FormErrorSummary engine={engine} formId={formId} onSelect={showField} labels={props.labels} />}
      <LabelContext.Provider value={(key, params = {}) => labelFor(key, params, props.labels, engine.definition.labels)}>
        <FormFieldsController
          key={engineKey(engine)}
          engine={engine}
          formId={formId}
          loading={loading}
          components={components}
          optionsProviders={optionsProviders}
          labels={props.labels}
          confirmRemove={props.confirmRemove}
          onChange={actions.update}
          onItemsChange={actions.changeItems}
          onCommit={actions.commit}
          onBlur={handleFieldBlur}
          onFocus={handleFieldFocus}
        />
      </LabelContext.Provider>
      <FormTopLevelErrors engine={engine} actionError={actions.actionError} />
      <FormActionsController
        engine={engine}
        loading={loading}
        labels={props.labels}
        ActionsComponent={actionsComponent}
        onSubmit={actions.submit}
        onNext={actions.next}
        onPrev={actions.prev}
        onSkip={actions.skip}
        onCancel={handleCancel}
      />
    </form>
  );
});
