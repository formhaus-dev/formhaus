import type { FormEvent } from '../types/analytics';
import type { EngineInternals } from './runtime-internals';

export function emit(engine: EngineInternals, event: FormEvent): void {
  try {
    engine.lifecycle.onFormEvent?.(event);
  } catch (error) {
    queueMicrotask(() => {
      throw error;
    });
  }
}

function trackStep(engine: EngineInternals): void {
  const step = engine.currentStep;
  if (step && step.id !== engine.viewedStep)
    emit(engine, { type: 'step_viewed', stepId: (engine.viewedStep = step.id), stepIndex: engine.currentStepIndex });
}

function trackFields(engine: EngineInternals): void {
  const previous = engine.shownFields;
  engine.shownFields = engine.visibility.conditionResults(engine.state.values);
  for (const [id, [fieldKey, shown]] of engine.shownFields)
    if (previous?.get(id)?.[1] === !shown) emit(engine, { type: shown ? 'field_shown' : 'field_hidden', fieldKey });
}

export function baselineFields(engine: EngineInternals): void {
  if (!engine.lifecycle.onFormEvent) engine.shownFields = undefined;
  else if (engine.viewedStep !== undefined) engine.shownFields ??= engine.visibility.conditionResults(engine.state.values);
}

export function startEvents(engine: EngineInternals): void {
  if (engine.viewedStep !== undefined) return;
  emit(engine, { type: 'form_viewed' });
  engine.viewedStep = null;
  trackChanges(engine, true);
}

export function trackChanges(engine: EngineInternals, fields?: boolean): void {
  if (engine.viewedStep === undefined) return;
  if (fields && engine.lifecycle.onFormEvent) trackFields(engine);
  trackStep(engine);
}

export async function reportErrors(engine: EngineInternals, action: () => Promise<boolean>): Promise<boolean> {
  const errors = engine.errors;
  const done = await action();
  if (!done && engine.errors !== errors)
    for (const [fieldKey, error] of Object.entries(engine.errors)) emit(engine, { type: 'field_error', fieldKey, error });
  return done;
}
