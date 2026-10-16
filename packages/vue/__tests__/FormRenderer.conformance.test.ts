import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vitest';
import type { RendererHarness, TestKit } from '../../core/__tests__/renderers/fixtures';
import { containerScenarios } from '../../core/__tests__/renderers/containers.scenarios';
import { dialogScenarios } from '../../core/__tests__/renderers/dialog.scenarios';
import { fieldScenarios } from '../../core/__tests__/renderers/fields.scenarios';
import { flowScenarios } from '../../core/__tests__/renderers/flow.scenarios';
import { focusScenarios } from '../../core/__tests__/renderers/focus.scenarios';
import { idScenarios } from '../../core/__tests__/renderers/ids.scenarios';
import { optionScenarios } from '../../core/__tests__/renderers/options.scenarios';
import { sourceScenarios } from '../../core/__tests__/renderers/sources.scenarios';
import { stateScenarios } from '../../core/__tests__/renderers/states.scenarios';
import { defineComponent, h, type Component, type PropType } from 'vue';
import FormRenderer from '../src/FormRenderer.vue';
import type { GroupItemComponentProps } from '../src/types';

const containers = {
  section: defineComponent({
    props: { title: String },
    setup:
      (props, { slots }) =>
      () =>
        h('div', [h('h3', props.title), slots.default?.()]),
  }),
  group: defineComponent({
    props: {
      id: String,
      label: String,
      items: Array as PropType<GroupItemComponentProps[]>,
      canAdd: Boolean,
      add: Function as PropType<() => void>,
    },
    setup: (props) => () =>
      h('div', { id: props.id }, [
        h('span', `${props.label}: ${props.items!.length}`),
        ...props.items!.map((item) =>
          h('div', { key: item.id, 'data-fh-group-item': '' }, [
            h('span', { id: item.titleId, tabindex: -1 }, item.title),
            h('button', { type: 'button', onClick: item.remove }, `Drop ${item.title}`),
            h(item.fields as Component),
          ]),
        ),
        h('button', { type: 'button', disabled: !props.canAdd, onClick: props.add, 'data-fh-group-add': '' }, 'More'),
      ]),
  }),
  confirmDialog: defineComponent({
    props: { title: String, confirm: Function as PropType<() => void> },
    setup: (props) => () => h('div', [h('p', props.title), h('button', { type: 'button', onClick: props.confirm }, 'Yes')]),
  }),
};

const harness: RendererHarness = {
  mount(props) {
    const { rerender } = render(FormRenderer, { props });
    return { update: (next) => rerender(next) };
  },
  async click(element) {
    await fireEvent.click(element);
  },
  async type(element, value) {
    await fireEvent.update(element, value);
  },
  async submit(form) {
    await fireEvent.submit(form);
  },
  containers,
};

const kit: TestKit = { it, expect, fn: vi.fn, waitFor, screen };

describe('renderer conformance: focus', () => focusScenarios(harness, kit));
describe('renderer conformance: flow', () => flowScenarios(harness, kit));
describe('renderer conformance: states', () => stateScenarios(harness, kit));
describe('renderer conformance: fields', () => fieldScenarios(harness, kit));
describe('renderer conformance: ids', () => idScenarios(harness, kit));
describe('renderer conformance: options', () => optionScenarios(harness, kit));
describe('renderer conformance: sources', () => sourceScenarios(harness, kit));
describe('renderer conformance: sections and groups', () => containerScenarios(harness, kit));
describe('renderer conformance: remove dialog', () => dialogScenarios(harness, kit));
