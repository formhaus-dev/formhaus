import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FormEngine, type FormDefinition, type FormEngineOptions, type SubmitHandler } from '../../src';
import { localize, type Overlay } from '../../src/i18n';

export type Reply = { return?: unknown; throw?: string; defer?: string };

export type HookName = 'onBeforeStepChange' | 'onAfterStepChange' | 'onBeforeSubmit' | 'onAfterSubmit' | 'onStepValidate';

export interface ValidatorSpec {
  reject: unknown[];
  error: string;
}

export type Action =
  | { do: 'start' }
  | { do: 'setValue'; key: string; value: unknown }
  | { do: 'setItemValue'; key: string; index: number; field: string; value: unknown }
  | { do: 'addItem'; key: string }
  | { do: 'removeItem'; key: string; index: number }
  | { do: 'setErrors'; errors: Record<string, string> }
  | { do: 'setFieldLoading'; key: string; loading: boolean }
  | { do: 'cancelPendingActions' }
  | { do: 'next' }
  | { do: 'back' }
  | { do: 'skip'; handler?: Reply[] }
  | { do: 'submit'; handler?: Reply[] }
  | { do: 'validate' }
  | { do: 'validateField'; key: string }
  | { do: 'goToStepWithField'; key: string }
  | { do: 'reset'; values?: Record<string, unknown> }
  | { do: 'resolve'; deferred: string }
  | { do: 'settle' };

export type Step = (Action & { returns?: unknown; throws?: Record<string, unknown>; await?: boolean }) | { expect: Expectation };

export interface Expectation {
  values?: Record<string, unknown>;
  submitValues?: Record<string, unknown>;
  errors?: Record<string, string>;
  topLevelErrors?: string[];
  stepErrors?: Record<string, string[]>;
  step?: string | null;
  stepIndex?: number;
  steps?: string[];
  fields?: string[];
  skipped?: string[];
  items?: Record<string, number>;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  canGoNext?: boolean;
  progress?: { current: number; total: number };
  submitting?: boolean;
  stepValidating?: boolean;
  fieldLoading?: Record<string, boolean>;
  log?: unknown[];
}

export interface Scenario {
  name: string;
  values?: Record<string, unknown>;
  hooks?: Partial<Record<HookName, Reply[]>>;
  validators?: Record<string, ValidatorSpec>;
  messages?: Record<string, string>;
  throws?: string;
  steps: Step[];
}

export interface ScenarioFile {
  name: string;
  definition: FormDefinition;
  overlay?: Overlay;
  scenarios: Scenario[];
}

const dir = join(__dirname, '../../fixtures/conformance/scenarios');

export const scenarioFiles: ScenarioFile[] = readdirSync(dir)
  .filter((file) => file.endsWith('.json') && !file.endsWith('.schema.json'))
  .sort()
  .map((file) => JSON.parse(readFileSync(join(dir, file), 'utf8')));

export const plain = (value: unknown): unknown => (value === undefined ? null : JSON.parse(JSON.stringify(value)));

const equal = (a: unknown, b: unknown) => JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));

function sorted(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sorted((value as Record<string, unknown>)[key])]),
    );
  return value;
}

function projectError(error: unknown): Record<string, unknown> {
  const { name, phase } = error as { name?: string; phase?: string };
  return phase ? { name, phase } : { name };
}

class Script {
  private readonly deferred = new Map<string, () => void>();

  reply(entries: Reply[] | undefined, fallback?: unknown): unknown {
    const entry = entries?.shift();
    if (!entry) return fallback;
    const settle = () => {
      if (entry.throw !== undefined) throw new Error(entry.throw);
      return entry.return;
    };
    if (!entry.defer) return settle();
    return new Promise((resolve, reject) => {
      this.deferred.set(entry.defer!, () => {
        try {
          resolve(settle());
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  resolve(name: string): void {
    const release = this.deferred.get(name);
    if (!release) throw new Error(`No pending deferred reply "${name}"`);
    this.deferred.delete(name);
    release();
  }
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

export class ScenarioRun {
  readonly engine: FormEngine;
  private readonly script = new Script();
  private readonly log: unknown[] = [];
  private readonly pending: { label: string; done: Promise<void>; settled: boolean }[] = [];
  private readonly failures: string[] = [];

  constructor(
    private readonly file: ScenarioFile,
    private readonly scenario: Scenario,
  ) {
    const definition = file.overlay ? localize(file.definition, { overlay: file.overlay }).definition : file.definition;
    this.engine = new FormEngine(definition, scenario.values ?? {}, this.options());
  }

  private options(): FormEngineOptions {
    const hooks = structuredClone(this.scenario.hooks ?? {});
    const options: FormEngineOptions = {
      onFormEvent: (event) => this.log.push({ event: plain(event) }),
      onWarning: ({ code, path }) => this.log.push({ warning: { code, path } }),
    };
    if (hooks.onBeforeStepChange)
      options.onBeforeStepChange = (context) => {
        this.log.push({ call: 'onBeforeStepChange', context: plain(context) });
        return this.script.reply(hooks.onBeforeStepChange) as boolean | void;
      };
    if (hooks.onAfterStepChange)
      options.onAfterStepChange = (context) => {
        this.log.push({ call: 'onAfterStepChange', context: plain(context) });
        return this.script.reply(hooks.onAfterStepChange) as void;
      };
    if (hooks.onBeforeSubmit)
      options.onBeforeSubmit = (values) => {
        this.log.push({ call: 'onBeforeSubmit', values: plain(values) });
        return this.script.reply(hooks.onBeforeSubmit) as boolean | void;
      };
    if (hooks.onAfterSubmit)
      options.onAfterSubmit = (values, skippedSteps) => {
        this.log.push({ call: 'onAfterSubmit', values: plain(values), skippedSteps: plain(skippedSteps) });
        return this.script.reply(hooks.onAfterSubmit) as void;
      };
    if (hooks.onStepValidate)
      options.onStepValidate = (stepId, values) => {
        this.log.push({ call: 'onStepValidate', stepId, values: plain(values) });
        return Promise.resolve(this.script.reply(hooks.onStepValidate)) as ReturnType<NonNullable<FormEngineOptions['onStepValidate']>>;
      };
    if (this.scenario.validators)
      options.validators = Object.fromEntries(
        Object.entries(this.scenario.validators).map(([name, { reject, error }]) => [
          name,
          (value: unknown) => (reject.some((bad) => equal(plain(value), bad)) ? error : null),
        ]),
      );
    if (this.scenario.messages) options.messages = this.scenario.messages;
    return options;
  }

  private handler(entries: Reply[] | undefined): SubmitHandler {
    const script = structuredClone(entries);
    return (values, skippedSteps) => {
      this.log.push({ call: 'submit', values: plain(values), skippedSteps: plain(skippedSteps) });
      return this.script.reply(script) as ReturnType<SubmitHandler>;
    };
  }

  private act(action: Action): unknown {
    const { engine } = this;
    switch (action.do) {
      case 'start':
        return engine.start();
      case 'setValue':
        return engine.setValue(action.key, action.value);
      case 'setItemValue':
        return engine.setItemValue(action.key, action.index, action.field, action.value);
      case 'addItem':
        return engine.addItem(action.key);
      case 'removeItem':
        return engine.removeItem(action.key, action.index);
      case 'setErrors':
        return engine.setErrors(action.errors);
      case 'setFieldLoading':
        return engine.setFieldLoading(action.key, action.loading);
      case 'cancelPendingActions':
        return engine.cancelPendingActions();
      case 'next':
        return engine.next();
      case 'back':
        return engine.back();
      case 'skip':
        return action.handler ? engine.skip(this.handler(action.handler)) : engine.skip();
      case 'submit':
        return engine.submit(this.handler(action.handler));
      case 'validate':
        return engine.validate();
      case 'validateField':
        return engine.validateField(action.key);
      case 'goToStepWithField':
        return engine.goToStepWithField(action.key);
      case 'reset':
        return engine.reset(action.values);
      case 'resolve':
        return this.script.resolve(action.deferred);
      case 'settle':
        return undefined;
    }
  }

  private check(label: string, actual: unknown, expected: unknown): void {
    if (!equal(actual, expected))
      this.failures.push(`${label}\n  expected: ${JSON.stringify(expected)}\n  actual:   ${JSON.stringify(actual)}`);
  }

  private async outcome(label: string, step: Step & { returns?: unknown; throws?: unknown }, result: unknown): Promise<void> {
    try {
      const value = await result;
      if (step.throws) this.check(`${label} throws`, null, step.throws);
      else if ('returns' in step) this.check(`${label} returns`, plain(value), step.returns);
    } catch (error) {
      if (step.throws) this.check(`${label} throws`, projectError(error), step.throws);
      else this.failures.push(`${label} threw unexpectedly: ${String(error)}`);
    }
  }

  private project(expectation: Expectation): Record<string, unknown> {
    const { engine } = this;
    const steps = this.file.definition.steps ?? [];
    const read: Record<keyof Expectation, () => unknown> = {
      values: () => plain(engine.values),
      submitValues: () => plain(engine.getSubmitValues()),
      errors: () => plain(engine.errors),
      topLevelErrors: () => plain(engine.topLevelErrors),
      stepErrors: () => plain(engine.stepErrors),
      step: () => engine.currentStep?.id ?? null,
      stepIndex: () => engine.currentStepIndex,
      steps: () => engine.visibleSteps.map(({ id }) => id),
      fields: () => engine.visibleFields.map(({ key }) => key),
      skipped: () => steps.map(({ id }) => id).filter((id) => engine.isStepSkipped(id)),
      items: () => Object.fromEntries(Object.keys(expectation.items ?? {}).map((key) => [key, engine.items(key).length])),
      isFirstStep: () => engine.isFirstStep,
      isLastStep: () => engine.isLastStep,
      canGoNext: () => engine.canGoNext,
      progress: () => plain(engine.progress),
      submitting: () => engine.submitting,
      stepValidating: () => engine.stepValidating,
      fieldLoading: () => plain(engine.fieldLoading),
      log: () => this.log.splice(0),
    };
    return Object.fromEntries(Object.keys(expectation).map((key) => [key, read[key as keyof Expectation]()]));
  }

  async run(): Promise<string[]> {
    for (const [index, step] of this.scenario.steps.entries()) {
      if ('expect' in step) {
        const actual = this.project(step.expect);
        for (const key of Object.keys(step.expect))
          this.check(`step ${index} expect.${key}`, actual[key], step.expect[key as keyof Expectation]);
        if (!('log' in step.expect)) this.log.length = 0;
        continue;
      }
      const label = `step ${index} ${step.do}`;
      if (step.do === 'settle') {
        await Promise.all(this.pending.splice(0).map(({ done }) => done));
        continue;
      }
      let result: unknown;
      try {
        result = this.act(step);
      } catch (error) {
        result = Promise.reject(error);
      }
      if (step.do === 'resolve') {
        await result;
        await flush();
      } else if (step.await === false) {
        const entry = { label, settled: false, done: Promise.resolve() };
        entry.done = this.outcome(label, step, result).then(() => {
          entry.settled = true;
        });
        this.pending.push(entry);
        await flush();
      } else await this.outcome(label, step, result);
    }
    const unsettled = this.pending.filter(({ settled }) => !settled);
    if (unsettled.length) this.failures.push(`unsettled action(s): ${unsettled.map(({ label }) => label).join(', ')}`);
    return this.failures;
  }
}
