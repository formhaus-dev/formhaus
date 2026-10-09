import { isVisible, type FormEngine, type FormField, type FormStep } from '@formhaus/core';
import { perform, type SimulationAction, type TraceEntry } from './simulate-actions';
import { inspectDefinition, type ValidationReport } from './validate';

export type { SimulationAction, TraceEntry } from './simulate-actions';

export interface SimulationInput {
  definition: unknown;
  answers?: Record<string, unknown>;
  actions?: SimulationAction[];
}

export interface StepReport {
  id: string;
  title: string;
  visited: boolean;
  skipped: boolean;
  visibleFields: string[];
}

export interface SimulationResult {
  ok: boolean;
  validation: ValidationReport;
  multiStep?: boolean;
  path?: StepReport[];
  currentStep?: { id: string; title: string; index: number } | null;
  isLastStep?: boolean;
  trace?: TraceEntry[];
  errors?: Record<string, string>;
  wouldSubmit?: boolean;
  submitValues?: Record<string, unknown>;
}

function pathValues(engine: FormEngine): Record<string, unknown> {
  const keys = new Set(engine.visibleSteps.flatMap((step) => step.fields.map(({ key }) => key)));
  return Object.fromEntries(Object.entries(engine.values).filter(([key]) => keys.has(key)));
}

function visibleKeys(fields: FormField[], values: Record<string, unknown>): string[] {
  return fields.filter((field) => isVisible(field, values)).map(({ key }) => key);
}

async function run(engine: FormEngine, actions: SimulationAction[] | undefined): Promise<TraceEntry[]> {
  const trace: TraceEntry[] = [];
  if (actions) {
    for (const action of actions) trace.push(await perform(engine, action));
    return trace;
  }
  while (engine.isMultiStep && !engine.isLastStep) {
    const entry = await perform(engine, 'next');
    trace.push(entry);
    if (!entry.moved) break;
  }
  return trace;
}

function visitedErrors(engine: FormEngine, visited: Set<string>, errors: Record<string, string>): Record<string, string> {
  if (!engine.isMultiStep) return errors;
  const keys = new Set(engine.visibleSteps.filter(({ id }) => visited.has(id)).flatMap(({ fields }) => fields.map(({ key }) => key)));
  return Object.fromEntries(Object.entries(errors).filter(([key]) => keys.has(key)));
}

export async function simulatePathTool(input: SimulationInput): Promise<SimulationResult> {
  const { report, definition, engine } = inspectDefinition(input.definition, input.answers);
  if (!definition || !engine) return { ok: false, validation: report };
  const first = engine.currentStep?.id;
  const trace = await run(engine, input.actions);
  const visited = new Set([first, ...trace.map(({ to }) => to)].filter((id): id is string => typeof id === 'string'));
  const values = engine.isMultiStep ? pathValues(engine) : engine.values;
  const stepReport = (step: FormStep): StepReport => ({
    id: step.id, title: step.title, visited: visited.has(step.id), skipped: engine.isStepSkipped(step.id), visibleFields: visibleKeys(step.fields, values),
  });
  const path = engine.isMultiStep
    ? engine.visibleSteps.map(stepReport)
    : [{ id: definition.id, title: definition.title, visited: true, skipped: false, visibleFields: visibleKeys(definition.fields ?? [], values) }];
  const step = engine.currentStep;
  const allErrors = engine.validate();
  const atEnd = !engine.isMultiStep || engine.isLastStep;
  const submitted = trace.some((entry) => entry.submitted);
  return {
    ok: true,
    validation: report,
    multiStep: engine.isMultiStep,
    path,
    currentStep: step ? { id: step.id, title: step.title, index: engine.currentStepIndex } : null,
    isLastStep: atEnd,
    trace,
    errors: visitedErrors(engine, visited, allErrors),
    wouldSubmit: submitted || (atEnd && Object.keys(allErrors).length === 0),
    submitValues: engine.getSubmitValues(),
  };
}
