import type { FormDefinition, FormField } from '../../src';
import type { RendererHarness, TestKit } from './fixtures';

const plan: FormField = {
  key: 'plan',
  type: 'radio',
  label: 'Plan',
  autoAdvance: true,
  options: ['a', 'b', 'c'].map((value) => ({ value, label: `Plan ${value}` })),
};

const steps = (...fields: FormField[]): FormDefinition => ({
  id: 'named',
  title: '',
  submit: { label: 'Send' },
  steps: [
    ...fields.map((field, index) => ({ id: `step-${index}`, title: `Step ${index}`, fields: [field] })),
    { id: 'last', title: 'Last', fields: [{ key: 'city', type: 'text', label: 'City' }] },
  ],
});

const last = (field: FormField): FormDefinition => ({ id: 'single', title: '', submit: { label: 'Send' }, fields: [field] });

const tick = () => new Promise((done) => setTimeout(done, 20));

export function mapNamedScenarios(harness: RendererHarness, { it, expect, fn, screen }: TestKit): void {
  const mapped = harness.mapped!;
  const option = (name: string) => screen.getByRole('radio', { name });
  const key = async (target: Element, type: 'keydown' | 'keyup', name: string) => {
    target.dispatchEvent(new KeyboardEvent(type, { key: name, bubbles: true, cancelable: true }));
    await tick();
  };
  const press = async (target: Element, name: string) => {
    (target as HTMLElement).focus();
    await key(target, 'keydown', name);
    await key(target, 'keyup', name);
  };
  const mount = (definition: FormDefinition, components = mapped.named, initialValues?: Record<string, unknown>) => {
    const onFieldChange = fn();
    harness.mount({ definition, components, initialValues, onSubmit: fn(), onFieldChange });
    return onFieldChange;
  };
  const values = (onFieldChange: ReturnType<typeof fn>) => onFieldChange.mock.calls.map(([, value]) => value);

  it('commits once when the control selects on its own Space or Enter key down', async () => {
    const onFieldChange = mount(last(plan));
    await press(option('Plan a'), ' ');
    await press(option('Plan b'), 'Enter');
    expect(values(onFieldChange)).toEqual(['a', 'b']);
  });

  it('routes a named change prop: arrow focus only changes, a click commits', async () => {
    const onFieldChange = mount(steps(plan));
    option('Plan a').focus();
    await key(option('Plan a'), 'keydown', 'ArrowDown');
    await key(option('Plan b'), 'keyup', 'ArrowDown');
    expect([values(onFieldChange), document.activeElement, screen.queryByRole('heading', { name: 'Last' })]).toEqual([
      ['b'],
      option('Plan b'),
      null,
    ]);
    option('Plan c').dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    await harness.click(option('Plan c'));
    await screen.findByRole('heading', { name: 'Last' });
    expect(values(onFieldChange)).toEqual(['b', 'c']);
  });

  it('does not commit a click on a button without an option value', async () => {
    const rating = { key: 'stars', type: 'rating', label: 'Stars', autoAdvance: true, validation: { max: 3 } };
    const onFieldChange = mount(last(rating), mapped.shell, { stars: 2 });
    const clear = screen.getByRole('button', { name: 'Clear' });
    clear.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    await harness.click(clear);
    await tick();
    expect(onFieldChange).not.toHaveBeenCalled();
    await harness.click(screen.getByRole('radio', { name: '2 stars' }));
    await tick();
    expect(values(onFieldChange)).toEqual([2]);
  });
}
