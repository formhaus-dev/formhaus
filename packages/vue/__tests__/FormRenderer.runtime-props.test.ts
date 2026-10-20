import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import type { FormDefinition } from '@formhaus/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { markRaw } from 'vue';
import { compileScript, parse } from 'vue/compiler-sfc';
import HeadlessFormRenderer from '../src/HeadlessFormRenderer.vue';
import TypedActions from './fixtures/TypedActions.vue';
import TypedField from './fixtures/TypedField.vue';
import TypedGroup from './fixtures/TypedGroup.vue';
import TypedGroupItem from './fixtures/TypedGroupItem.vue';
import TypedProgress from './fixtures/TypedProgress.vue';
import TypedSection from './fixtures/TypedSection.vue';

const definition: FormDefinition = {
  formatVersion: '1.1',
  id: 'invoice',
  title: '',
  submit: { label: 'Create' },
  steps: [
    {
      id: 'one',
      title: 'One',
      fields: [
        { key: 'billing', type: 'section', title: 'Billing', fields: [{ key: 'client', type: 'text', label: 'Client' }] },
        { key: 'items', type: 'group', label: 'Items', fields: [{ key: 'description', type: 'text', label: 'Description' }] },
      ],
    },
    {
      id: 'two',
      title: 'Two',
      back: { label: 'Previous', variant: 'secondary' },
      fields: [{ key: 'note', type: 'x-note', label: 'Note' }],
    },
  ],
};

const components = markRaw({
  text: TypedField,
  'x-note': TypedField,
  section: TypedSection,
  group: TypedGroup,
  groupItem: TypedGroupItem,
});

const vueWarnings = (warn: { mock: { calls: unknown[][] } }) =>
  warn.mock.calls.filter(([message]) => String(message).includes('[Vue warn]'));

afterEach(() => {
  vi.restoreAllMocks();
});

describe('runtime props objects', () => {
  it('render custom SFCs built on the exported props without prop warnings', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onFieldChange = vi.fn();
    render(HeadlessFormRenderer, {
      props: { definition, components, actionsComponent: markRaw(TypedActions), progressComponent: markRaw(TypedProgress), onFieldChange },
    });
    expect(screen.getByTestId('progress').textContent).toBe('1/2 h2');
    expect(document.querySelector('[data-section="billing"]')).not.toBeNull();
    await fireEvent.update(screen.getByLabelText('Client'), 'Acme');
    await fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Description')));
    await fireEvent.click(screen.getByRole('button', { name: 'Remove Items 1' }));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Add' })));
    expect(onFieldChange.mock.calls.map(([key]) => key)).toEqual(['client', 'items', 'items']);
    await fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    const back = await screen.findByRole('button', { name: 'Previous' });
    expect(back.dataset.variant).toBe('secondary');
    expect(screen.getByLabelText('Note')).toBeDefined();
    expect(vueWarnings(warn)).toEqual([]);
  });

  it('compile in an SFC without resolving any imported type', () => {
    const source = `<script setup lang="ts">
import { fieldComponentEmits, fieldComponentProps } from '@formhaus/vue';
const props = defineProps(fieldComponentProps);
const emit = defineEmits(fieldComponentEmits);
</script>
<template><input :id="props.id" @blur="emit('blur')" /></template>`;
    const { descriptor } = parse(source, { filename: '/consumer/src/MyField.vue' });
    const { content } = compileScript(descriptor, { id: 'my-field' });
    expect(content).toContain('props: fieldComponentProps');
    expect(content).toContain('emits: fieldComponentEmits');
  });
});
