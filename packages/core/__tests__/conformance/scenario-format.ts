import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FormDefinition } from '../../src';
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
  definition?: FormDefinition;
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

export const equal = (a: unknown, b: unknown) => JSON.stringify(sorted(a)) === JSON.stringify(sorted(b));

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

export function projectError(error: unknown, expected: Record<string, unknown>): Record<string, unknown> {
  const { name, phase, message } = error as { name?: string; phase?: string; message?: string };
  return { name, ...(phase && { phase }), ...('message' in expected && { message }) };
}

export const scenarioDefinition = (file: ScenarioFile, scenario: Scenario): FormDefinition => scenario.definition ?? file.definition;

export const runtimeDefinition = (file: ScenarioFile, scenario: Scenario): FormDefinition => {
  const definition = scenarioDefinition(file, scenario);
  return file.overlay ? localize(definition, { overlay: file.overlay }).definition : definition;
};
