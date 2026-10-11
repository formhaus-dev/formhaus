import { describe, expect, it } from 'vitest';
import { addField, addStep, createForm, findIssues, fromDefinition, inferType, serialize, setKey, splitLines } from '../src';
import { template } from './fixtures';

describe('serialize', () => {
  it('maps definition paths to uids', () => {
    const form = fromDefinition(template('agency-fit-quiz.json'));
    const { paths, definition } = serialize(form);
    expect(paths.get('steps.0')).toBe(form.blocks[0].uid);
    expect(paths.get('steps.0.fields.0')).toBe(form.blocks[1].uid);
    expect(paths.get('steps.0.fields.0.options.1')).toBeDefined();
    expect(definition.steps?.length).toBeGreaterThan(1);
  });

  it('models the agency quiz branch as option jumps', () => {
    const form = fromDefinition(template('agency-fit-quiz.json'));
    const pages = form.blocks.filter((block) => block.kind === 'page');
    expect(pages.every((page) => !page.routes || page.id === 'resources')).toBe(true);
  });

  it('adds the schema url to new forms', () => {
    const form = createForm('signup', 'Sign up');
    addField(form, { step: null }, { label: 'Email', type: 'email' });
    expect(serialize(form).definition).toMatchObject({ $schema: expect.any(String), id: 'signup', submit: { label: 'Submit' } });
  });
});

describe('issues', () => {
  it('lets a locked key win over a derived one', () => {
    const form = createForm();
    const first = addField(form, { step: null }, { label: 'Name' });
    const second = addField(form, { step: null }, { label: 'Other' });
    setKey(form, second.uid, 'name');
    addStep(form);
    expect([first.key, second.key]).toEqual(['name2', 'name']);
  });

  it('reports duplicate keys and empty steps', () => {
    const form = createForm();
    const first = addField(form, { step: null }, { label: 'Name' });
    const second = addField(form, { step: null }, { label: 'Other' });
    setKey(form, first.uid, 'name');
    setKey(form, second.uid, 'name');
    addStep(form);
    const messages = findIssues(form).map((issue) => issue.message);
    expect(messages).toContain('Response key "name" is used by another field.');
    expect(messages).toContain('This step has no fields.');
  });
});

describe('smart', () => {
  it('infers types and splits pasted lists', () => {
    expect(inferType('Your email')).toBe('email');
    expect(splitLines('- One\n2. Two\n\n• Three')).toEqual(['One', 'Two', 'Three']);
  });
});
