import { FormEngine, type FormEngineOptions, type SubmitHandler } from '../../src';
import {
  type Action,
  equal,
  type Expectation,
  localized,
  plain,
  projectError,
  runtimeDefinition,
  type Scenario,
  type ScenarioFile,
  type Step,
} from './scenario-format';
import { flush, Script } from './scenario-script';

export { scenarioFiles } from './scenario-format';

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
    this.engine = new FormEngine(runtimeDefinition(file, scenario), scenario.values ?? {}, this.options());
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
      case 'goToStep':
        return engine.goToStep(action.stepId);
      case 'reset':
        return engine.reset(action.values);
      case 'replaceDefinition':
        return engine.replaceDefinition(localized(this.file, structuredClone(action.definition)));
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
      if (step.throws) this.check(`${label} throws`, projectError(error, step.throws as Record<string, unknown>), step.throws);
      else this.failures.push(`${label} threw unexpectedly: ${String(error)}`);
    }
  }

  private project(expectation: Expectation): Record<string, unknown> {
    const { engine } = this;
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
      skipped: () => (engine.definition.steps ?? []).map(({ id }) => id).filter((id) => engine.isStepSkipped(id)),
      items: () => Object.fromEntries(Object.keys(expectation.items ?? {}).map((key) => [key, engine.items(key).length])),
      distinctItemIds: () =>
        Object.fromEntries(
          Object.keys(expectation.distinctItemIds ?? {}).map((key) => [key, new Set(engine.items(key).map(({ id }) => id)).size]),
        ),
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
    if (this.script.pending.length) this.failures.push(`unresolved deferred reply(s): ${this.script.pending.join(', ')}`);
    return this.failures;
  }
}
