import { afterEach, describe, expect, it, vi } from 'vitest';
import { onValidate as custom } from '../../../../docs/recipes/snippets/on-validate';
import { onValidate as arktype } from '../../../../docs/recipes/snippets/schema-arktype';
import { onValidate as confirm } from '../../../../docs/recipes/snippets/schema-confirm';
import { onValidate as empty } from '../../../../docs/recipes/snippets/schema-empty';
import { validateIn } from '../../../../docs/recipes/snippets/schema-messages';
import { onValidate as serverCheck } from '../../../../docs/recipes/snippets/schema-server-check';
import { onValidate as valibot } from '../../../../docs/recipes/snippets/schema-valibot';
import { onValidate as zod } from '../../../../docs/recipes/snippets/schema-zod';
import { FormEngine } from '../../src/engine';
import type { FormDefinition } from '../../src/types';

const definition: FormDefinition = {
  id: 'team',
  title: 'Team',
  submit: { label: 'Send' },
  fields: [
    { key: 'email', type: 'text', label: 'Email', validation: { required: true } },
    {
      key: 'players',
      type: 'group',
      label: 'Players',
      fields: [{ key: 'name', type: 'text', label: 'Name', validation: { required: true } }],
    },
  ],
};

const signup: FormDefinition = {
  id: 'signup',
  title: 'Sign up',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'account',
      title: 'Account',
      fields: [
        { key: 'password', type: 'password', label: 'Password', validation: { required: true } },
        { key: 'confirm', type: 'password', label: 'Confirm', validation: { required: true } },
      ],
    },
    { id: 'contact', title: 'Contact', fields: [{ key: 'email', type: 'email', label: 'Email', validation: { required: true } }] },
  ],
};

async function submit(options: ConstructorParameters<typeof FormEngine>[2], values: Record<string, unknown>) {
  const engine = new FormEngine(definition, values, options);
  const sent = await engine.submit(() => {});
  return { sent, errors: engine.errors, topLevelErrors: engine.topLevelErrors };
}

afterEach(() => vi.unstubAllGlobals());

describe('schema validation recipes', () => {
  it.each([
    ['Zod', zod],
    ['Valibot', valibot],
    ['ArkType', arktype],
  ])('maps %s issues to fields and group items', async (_, onValidate) => {
    const result = await submit({ onValidate }, { email: 'ada', players: [{ name: 'Ada' }, { name: 'B' }] });
    expect(result.sent).toBe(false);
    expect(Object.keys(result.errors)).toEqual(['email', 'players.1.name']);
    expect(await submit({ onValidate }, { email: 'ada@example.com', players: [{ name: 'Ada' }] })).toMatchObject({ sent: true });
  });

  it.each([
    ['Zod', zod],
    ['Valibot', valibot],
    ['ArkType', arktype],
  ])('shows the definition message for an unanswered %s field', async (_, onValidate) => {
    const result = await submit({ onValidate }, { email: 'ada@example.com', players: [{ name: 'Ada' }, {}] });
    expect(result.errors).toEqual({ 'players.1.name': 'This field is required' });
  });

  it('runs the password check on Continue', async () => {
    const engine = new FormEngine(signup, { password: 'secret-12', confirm: 'secret-21' }, { onValidate: confirm });
    expect(await engine.next()).toBe(false);
    expect(engine.errors).toEqual({ confirm: 'Passwords do not match' });
    engine.setValue('confirm', 'secret-12');
    expect(await engine.next()).toBe(true);
  });

  it('lets a cleared optional field pass', async () => {
    const engine = new FormEngine(
      { id: 'site', title: 'Site', submit: { label: 'Send' }, fields: [{ key: 'website', type: 'url', label: 'Website' }] },
      {},
      { onValidate: empty },
    );
    engine.setValue('website', 'nope');
    expect(await engine.submit(() => {})).toBe(false);
    expect(engine.errors).toEqual({ website: 'Enter a full address' });
    engine.setValue('website', '');
    expect(await engine.submit(() => {})).toBe(true);
  });

  it('fetches each email once in the server check', async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 404 }));
    vi.stubGlobal('fetch', fetch);
    await submit({ onValidate: serverCheck }, { email: 'once@example.com' });
    await submit({ onValidate: serverCheck }, { email: 'once@example.com' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('checks an email again after a failed request', async () => {
    const fetch = vi
      .fn(async () => new Response(null, { status: 404 }))
      .mockImplementationOnce(async () => new Response(null, { status: 500 }));
    vi.stubGlobal('fetch', fetch);
    expect(await submit({ onValidate: serverCheck }, { email: 'retry@example.com' })).toMatchObject({ sent: true });
    expect(await submit({ onValidate: serverCheck }, { email: 'retry@example.com' })).toMatchObject({ sent: true });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('runs the server check', async () => {
    const fetch = vi.fn(async (url: string) => new Response(null, { status: url.endsWith('taken%40example.com') ? 200 : 404 }));
    vi.stubGlobal('fetch', fetch);
    expect((await submit({ onValidate: serverCheck }, { email: 'taken@example.com' })).errors).toEqual({
      email: 'This email is already registered',
    });
    expect(await submit({ onValidate: serverCheck }, { email: 'new@example.com' })).toMatchObject({ sent: true });
  });

  it('runs the custom check', async () => {
    const result = await submit(
      { onValidate: custom },
      { email: 'ada@example.com', players: [{ name: 'Ada' }, { name: 'ada' }, { name: 'Bo' }] },
    );
    expect(result.errors).toEqual({ 'players.1.name': 'Two players have this name' });
    expect(result.topLevelErrors).toEqual(['Teams need an even number of players']);
  });

  it('shows the schema messages of the active language', async () => {
    const values = { email: 'ada@example.com', players: [{ name: 'A' }] };
    expect((await submit({ onValidate: validateIn('en') }, values)).errors).toEqual({ 'players.0.name': 'Use at least 2 letters' });
    expect((await submit({ onValidate: validateIn('de') }, values)).errors).toEqual({ 'players.0.name': 'Mindestens 2 Buchstaben' });
  });

  it('shows the built-in email check before the schema', async () => {
    const onValidate = vi.fn(zod);
    const contact: FormDefinition = {
      id: 'contact',
      title: 'Contact',
      submit: { label: 'Send' },
      fields: [{ key: 'email', type: 'email', label: 'Email' }],
    };
    const engine = new FormEngine(contact, { email: 'taro@example' }, { onValidate });
    expect(await engine.submit(() => {})).toBe(false);
    expect(engine.errors).toEqual({ email: 'Enter a valid email' });
    expect(onValidate).not.toHaveBeenCalled();
    const worded = new FormEngine(
      { ...contact, messages: { email: 'Enter an email such as name@example.com' } },
      { email: 'taro@example' },
    );
    await worded.submit(() => {});
    expect(worded.errors).toEqual({ email: 'Enter an email such as name@example.com' });
  });
});
