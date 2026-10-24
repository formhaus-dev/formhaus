import type { FormDefinition } from '../../src';
import type { RendererHarness, TestKit } from './fixtures';

const survey: FormDefinition = {
  id: 'survey',
  title: '',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'one',
      title: 'One',
      fields: [
        {
          key: 'plan',
          type: 'radio',
          label: 'Plan',
          autoAdvance: true,
          options: ['a', 'b', 'c'].map((value) => ({ value, label: `Plan ${value}` })),
        },
      ],
    },
    {
      id: 'two',
      title: 'Two',
      fields: [{ key: 'score', type: 'scale', label: 'Score', autoAdvance: true, validation: { min: 1, max: 5 } }],
    },
    { id: 'three', title: 'Three', fields: [{ key: 'city', type: 'text', label: 'City', validation: { required: true } }] },
  ],
};

const tick = () => new Promise((done) => setTimeout(done, 20));

export function mapCommitScenarios(harness: RendererHarness, { it, expect, fn, waitFor, screen }: TestKit): void {
  const mapped = harness.mapped!;
  const radio = (name: string) => screen.getByRole('radio', { name }) as HTMLInputElement;
  const step = (title: string) => screen.findByRole('heading', { name: title });
  const key = async (target: Element, type: 'keydown' | 'keyup', name: string, repeat = false) => {
    target.dispatchEvent(new KeyboardEvent(type, { key: name, bubbles: true, cancelable: true, repeat }));
    await tick();
  };
  const press = async (target: Element) => {
    target.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    await harness.click(target);
    await tick();
  };
  const mount = (initialValues?: Record<string, unknown>, components = mapped.shell) => {
    const onSubmit = fn();
    const onFieldChange = fn();
    harness.mount({ definition: survey, components, initialValues, onSubmit, onFieldChange });
    return { onSubmit, onFieldChange };
  };

  it('commits a click once and advances one step', async () => {
    const { onFieldChange } = mount();
    await press(radio('Plan b'));
    await step('Two');
    await press(radio('4'));
    await step('Three');
    expect(onFieldChange.mock.calls.map(([field, value]) => [field, value])).toEqual([
      ['plan', 'b'],
      ['score', 4],
    ]);
  });

  it('saves one value per pick on the last step, where a commit does not advance', async () => {
    const onFieldChange = fn();
    harness.mount({ definition: { ...survey, steps: survey.steps!.slice(0, 1) }, components: mapped.shell, onSubmit: fn(), onFieldChange });
    await press(radio('Plan a'));
    await press(radio('Plan a'));
    await press(radio('Plan c').closest('label')!);
    expect(onFieldChange.mock.calls.map(([, value]) => value)).toEqual(['a', 'a', 'c']);
  });

  it('commits a control that changes on its own click handler once', async () => {
    const onFieldChange = fn();
    const rating = { key: 'stars', type: 'rating', label: 'Stars', autoAdvance: true, validation: { max: 3 } };
    harness.mount({
      definition: { ...survey, steps: [{ id: 'one', title: 'One', fields: [rating] }] },
      components: mapped.shell,
      onSubmit: fn(),
      onFieldChange,
    });
    await press(screen.getByRole('radio', { name: '2 stars' }));
    expect(onFieldChange.mock.calls.map(([, value]) => value)).toEqual([2]);
  });

  it('commits a click on the option label', async () => {
    mount();
    const label = radio('Plan c').closest('label')!;
    label.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    await harness.click(label);
    await step('Two');
  });

  it('only changes the value on arrow keys, then commits on Enter', async () => {
    const { onFieldChange } = mount();
    await key(radio('Plan a'), 'keydown', 'ArrowDown');
    await harness.click(radio('Plan b'));
    await key(radio('Plan b'), 'keyup', 'ArrowDown');
    await tick();
    expect([radio('Plan b').checked, screen.queryByRole('heading', { name: 'Two' })]).toEqual([true, null]);
    expect(onFieldChange).toHaveBeenCalledWith('plan', 'b', expect.anything());
    await key(radio('Plan b'), 'keydown', 'Enter');
    await step('Two');
  });

  it('commits the focused option on Enter and ignores a held key', async () => {
    const { onFieldChange } = mount();
    await key(radio('Plan c'), 'keydown', 'Enter', true);
    expect(onFieldChange).not.toHaveBeenCalled();
    await key(radio('Plan c'), 'keydown', 'Enter');
    await step('Two');
    expect(onFieldChange).toHaveBeenCalledWith('plan', 'c', expect.anything());
  });

  it('commits the focused option on Space, also when it is already picked', async () => {
    const { onFieldChange } = mount({ plan: 'b' });
    await key(radio('Plan b'), 'keydown', ' ');
    await key(radio('Plan b'), 'keyup', ' ');
    await step('Two');
    expect(onFieldChange).toHaveBeenCalledWith('plan', 'b', expect.anything());
  });

  it('commits an unpicked option on Space', async () => {
    const { onFieldChange } = mount();
    await key(radio('Plan c'), 'keydown', ' ');
    await key(radio('Plan c'), 'keyup', ' ');
    await step('Two');
    expect(onFieldChange).toHaveBeenCalledWith('plan', 'c', expect.anything());
  });

  it('commits a click on the option that is already picked', async () => {
    mount({ plan: 'b' });
    expect(radio('Plan b').checked).toBe(true);
    await press(radio('Plan b'));
    await step('Two');
  });

  it('commits the scale with keyboard and leaves arrows alone', async () => {
    const { onSubmit } = mount({ plan: 'a' });
    await press(radio('Plan a'));
    await step('Two');
    await key(radio('1'), 'keydown', 'ArrowRight');
    await harness.click(radio('2'));
    await key(radio('2'), 'keyup', 'ArrowRight');
    expect(screen.queryByRole('heading', { name: 'Three' })).toBeNull();
    await key(radio('2'), 'keydown', ' ');
    await key(radio('2'), 'keyup', ' ');
    await step('Three');
    await harness.type(screen.getByRole('textbox', { name: 'City' }), 'Oslo');
    await harness.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0]).toEqual({ plan: 'a', score: 2, city: 'Oslo' });
  });

  it('commits the same way without a shell', async () => {
    mount(undefined, mapped.bare);
    await press(radio('Plan a'));
    await step('Two');
  });

  it('does not commit a click outside the options', async () => {
    mount({ plan: 'a' });
    await press(screen.getByRole('group', { name: 'Plan' }).querySelector('legend')!);
    expect(screen.queryByRole('heading', { name: 'Two' })).toBeNull();
  });

  it('focuses the picked option of a mapped group from the error summary', async () => {
    harness.mount({
      definition: {
        id: 'focus',
        title: '',
        submit: { label: 'Send' },
        fields: [
          { key: 'name', type: 'text', label: 'Name', validation: { required: true } },
          { key: 'plan', type: 'radio', label: 'Plan', options: [{ value: 'a', label: 'Plan a' }] },
        ],
      },
      components: mapped.shell,
      initialValues: { plan: 'a' },
      errorSummary: true,
      onSubmit: () => ({ ok: false, errors: { name: 'Taken', plan: 'Closed' } }),
    });
    await harness.type(screen.getByRole('textbox', { name: 'Name' }), 'Ada');
    await harness.click(screen.getByRole('button', { name: 'Send' }));
    const link = await screen.findByRole('link', { name: 'Plan: Closed' });
    await harness.click(link);
    await waitFor(() => expect(document.activeElement).toBe(radio('Plan a')));
    await harness.click(screen.getByRole('link', { name: 'Name: Taken' }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Name' })));
  });
}
