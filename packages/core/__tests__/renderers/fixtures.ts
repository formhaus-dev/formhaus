import type { expect, it, vi } from 'vitest';
import type {
  DefinitionIssue,
  FieldOption,
  FormEvent,
  FormResearch,
  FormDefinition,
  FormRendererHandle,
  LabelSource,
  LocaleCatalog,
  RecallFormatFn,
  StepValidateFn,
  SubmitHandler,
  ValidateFn,
} from '../../src';

export interface ScenarioProps {
  definition: FormDefinition;
  onSubmit: SubmitHandler;
  initialValues?: Record<string, unknown>;
  keepValues?: boolean;
  errors?: Record<string, string>;
  errorSummary?: boolean | 'top' | 'bottom';
  loading?: boolean;
  stepErrorMarks?: boolean;
  labels?: LabelSource;
  locale?: LocaleCatalog | LocaleCatalog[];
  onStepValidate?: StepValidateFn;
  onValidate?: ValidateFn;
  lang?: string;
  formatRecall?: RecallFormatFn;
  onFormEvent?: (event: FormEvent) => void;
  onCancel?: () => void;
  onFieldChange?: (key: string, value: unknown, values: Record<string, unknown>) => void;
  components?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  actionsComponent?: unknown;
  progressComponent?: unknown;
  testIds?: boolean;
  onWarning?: (issue: DefinitionIssue) => void;
  confirmRemove?: boolean;
  seed?: string;
  research?: FormResearch;
  optionsProviders?: Record<string, (values: Record<string, unknown>) => FieldOption[] | Promise<FieldOption[]>>;
}

interface Mounted {
  update(props: Partial<ScenarioProps>): Promise<void>;
  handle(): Pick<FormRendererHandle, 'showField' | 'getErrors'>;
}

export interface RendererHarness {
  mount(props: ScenarioProps): Mounted;
  click(element: Element): Promise<void>;
  type(element: Element, value: string): Promise<void>;
  submit(form: HTMLFormElement): Promise<void>;
  containers?: Record<string, unknown>;
  controls?: Record<string, unknown>;
  mapped?: Record<'shell' | 'bare' | 'mixed' | 'doubled' | 'named', Record<string, unknown>>;
  design?: { components: Record<string, unknown>; layout: Record<string, unknown> };
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

export const signup: FormDefinition = {
  id: 'signup',
  title: '',
  submit: { label: 'Send' },
  steps: [
    { id: 'one', title: 'One', fields: [{ key: 'name', type: 'text', label: 'Name', validation: { required: true } }] },
    { id: 'two', title: 'Two', fields: [{ key: 'city', type: 'text', label: 'City' }] },
  ],
};

export const signupErrors: SubmitHandler = () => ({ ok: false, errors: { name: 'Taken', city: 'Unknown', coupon: 'Server down' } });

export function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
