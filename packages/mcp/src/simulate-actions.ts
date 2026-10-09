import { isVisible, type FormEngine, type FormStep } from '@formhaus/core';
import { advancingRadios } from './structure';

export type SimulationAction = 'next' | 'back' | 'skip';

export interface TraceEntry {
  action: SimulationAction;
  from: string | null;
  to: string | null;
  moved: boolean;
  submitted?: boolean;
  reason?: string;
  errors?: Record<string, string>;
}

function isAnswered(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}

function blockedReason(engine: FormEngine, step: FormStep | null, action: SimulationAction): string | undefined {
  if (!step) return 'Form has no steps.';
  if (action === 'back') return step.back === false ? 'Back is hidden on this step (back: false).' : undefined;
  if (action === 'skip') {
    if (!step.skip) return 'Step has no skip action.';
    return step.next === false ? 'Skip is not shown on steps with next: false.' : undefined;
  }
  if (step.next !== false || engine.isLastStep) return undefined;
  const values = engine.getSubmitValues();
  const answered = advancingRadios(step).some((field) => isVisible(field, values) && isAnswered(engine.values[field.key]));
  return answered ? undefined : 'Next is hidden on this step (next: false) and no autoAdvance radio is answered.';
}

async function apply(engine: FormEngine, action: SimulationAction): Promise<boolean> {
  if (action !== 'skip') {
    if (action === 'next') engine.nextStep();
    else engine.prevStep();
    return false;
  }
  let submitted = false;
  await engine.skipStepAsync(async () => {
    submitted = true;
  });
  return submitted;
}

export async function perform(engine: FormEngine, action: SimulationAction): Promise<TraceEntry> {
  const step = engine.currentStep;
  const from = step?.id ?? null;
  const reason = blockedReason(engine, step, action);
  if (reason) return { action, from, to: from, moved: false, reason };
  const index = engine.currentStepIndex;
  const submitted = await apply(engine, action);
  const to = engine.currentStep?.id ?? null;
  const moved = engine.currentStepIndex !== index || to !== from;
  const entry: TraceEntry = { action, from, to, moved, ...(submitted && { submitted }) };
  if (moved || submitted) return entry;
  const errors = action === 'back' ? {} : { ...engine.errors };
  if (Object.keys(errors).length > 0) return { ...entry, errors };
  const atEdge = action === 'back' ? engine.isFirstStep : engine.isLastStep;
  return { ...entry, reason: atEdge ? `No ${action === 'back' ? 'previous' : 'next'} step on the active path.` : 'Navigation did not change the step.' };
}
