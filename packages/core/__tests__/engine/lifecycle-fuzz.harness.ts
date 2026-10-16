import { FormEngine, type SubmitResult } from '../../src/engine';
import { conditionValues } from '../../src/internal';
import type { FormField, FormGroup, FormSection, FormStep } from '../../src/types';
import { isGroup, isSection, isVisible } from '../../src/visibility';
import type { FuzzCase, FuzzCommand, Outcome } from './lifecycle-fuzz.fixtures';
import { startModel } from './lifecycle-fuzz.starts';

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

const flush = () =>
  new Promise<void>((done) => {
    setImmediate(done);
  });

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
  const sectionOf = new Map<FormField, FormSection>();
  const flatten = (nodes: FormStep['fields']): FormField[] =>
    nodes.flatMap((node) => {
      if (!isSection(node)) return [node];
      for (const field of node.fields) sectionOf.set(field, node);
      return node.fields;
    });
  const fields: FormField[] = steps.length > 0 ? steps.flatMap((step) => flatten(step.fields)) : flatten(definition.fields ?? []);
  const stepOf = new Map<FormField, FormStep>(steps.flatMap((step) => flatten(step.fields).map((field) => [field, step] as const)));
  const groups = fields.filter(isGroup) as FormGroup[];
  const firstField = (stepId: string) => steps.find((step) => step.id === stepId)?.fields[0]?.key ?? 'ghost';
  const groupOf = (key: string) => groups.find((group) => key.startsWith(`${group.key}.`));

  const starts = startModel(fields, initial);

  let engine!: FormEngine;
  const ops = () => engine as unknown as Operations;
  const hold = <T>(kind: Pending['kind'], answer: (outcome: Outcome) => T) =>
    new Promise<T>((resolve, reject) => {
      pending.push({
        kind,
        operation: ops().latestOperation,
        resets,
        settle: (outcome) => {
          if (outcome === 'fail') reject(new Error(`${kind} failed`));
          else resolve(answer(outcome));
        },
      });
    });
  engine = new FormEngine(definition, initial, {
    onStepValidate: hooks.stepValidate
      ? (stepId) => hold('stepValidate', (outcome) => (outcome === 'deny' ? { [firstField(stepId)]: 'Server says no' } : null))
      : undefined,
    onBeforeSubmit: hooks.beforeSubmit ? () => hold('beforeSubmit', (outcome) => outcome === 'allow') : undefined,
  });
  const send = () =>
    hold('submit', (outcome): SubmitResult | void =>
      outcome === 'deny'
        ? {
            ok: false,
            errors: {
              [fields[0].key]: 'Server rejects',
              ghost: 'Unknown',
              ...Object.fromEntries((fuzz.serverErrors ?? []).map((key) => [key, `Server ${key}`])),
            },
            formErrors: ['Nope'],
          }
        : undefined,
    );

  const snapshot = () =>
    JSON.stringify({
      values: engine.values,
      errors: engine.errors,
      top: engine.topLevelErrors,
      step: engine.currentStep?.id ?? null,
      index: engine.currentStepIndex,
      submitting: engine.submitting,
      stepValidating: engine.stepValidating,
      skipped: steps.filter((step) => engine.isStepSkipped(step.id)).map((step) => step.id),
    });
  const fail = (message: string): never => {
    throw new Error(`${message}\ncommands:\n  ${log.join('\n  ')}\nstate: ${snapshot()}`);
  };

  const shownField = () => {
    const path = engine.visibleSteps;
    const active = conditionValues(engine);
    return (field: FormField) => {
      const step = stepOf.get(field);
      const section = sectionOf.get(field);
      return isVisible(field, active) && (!section || isVisible(section, active)) && (!step || path.includes(step));
    };
  };

  const check = () => {
    if (engine.stepValidating && engine.submitting) fail('navigation and submission pending at once');
    if (pending.length === 0 && (engine.stepValidating || engine.submitting)) fail('engine busy with nothing pending');
    const path = engine.visibleSteps;
    if (steps.length > 0 && (!engine.currentStep || !path.includes(engine.currentStep))) fail('current step is not on the active path');
    const shown = shownField();
    for (const key of Object.keys(engine.errors)) {
      const group = groupOf(key);
      if (group) {
        const [index, name] = [Number(key.slice(group.key.length + 1).split('.')[0]), key.split('.').slice(2).join('.')];
        if (!shown(group)) fail(`error for item field of hidden group ${key}`);
        if (!engine.items(group.key)[index]?.fields.some((field) => field.key === name))
          fail(`error for missing or hidden item field ${key}`);
        continue;
      }
      const owners = fields.filter((field) => field.key === key);
      if (owners.length === 0) fail(`error for unknown field ${key}`);
      if (!owners.some(shown)) fail(`error for hidden or off-path field ${key}`);
    }
    for (const [stepId, keys] of Object.entries(engine.stepErrors)) {
      if (!path.some((step) => step.id === stepId)) fail(`stepErrors lists step ${stepId} off the active path`);
      if (keys.some((key) => engine.errors[key] === undefined)) fail(`stepErrors of ${stepId} lists a field without an error`);
    }
    const active = conditionValues(engine);
    for (const field of fields) {
      const step = stepOf.get(field);
      const hiddenStep = step && !isVisible(step, active);
      const hiddenField = (!step || path.includes(step)) && !isVisible(field, active);
      const section = sectionOf.get(field);
      const hiddenSection = (!step || path.includes(step)) && section && !isVisible(section, active);
      if ((hiddenStep || hiddenField || hiddenSection) && engine.values[field.key as keyof typeof engine.values] !== undefined)
        fail(`hidden field ${field.key} keeps a value`);
      const lost = shown(field) && starts.lost(field, step, engine.values[field.key as never], engine.errors[field.key]);
      if (lost) fail(lost);
    }
    for (const group of groups) {
      const items = engine.values[group.key as keyof typeof engine.values];
      if (!Array.isArray(items) || !shown(group)) continue;
      items.forEach((item: Record<string, unknown>, index) => {
        const scope = { ...active, ...item };
        for (const field of group.fields) {
          if (item[field.key] !== undefined && !isVisible(field, scope))
            fail(`hidden item field ${group.key}.${index}.${field.key} keeps a value`);
        }
      });
      const ids = engine.items(group.key).map((item) => item.id);
      if (new Set(ids).size !== ids.length) fail(`duplicate item ids in ${group.key}`);
    }
  };

  const start = (action: () => Promise<unknown>, skip = false) => {
    const before = ops().latestOperation;
    const stepId = engine.currentStep?.id ?? '';
    const values = { ...engine.values };
    action().catch(() => {});
    if (skip && ops().latestOperation !== before)
      skips.set(ops().latestOperation, { stepId, before: values, skipped: { ...engine.values } });
  };

  const checkRestore = (skip: Skip, values: Record<string, unknown>) => {
    if (engine.isStepSkipped(skip.stepId)) fail(`skip of ${skip.stepId} left a trace after its rejection`);
    const shown = shownField();
    for (const key of new Set([...Object.keys(skip.before), ...Object.keys(values)])) {
      const expected = Object.is(values[key], skip.skipped[key]) ? skip.before[key] : values[key];
      const actual = engine.values[key as keyof typeof engine.values];
      const cleared = actual === undefined && !fields.some((field) => field.key === key && shown(field));
      if (!cleared && !Object.is(actual, expected))
        fail(`restoring skip of ${skip.stepId} set ${key} to ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
    }
  };

  for (const command of commands) {
    log.push(JSON.stringify(command));
    const owner = groupOf(command.type === 'set' ? command.key : '')?.key ?? (command.type === 'set' ? command.key : '');
    const previous = engine.values[owner as keyof typeof engine.values];
    if (command.type === 'set') engine.setValue(command.key, command.value);
    if (command.type === 'skip') starts.skip();
    if (command.type === 'setErrors') engine.setErrors(Object.fromEntries(command.keys.map((key) => [key, `External ${key}`])));
    if (command.type === 'jump') engine.goToStepWithField(command.key);
    if (command.type === 'next') start(() => engine.next());
    if (command.type === 'back') start(() => engine.back());
    if (command.type === 'submit') start(() => engine.submit(send));
    if (command.type === 'skip') start(() => engine.skip(send), true);
    if (command.type === 'cancel') engine.cancelPendingActions();
    if (command.type === 'reset') {
      resets++;
      engine.reset(command.filled ? initial : undefined);
      starts.reset(command.filled ? initial : undefined);
    }
    if (command.type === 'add' && engine.addItem(command.key)) starts.edit(command.key);
    if (command.type === 'remove' && engine.removeItem(command.key, command.index)) starts.edit(command.key);
    if (
      command.type === 'set' &&
      (owner === command.key ? !Object.is(previous, command.value) : previous !== engine.values[owner as never])
    )
      starts.edit(owner);
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
      if (skip && (rejected || (skipped && !engine.isStepSkipped(skip.stepId)))) checkRestore(skip, values);
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
