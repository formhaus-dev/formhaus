import { afterEach, describe, expect, it, vi } from 'vitest';
import { onValidate as custom } from '../../../../docs/recipes/snippets/on-validate';
import { onValidate as arktype } from '../../../../docs/recipes/snippets/schema-arktype';
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
    { key: 'email', type: 'text', label: 'Email' },
    { key: 'players', type: 'group', label: 'Players', fields: [{ key: 'name', type: 'text', label: 'Name' }] },
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

  it('runs the server check', async () => {
    const fetch = vi.fn(async (url: string) => new Response(null, { status: url.endsWith('taken%40example.com') ? 200 : 404 }));
    vi.stubGlobal('fetch', fetch);
    expect((await submit({ onValidate: serverCheck }, { email: 'taken@example.com' })).errors).toEqual({
      email: 'This email is already registered',
    });
    expect(await submit({ onValidate: serverCheck }, { email: 'new@example.com' })).toMatchObject({ sent: true });
  });

  it('runs the custom check', async () => {
    const result = await submit({ onValidate: custom }, { players: [{ name: 'Ada' }, { name: 'ada' }, { name: 'Bo' }] });
    expect(result.errors).toEqual({ 'players.1.name': 'Two players have this name' });
    expect(result.topLevelErrors).toEqual(['Teams need an even number of players']);
  });
});
