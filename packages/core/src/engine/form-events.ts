import type { EngineInternals } from './runtime-internals';

export function trackStep(engine: EngineInternals): void {
  const step = engine.currentStep;
  if (step && step.id !== engine.viewedStep)
    engine.lifecycle.onFormEvent?.({ type: 'step_viewed', stepId: (engine.viewedStep = step.id), stepIndex: engine.currentStepIndex });
}

export function startEvents(engine: EngineInternals): void {
  if (engine.viewedStep !== undefined) return;
  engine.lifecycle.onFormEvent?.({ type: 'form_viewed' });
  engine.viewedStep = null;
  trackStep(engine);
}

export async function reportErrors(engine: EngineInternals, action: () => Promise<boolean>): Promise<boolean> {
  const errors = engine.errors;
  const done = await action();
  if (!done && engine.errors !== errors)
    for (const [fieldKey, error] of Object.entries(engine.errors)) engine.lifecycle.onFormEvent?.({ type: 'field_error', fieldKey, error });
  return done;
}
