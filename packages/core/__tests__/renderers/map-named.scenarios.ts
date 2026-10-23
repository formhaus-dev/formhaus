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

  const rating: FormField = { key: 'stars', type: 'rating', label: 'Stars', autoAdvance: true, validation: { max: 3 } };
  const send = (target: Element, type: 'keydown' | 'keyup', name: string, repeat = false) => {
    const event = new KeyboardEvent(type, { key: name, bubbles: true, cancelable: true, repeat });
    target.dispatchEvent(event);
    return event.defaultPrevented;
  };

  it('clears on a button without an option value and does not commit', async () => {
    const onFieldChange = mount(steps(rating), mapped.shell, { stars: 2 });
    const clear = screen.getByRole('button', { name: 'Clear' });
    clear.focus();
    expect([send(clear, 'keydown', ' '), send(clear, 'keyup', ' '), send(clear, 'keydown', 'Enter')]).toEqual([false, false, false]);
    await tick();
    expect(onFieldChange).not.toHaveBeenCalled();
    clear.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    await harness.click(clear);
    await tick();
    expect([values(onFieldChange), screen.queryByRole('heading', { name: 'Last' })]).toEqual([[null], null]);
    await harness.click(screen.getByRole('radio', { name: '2 stars' }));
    await screen.findByRole('heading', { name: 'Last' });
    expect(values(onFieldChange)).toEqual([null, 2]);
  });

  it('leaves Space and Enter to a text input inside the group', async () => {
    const onFieldChange = mount(steps(rating), mapped.shell, { stars: 2 });
    const note = screen.getByRole('textbox', { name: 'Note' });
    note.focus();
    expect([send(note, 'keydown', ' '), send(note, 'keyup', ' '), send(note, 'keydown', 'Enter')]).toEqual([false, false, false]);
    await tick();
    expect([onFieldChange.mock.calls.length, screen.queryByRole('heading', { name: 'Last' })]).toEqual([0, null]);
  });

  it('commits a held Space once on release', async () => {
    const onFieldChange = mount(steps(plan), mapped.shell);
    const radio = option('Plan b');
    radio.focus();
    send(radio, 'keydown', ' ');
    send(radio, 'keydown', ' ', true);
    send(radio, 'keydown', ' ', true);
    expect(send(radio, 'keyup', ' ')).toBe(true);
    await screen.findByRole('heading', { name: 'Last' });
    expect(values(onFieldChange)).toEqual(['b']);
  });

  it('only changes on Home and End', async () => {
    const onFieldChange = mount(steps(plan));
    option('Plan c').focus();
    await key(option('Plan c'), 'keydown', 'Home');
    await key(option('Plan a'), 'keyup', 'Home');
    expect([values(onFieldChange), document.activeElement, screen.queryByRole('heading', { name: 'Last' })]).toEqual([
      ['a'],
      option('Plan a'),
      null,
    ]);
  });
}
