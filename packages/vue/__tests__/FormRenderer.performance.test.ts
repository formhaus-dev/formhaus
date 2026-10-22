import { fireEvent, render, screen } from '@testing-library/vue';
import type { FormDefinition } from '@formhaus/core';
import { describe, expect, it } from 'vitest';
import { type Component, type PropType, defineComponent, effectScope, h, nextTick, ref } from 'vue';
import FormRenderer from '../src/FormRenderer.vue';
import { useFormEngine } from '../src/composables/useFormEngine';
import { useNodeProps } from '../src/composables/useNodeProps';
import type { FormRendererProps, GroupItemComponentProps } from '../src/types';

let groupRenders = 0;

const CountedGroup = defineComponent({
  props: { label: String, items: Array as PropType<GroupItemComponentProps[]> },
  setup: (props) => () => {
    groupRenders++;
    return h('div', [
      h('span', props.label),
      ...props.items!.map((item) =>
        h('div', { key: item.id }, [h('span', item.hasContent ? 'filled' : 'empty'), h(item.fields as Component)]),
      ),
    ]);
  },
});

const definition: FormDefinition = {
  id: 'group-isolation',
  title: 'Group isolation',
  submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    { key: 'people', type: 'group', label: 'People', defaultItems: 1, fields: [{ key: 'person', type: 'text', label: 'Person' }] },
  ],
};

describe('FormRenderer group isolation', () => {
  it('does not render a group again when an unrelated field changes', async () => {
    render(FormRenderer, { props: { definition, components: { group: CountedGroup } } });
    const before = groupRenders;

    await fireEvent.update(screen.getByRole('textbox', { name: 'Name' }), 'Ada');

    expect(groupRenders).toBe(before);
  });

  it('renders a group again when one of its items changes', async () => {
    render(FormRenderer, { props: { definition, components: { group: CountedGroup } } });
    expect(screen.getByText('empty')).toBeDefined();

    await fireEvent.update(screen.getByRole('textbox', { name: 'Person' }), 'Grace');

    expect(screen.getByText('filled')).toBeDefined();
  });
});

describe('group props memo', () => {
  it('starts over when the definition is replaced', async () => {
    const current = ref<FormDefinition>(definition);
    const scope = effectScope();
    const props = scope.run(() => {
      const form = useFormEngine(() => current.value);
      const noop = () => {};
      return useNodeProps(form, { definition } as FormRendererProps, 'form', ref(false), ref(undefined), {
        update: noop,
        commit: noop,
        changeItems: () => true,
        blur: noop,
        focus: noop,
      });
    })!;
    const group = definition.fields![1] as Parameters<typeof props.nodeProps>[0];
    const before = props.nodeProps(group);
    expect(props.nodeProps(group).errors).toBe(before.errors);

    current.value = { ...definition, id: 'replaced' };
    await nextTick();

    expect(props.nodeProps(group).errors).not.toBe(before.errors);
    scope.stop();
  });
});
