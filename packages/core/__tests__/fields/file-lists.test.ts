import { describe, expect, it, vi } from 'vitest';
import { checkDefinition, FormEngine, type FormDefinition, type FormField } from '../../src';
import { carryValues } from '../../src/cloud/carry';
import { createUploader, type Send } from '../../src/cloud/files';
import { controlProps, fromControl } from '../../src/controls';
import { fieldState } from '../../src/fields';
import { fixAll } from '../../src/fix';
import { translationTemplate } from '../../src/i18n';
import { validateSubmission } from '../../src/server';

const docs: FormField = { key: 'docs', type: 'file', label: 'Documents', multiple: true };
const cover: FormField = { key: 'cover', type: 'file', label: 'Cover' };
const form = (formatVersion: string, fields: FormField[] = [docs, cover]): FormDefinition => ({
  formatVersion,
  id: 'attachments',
  title: 'Attachments',
  submit: { label: 'Send' },
  fields: fields.map((field) => ({ ...field })),
});
const engineField = (definition: FormDefinition) => new FormEngine(definition).definition.fields![0] as FormField;
const file = (name: string) => ({ name, size: 4, type: 'application/pdf', arrayBuffer: async () => new ArrayBuffer(4) });

function uploads() {
  const send = vi.fn<Send>(async (_url, init) => {
    if (init.method === 'PUT') return { ok: true, status: 200, json: async () => null } as unknown as CloudResponse;
    const { name } = JSON.parse(String(init.body));
    const ticket = { id: `up-${name}`, url: `https://objects.test/${name}`, method: 'PUT', headers: {} };
    return { ok: true, status: 201, json: async () => ticket } as unknown as CloudResponse;
  });
  return { send, uploader: createUploader('https://api.test/f/abc/uploads', send) };
}

describe('file lists', () => {
  it('uploads every file of a list in order and keeps references', async () => {
    const definition = form('1.7');
    new FormEngine(definition);
    const { send, uploader } = uploads();
    const [a, b, c] = [file('a.pdf'), file('b.pdf'), file('c.pdf')];
    const sent = await uploader.upload(definition, { docs: ['ref-0', a, b], cover: c });
    expect(sent).toEqual({ docs: ['ref-0', 'up-a.pdf', 'up-b.pdf'], cover: 'up-c.pdf' });
    const tickets = send.mock.calls.filter(([, init]) => init.method === 'POST').map(([, init]) => JSON.parse(String(init.body)));
    expect(tickets.filter(({ field }) => field === 'docs')).toEqual([
      { field: 'docs', name: 'a.pdf', size: 4 },
      { field: 'docs', name: 'b.pdf', size: 4 },
    ]);
    expect(await uploader.upload(definition, { docs: [b, a] })).toEqual({ docs: ['up-b.pdf', 'up-a.pdf'] });
    expect(send).toHaveBeenCalledTimes(6);
  });

  it('keeps a list below format 1.7 as the single-file uploader always did', async () => {
    const { send, uploader } = uploads();
    const values = { docs: [file('a.pdf')] };
    expect(await uploader.upload(form('1.6'), values)).toEqual(values);
    expect(send).not.toHaveBeenCalled();
  });

  it('carries a list only into a file list', () => {
    const list = form('1.7', [docs]);
    const single = form('1.6', [docs]);
    expect(carryValues({ docs: ['a'] }, list, list)).toEqual({ docs: ['a'] });
    expect(carryValues({ docs: ['a'] }, list, single)).toEqual({});
    expect(carryValues({ docs: 'a' }, single, list)).toEqual({});
  });

  it('maps a picked FileList to an array in mapControls and sets multiple', () => {
    const field = engineField(form('1.7'));
    const picked = { 0: 'a', 1: 'b', length: 2 };
    expect(fromControl(field, picked)).toEqual(['a', 'b']);
    expect(fromControl(field, null)).toEqual([]);
    expect(fromControl(engineField(form('1.6')), picked)).toBe('a');
    const preset = { kind: 'input' as const, shell: false, input: false, attrs: {}, valueKey: 'value' };
    const props = (target: FormField) => controlProps(target, { ...fieldState({ id: 'f', field: target }), value: [] }, preset).control;
    expect(props({ ...field })).toEqual({ multiple: true });
    expect(props(engineField(form('1.6')))).toEqual({});
  });

  it('works with a frozen definition', () => {
    const definition = Object.freeze({ ...form('1.7'), fields: [Object.freeze({ ...docs, validation: { maxLength: 1 } })] });
    expect(validateSubmission(definition, { docs: ['a', 'b'] }).errors).toEqual({ docs: 'At most 1 allowed' });
  });

  it('removes multiple where it does not apply', () => {
    const definition = form('1.7', [{ key: 'name', type: 'text', label: 'Name', multiple: true }]);
    expect(checkDefinition(definition).map(({ code }) => code)).toEqual(['multiple-not-applicable']);
    expect(fixAll(definition).definition.fields).toEqual([{ key: 'name', type: 'text', label: 'Name' }]);
  });

  it('lists the labels a file list shows for translation', () => {
    const labels = (definition: FormDefinition) => Object.keys(translationTemplate(definition).labels ?? {});
    expect(labels(form('1.7', [docs]))).toEqual(expect.arrayContaining(['removeItem', 'removeItemNamed', 'itemAdded', 'itemRemoved']));
    expect(labels(form('1.6', [docs]))).not.toContain('removeItem');
  });
});
