import { describe, expect, it } from 'vitest';
import { selectedForm } from '../forms';

const definition = { id: 'signup', title: 'Sign up', submit: { label: 'Go' }, fields: [] };

function frame(data: Record<string, string>) {
  return { type: 'FRAME', parent: { type: 'SECTION', parent: { type: 'PAGE' } }, getSharedPluginData: (_: string, key: string) => data[key] ?? '' };
}

describe('selectedForm', () => {
  it('reads the definition from the form frame that contains the selection', () => {
    const form = frame({ definitionId: 'signup', definition: JSON.stringify(definition) });
    const group = { type: 'FRAME', parent: form, getSharedPluginData: () => '' };
    const field = { type: 'INSTANCE', parent: group };
    expect(selectedForm([field as unknown as SceneNode])).toEqual({ definition, layout: { actions: 'stacked' } });
  });

  it('ignores frames without a stored definition and other selections', () => {
    expect(selectedForm([frame({ definitionId: 'old' }) as unknown as SceneNode])).toBeNull();
    expect(selectedForm([frame({}) as unknown as SceneNode])).toBeNull();
    expect(selectedForm([])).toBeNull();
  });
});
