import { FormEngine, type SubmitResult } from '../../src/engine';
import { conditionValues } from '../../src/internal';
import type { FormField, FormStep } from '../../src/types';
import { isVisible } from '../../src/visibility';
import type { FuzzCase, FuzzCommand, Outcome } from './lifecycle-fuzz.fixtures';

interface Operations {
  latestOperation: number;
  operationEpoch: number;
}

interface Pending {
  kind: 'stepValidate' | 'beforeSubmit' | 'submit';
  operation: number;
  resets: number;
  settle: (outcome: Outcome) => void;
}

interface Skip {
  stepId: string;
  before: Record<string, unknown>;
  skipped: Record<string, unknown>;
}

const flush = () => new Promise<void>((done) => { setImmediate(done); });

export interface FuzzHooks {
  stepValidate: boolean;
  beforeSubmit: boolean;
}

export async function runFuzz(fuzz: FuzzCase, hooks: FuzzHooks, initial: Record<string, unknown>, commands: FuzzCommand[]): Promise<void> {
  const { definition } = fuzz;
  const pending: Pending[] = [];
  const skips = new Map<number, Skip>();
  const log: string[] = [];
  let resets = 0;
  const steps = definition.steps ?? [];
  const fields: FormField[] = steps.length > 0 ? steps.flatMap((step) => step.fields) : definition.fields ?? [];
  const stepOf = new Map<FormField, FormStep>(steps.flatMap((step) => step.fields.map((field) => [field, step] as const)));
  const firstField = (stepId: string) => steps.find((step) => step.id === stepId)?.fields[0]?.key ?? 'ghost';

  let engine!: FormEngine;
  const ops = () => engine as unknown as Operations;
  const hold = <T>(kind: Pending['kind'], answer: (outcome: Outcome) => T) => new Promise<T>((resolve, reject) => {
    pending.push({ kind, operation: ops().latestOperation, resets, settle: (outcome) => {
      if (outcome === 'fail') reject(new Error(`${kind} failed`));
      else resolve(answer(outcome));
    } });
  });
  engine = new FormEngine(definition, initial, {
    onStepValidate: hooks.stepValidate ? (stepId) => hold('stepValidate', (outcome) => (outcome === 'deny' ? { [firstField(stepId)]: 'Server says no' } : null)) : undefined,
    onBeforeSubmit: hooks.beforeSubmit ? () => hold('beforeSubmit', (outcome) => outcome === 'allow') : undefined,
  });
  const send = () => hold('submit', (outcome): SubmitResult | void => (
    outcome === 'deny' ? { ok: false, errors: { [fields[0].key]: 'Server rejects', ghost: 'Unknown' }, formErrors: ['Nope'] } : undefined
  ));

  const snapshot = () => JSON.stringify({
    values: engine.values, errors: engine.errors, top: engine.topLevelErrors, step: engine.currentStep?.id ?? null,
    index: engine.currentStepIndex, submitting: engine.submitting, stepValidating: engine.stepValidating,
    skipped: steps.filter((step) => engine.isStepSkipped(step.id)).map((step) => step.id),
  });
  const fail = (message: string): never => {
    throw new Error(`${message}\ncommands:\n  ${log.join('\n  ')}\nstate: ${snapshot()}`);
  };

  const check = () => {
    if (engine.stepValidating && engine.submitting) fail('navigation and submission pending at once');
    if (pending.length === 0 && (engine.stepValidating || engine.submitting)) fail('engine busy with nothing pending');
    const path = engine.visibleSteps;
    if (steps.length > 0 && (!engine.currentStep || !path.includes(engine.currentStep))) fail('current step is not on the active path');
    const active = conditionValues(engine);
    const shown = (field: FormField) => {
      const step = stepOf.get(field);
      return isVisible(field, active) && (!step || path.includes(step));
    };
    for (const key of Object.keys(engine.errors)) {
      const owners = fields.filter((field) => field.key === key);
      if (owners.length === 0) fail(`error for unknown field ${key}`);
      if (!owners.some(shown)) fail(`error for hidden or off-path field ${key}`);
    }
    for (const [stepId, keys] of Object.entries(engine.stepErrors)) {
      if (!path.some((step) => step.id === stepId)) fail(`stepErrors lists step ${stepId} off the active path`);
      if (keys.some((key) => engine.errors[key] === undefined)) fail(`stepErrors of ${stepId} lists a field without an error`);
    }
    for (const field of fields) {
      const step = stepOf.get(field);
      const hiddenStep = step && !isVisible(step, active);
      const hiddenField = (!step || path.includes(step)) && !isVisible(field, active);
      if ((hiddenStep || hiddenField) && engine.values[field.key as keyof typeof engine.values] !== undefined) fail(`hidden field ${field.key} keeps a value`);
    }
  };

  const start = (action: () => Promise<unknown>, skip = false) => {
    const before = ops().latestOperation;
    const stepId = engine.currentStep?.id ?? '';
    const values = { ...engine.values };
    action().catch(() => {});
    if (skip && ops().latestOperation !== before) skips.set(ops().latestOperation, { stepId, before: values, skipped: { ...engine.values } });
  };

  const checkRestore = (skip: Skip, values: Record<string, unknown>) => {
    if (engine.isStepSkipped(skip.stepId)) fail(`skip of ${skip.stepId} left a trace after its rejection`);
    for (const key of new Set([...Object.keys(skip.before), ...Object.keys(values)])) {
      const expected = Object.is(values[key], skip.skipped[key]) ? skip.before[key] : values[key];
      const actual = engine.values[key as keyof typeof engine.values];
      if (actual !== undefined && !Object.is(actual, expected)) fail(`restoring skip of ${skip.stepId} set ${key} to ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
    }
  };

  for (const command of commands) {
    log.push(JSON.stringify(command));
    if (command.type === 'set') engine.setValue(command.key, command.value);
    if (command.type === 'setErrors') engine.setErrors(Object.fromEntries(command.keys.map((key) => [key, `External ${key}`])));
    if (command.type === 'jump') engine.goToStepWithField(command.key);
    if (command.type === 'next') start(() => engine.next());
    if (command.type === 'back') start(() => engine.back());
    if (command.type === 'submit') start(() => engine.submit(send));
    if (command.type === 'skip') start(() => engine.skip(send), true);
    if (command.type === 'cancel') engine.cancelPendingActions();
    if (command.type === 'reset') { resets++; engine.reset(command.filled ? initial : undefined); }
    if (command.type === 'settle' && pending.length > 0) {
      const [entry] = pending.splice(command.index % pending.length, 1);
      const superseded = entry.resets !== resets || entry.operation !== ops().latestOperation;
      const cancelled = entry.operation !== ops().operationEpoch;
      const before = snapshot();
      const values = { ...engine.values };
      const skip = superseded ? undefined : skips.get(entry.operation);
      const skipped = !!skip && engine.isStepSkipped(skip.stepId);
      const rejected = command.outcome !== 'allow' || (cancelled && entry.kind === 'beforeSubmit');
      entry.settle(command.outcome);
      await flush();
      if (skip && skipped && (rejected || !engine.isStepSkipped(skip.stepId))) checkRestore(skip, values);
      else if ((superseded || cancelled) && snapshot() !== before) {
        fail(`stale ${entry.kind} of operation ${entry.operation} changed the state\nbefore: ${before}`);
      }
    }
    await flush();
    check();
  }

  while (pending.length > 0) {
    log.push('drain');
    pending.shift()!.settle('allow');
    await flush();
    check();
  }
  if (engine.stepValidating || engine.submitting) fail('engine still busy after every hook settled');
}
