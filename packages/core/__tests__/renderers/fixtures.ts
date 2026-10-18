import type { expect, it, vi } from 'vitest';
import type { FieldOption, FormAnalyticsEvent, FormDefinition, LabelSource, StepValidateFn, SubmitHandler } from '../../src';

export interface ScenarioProps {
  definition: FormDefinition;
  onSubmit: SubmitHandler;
  initialValues?: Record<string, unknown>;
  errors?: Record<string, string>;
  errorSummary?: boolean;
  loading?: boolean;
  stepErrorMarks?: boolean;
  labels?: LabelSource;
  onStepValidate?: StepValidateFn;
  onAnalyticsEvent?: (event: FormAnalyticsEvent) => void;
  onFormEvent?: (event: FormAnalyticsEvent) => void;
  onCancel?: () => void;
  onFieldChange?: (key: string, value: unknown, values: Record<string, unknown>) => void;
  components?: Record<string, unknown>;
  confirmRemove?: boolean;
  optionsProviders?: Record<string, (values: Record<string, unknown>) => FieldOption[] | Promise<FieldOption[]>>;
}

export interface Mounted {
  update(props: Partial<ScenarioProps>): Promise<void>;
}

export interface RendererHarness {
  mount(props: ScenarioProps): Mounted;
  click(element: Element): Promise<void>;
  type(element: Element, value: string): Promise<void>;
  submit(form: HTMLFormElement): Promise<void>;
  containers?: Record<string, unknown>;
}

type Query = (role: string, options?: { name?: string | RegExp }) => HTMLElement;

export interface TestKit {
  it: typeof it;
  expect: typeof expect;
  fn: typeof vi.fn;
  waitFor<T>(run: () => T): Promise<T>;
  screen: {
    getByRole: Query;
    queryByRole: (...args: Parameters<Query>) => HTMLElement | null;
    findByRole: (...args: Parameters<Query>) => Promise<HTMLElement>;
    findByText(text: string): Promise<HTMLElement>;
    getAllByRole: (...args: Parameters<Query>) => HTMLElement[];
    queryAllByRole: (...args: Parameters<Query>) => HTMLElement[];
  };
}

export const flat: FormDefinition = {
  id: 'flat',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'first', type: 'text', label: 'First' },
    { key: 'second', type: 'text', label: 'Second' },
  ],
};

export const wizard: FormDefinition = {
  id: 'wizard',
  title: '',
  submit: { label: 'Send' },
  steps: [
    { id: 'one', title: 'One', fields: [{ key: 'name', type: 'text', label: 'Name', validation: { required: true } }] },
    {
      id: 'two',
      title: 'Two',
      skip: { label: 'Skip' },
      fields: [
        {
          key: 'plan',
          type: 'radio',
          label: 'Plan',
          autoAdvance: true,
          options: [
            { value: 'a', label: 'Plan A' },
            { value: 'b', label: 'Plan B' },
          ],
        },
      ],
    },
    { id: 'three', title: 'Three', fields: [{ key: 'city', type: 'text', label: 'City' }] },
  ],
};

export const filled = { name: 'Ada', plan: 'a', city: 'Oslo' };

export function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
