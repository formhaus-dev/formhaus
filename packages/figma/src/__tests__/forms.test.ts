import { describe, expect, it } from 'vitest';
import { selectedForm } from '../forms';
import { normalizeLayout, type FormLayout } from '../render-actions';
import { layoutSteps } from '../render-form';

const definition = { id: 'signup', title: 'Sign up', submit: { label: 'Go' }, fields: [] };

function frame(data: Record<string, string>) {
  return { type: 'FRAME', parent: { type: 'SECTION', parent: { type: 'PAGE' } }, getSharedPluginData: (_: string, key: string) => data[key] ?? '' };
}

describe('selectedForm', () => {
  it('reads the definition from the form frame that contains the selection', () => {
    const form = frame({ definitionId: 'signup', definition: JSON.stringify(definition) });
    const group = { type: 'FRAME', parent: form, getSharedPluginData: () => '' };
    const field = { type: 'INSTANCE', parent: group };
    expect(selectedForm([field as unknown as SceneNode])).toEqual({ definition, layout: { actions: 'stacked', steps: 'screens' } });
  });

  it('ignores frames without a stored definition and other selections', () => {
    expect(selectedForm([frame({ definitionId: 'old' }) as unknown as SceneNode])).toBeNull();
    expect(selectedForm([frame({}) as unknown as SceneNode])).toBeNull();
    expect(selectedForm([])).toBeNull();
  });

  it('keeps only known layout values', () => {
    expect(normalizeLayout({ actions: 'inline', steps: 'page' })).toEqual({ actions: 'inline', steps: 'page' });
    expect(normalizeLayout({ steps: 'grid' } as unknown as FormLayout)).toEqual({ actions: 'stacked', steps: 'screens' });
    expect(normalizeLayout(null)).toEqual({ actions: 'stacked', steps: 'screens' });
  });

  it('folds steps into one page only for multi-step forms', () => {
    const steps = [{ id: 'a', title: 'A', fields: [] }, { id: 'b', title: 'B', fields: [] }];
    const form = { ...definition, steps };
    expect(layoutSteps(form, { actions: 'stacked', steps: 'page' })).toEqual([{ title: 'Sign up', fields: [], sections: steps }]);
    expect(layoutSteps(form, { actions: 'stacked', steps: 'screens' })).toEqual(steps);
    expect(layoutSteps({ ...definition, steps: [steps[0]] }, { actions: 'stacked', steps: 'page' })).toEqual([steps[0]]);
  });
});
