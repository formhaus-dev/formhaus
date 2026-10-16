import { describe, expect, it } from 'vitest';
import { FormEngine } from '../../src/engine';
import type { FormDefinition } from '../../src/types';

const text = (key: string, extra: object = {}) => ({ key, type: 'text' as const, label: key, ...extra });

describe('validators that hide fields through the engine', () => {
  it('drops an error from a field a validate() validator hid on the next write', () => {
    const definition: FormDefinition = {
      id: 'hide-validate',
      title: '',
      submit: { label: 'Send' },
      fields: [
        text('ctl', { validation: { validator: 'hide' } }),
        text('dep', { show: [{ field: 'ctl', neq: 'n' }], validation: { required: true } }),
        text('other'),
      ],
    };
    const engine: FormEngine = new FormEngine(
      definition,
      { ctl: 'y', dep: '' },
      {
        validators: {
          hide: () => {
            engine.setValue('ctl', 'n');
            return null;
          },
        },
      },
    );
    engine.validate();
    expect(engine.errors).toEqual({ dep: 'This field is required' });
    engine.setValue('other', 'x');
    expect(engine.errors).toEqual({});
    expect(engine.values).toEqual({ ctl: 'n', other: 'x' });
  });

  it('drops an error from a field whose own validateField() validator hid it on the next write', () => {
    const definition: FormDefinition = {
      id: 'hide-self',
      title: '',
      submit: { label: 'Send' },
      fields: [text('ctl'), text('dep', { show: [{ field: 'ctl', neq: 'n' }], validation: { validator: 'hideSelf' } }), text('other')],
    };
    const engine: FormEngine = new FormEngine(
      definition,
      { ctl: 'y', dep: 'v' },
      {
        validators: {
          hideSelf: () => {
            engine.setValue('ctl', 'n');
            return 'stale';
          },
        },
      },
    );
    expect(engine.validateField('dep')).toBe('stale');
    expect(engine.errors).toEqual({ dep: 'stale' });
    engine.setValue('other', 'x');
    expect(engine.errors).toEqual({});
  });

  it('drops a step error from a field a next() validator hid on the next write', async () => {
    const definition: FormDefinition = {
      id: 'hide-step',
      title: '',
      submit: { label: 'Send' },
      steps: [
        {
          id: 's0',
          title: '',
          fields: [
            text('ctl', { validation: { validator: 'hide' } }),
            text('dep', { show: [{ field: 'ctl', neq: 'n' }], validation: { required: true } }),
            text('note'),
          ],
        },
        { id: 's1', title: '', fields: [text('other')] },
      ],
    };
    const engine: FormEngine = new FormEngine(
      definition,
      { ctl: 'y', dep: '' },
      {
        validators: {
          hide: () => {
            if (engine.values.ctl !== 'n') engine.setValue('ctl', 'n');
            return null;
          },
        },
      },
    );
    expect(await engine.next()).toBe(false);
    expect(engine.errors).toEqual({ dep: 'This field is required' });
    engine.setValue('note', 'x');
    expect(engine.errors).toEqual({});
    expect(engine.stepErrors).toEqual({});
  });
});
