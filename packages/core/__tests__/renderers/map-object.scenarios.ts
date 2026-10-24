import type { FormDefinition, FormField } from '../../src';
import type { RendererHarness, TestKit } from './fixtures';
import { allTypes } from './map-controls.scenarios';

const plan: FormField = {
  key: 'plan',
  type: 'radio',
  label: 'Plan',
  options: ['a', 'b', 'c'].map((value) => ({ value, label: `Plan ${value}` })),
};

export const objectEntries = <Controls extends object>(controls: Controls): Controls =>
  Object.fromEntries(
    Object.entries(controls).map(([type, entry]) => [
      type,
      Array.isArray(entry)
        ? { component: entry[0], [typeof entry[1] === 'string' ? 'optionsProp' : 'props']: entry[1], changeProp: entry[2] }
        : { component: entry },
    ]),
  ) as Controls;

export const mergedEntry = <Component>(component: Component) => ({
  radio: { component, optionsProp: 'options', props: (_: unknown, options: unknown[]) => ({ options: options.slice(1) }) },
});

const single: FormDefinition = { id: 'single', title: '', submit: { label: 'Send' }, fields: [plan] };

export function mapObjectScenarios(harness: RendererHarness, { it, expect, fn, screen }: TestKit): void {
  const mapped = harness.mapped!;
  const markup = (form: Element) => form.outerHTML.replace(new RegExp(form.querySelector('input')!.id.replace(/name$/, ''), 'g'), '');

  it('renders the object form like the tuple form', () => {
    harness.mount({ definition: allTypes, components: mapped.shell, onSubmit: fn() });
    harness.mount({ definition: allTypes, components: mapped.object, onSubmit: fn() });
    const [tuple, object] = document.querySelectorAll('form');
    expect(markup(object)).toBe(markup(tuple));
    expect(object.querySelector('[list]')?.getAttribute('list')).toBe('a,b');
  });

  it('passes the options to optionsProp and lets props override them', () => {
    harness.mount({ definition: single, components: mapped.objectMerged, onSubmit: fn() });
    expect(screen.getAllByRole('radio').map((radio) => radio.getAttribute('value'))).toEqual(['b', 'c']);
  });

  it('routes changeProp through the change rules', async () => {
    const onFieldChange = fn();
    harness.mount({ definition: single, components: mapped.objectNamed, onSubmit: fn(), onFieldChange });
    await harness.click(screen.getByRole('radio', { name: 'Plan b' }));
    expect(onFieldChange.mock.calls.map(([, value]) => value)).toEqual(['b']);
  });
}
