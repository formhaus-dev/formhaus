import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { describe, expect, it, vi } from 'vitest';
import type { RendererHarness, TestKit } from '../../core/__tests__/renderers/fixtures';
import { controlScenarios } from '../../core/__tests__/renderers/controls.scenarios';
import { containerScenarios } from '../../core/__tests__/renderers/containers.scenarios';
import { definitionScenarios } from '../../core/__tests__/renderers/definition.scenarios';
import { dialogScenarios } from '../../core/__tests__/renderers/dialog.scenarios';
import { fieldScenarios } from '../../core/__tests__/renderers/fields.scenarios';
import { flowScenarios } from '../../core/__tests__/renderers/flow.scenarios';
import { handleScenarios } from '../../core/__tests__/renderers/handle.scenarios';
import { layoutScenarios } from '../../core/__tests__/renderers/layout.scenarios';
import { recallScenarios } from '../../core/__tests__/renderers/recall.scenarios';
import { focusScenarios } from '../../core/__tests__/renderers/focus.scenarios';
import { revealScenarios } from '../../core/__tests__/renderers/reveal.scenarios';
import { labelScenarios } from '../../core/__tests__/renderers/labels.scenarios';
import { idScenarios } from '../../core/__tests__/renderers/ids.scenarios';
import { exclusiveScenarios } from '../../core/__tests__/renderers/exclusive.scenarios';
import { randomizeScenarios } from '../../core/__tests__/renderers/randomize.scenarios';
import { fileListScenarios } from '../../core/__tests__/renderers/file-list.scenarios';
import { optionScenarios } from '../../core/__tests__/renderers/options.scenarios';
import { sourceScenarios } from '../../core/__tests__/renderers/sources.scenarios';
import { summaryScenarios } from '../../core/__tests__/renderers/summary.scenarios';
import { stateScenarios } from '../../core/__tests__/renderers/states.scenarios';
import { validateScenarios } from '../../core/__tests__/renderers/validate.scenarios';
import { mapCommitScenarios } from '../../core/__tests__/renderers/map-commit.scenarios';
import { mapControlScenarios } from '../../core/__tests__/renderers/map-controls.scenarios';
import { mapNamedScenarios } from '../../core/__tests__/renderers/map-named.scenarios';
import { mapObjectScenarios } from '../../core/__tests__/renderers/map-object.scenarios';
import { mapContextScenarios } from '../../core/__tests__/renderers/map-context.scenarios';
import { mapPropsScenarios } from '../../core/__tests__/renderers/map-props.scenarios';
import { defineComponent, h, type Component, type PropType } from 'vue';
import FormRenderer from '../src/FormRenderer.vue';
import { design } from './fixtures/design';
import { mapped } from './fixtures/controls';
import { context, views } from './fixtures/views';
import { fieldComponentEmits, fieldComponentProps } from '../src/props';
import { useFieldProps } from '../src/composables/useFieldProps';
import type { FormRendererHandle, GroupItemComponentProps } from '../src/types';

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

const controls = {
  'x-text': defineComponent({
    props: fieldComponentProps,
    emits: fieldComponentEmits,
    setup(props, { emit }) {
      const f = useFieldProps(props, emit);
      return () =>
        h('div', [
          h('label', { for: f.id }, f.label),
          h('input', {
            ...f.attrs,
            value: f.text,
            onInput: f.onInput,
          }),
          f.helperText && h('p', { id: f.helperId }, f.helperText),
          f.error && h('p', { id: f.errorId }, f.error),
        ]);
    },
  }),
  'x-pick': defineComponent({
    props: fieldComponentProps,
    emits: fieldComponentEmits,
    setup(props, { emit }) {
      const f = useFieldProps(props, emit);
      return () =>
        h(
          'div',
          { 'data-fh': 'field', role: 'radiogroup', 'aria-label': f.label, ...f.aria },
          f.options.map((option, index) =>
            h('input', {
              key: option.value,
              type: 'radio',
              'aria-label': option.label,
              ...f.option(option, index),
              onChange: () => f.commit(option.value),
            }),
          ),
        );
    },
  }),
  'x-wrapped': defineComponent({
    props: fieldComponentProps,
    setup: (props) => () =>
      h('div', { 'data-fh': 'field' }, [
        h('input', { 'aria-label': props.field.label, 'aria-invalid': !!props.error || undefined }),
        props.error && h('p', { id: `${props.id}-error` }, props.error),
      ]),
  }),
  'x-knob': defineComponent({
    props: fieldComponentProps,
    setup: (props) => () =>
      h('div', {
        id: props.id,
        role: 'listbox',
        tabindex: 0,
        'aria-label': props.field.label,
        'aria-invalid': !!props.error || undefined,
        'data-loading': props.loading || undefined,
      }),
  }),
  'x-dial': defineComponent({
    props: fieldComponentProps,
    setup: (props) => () =>
      h('div', { id: props.id, role: 'group', 'aria-invalid': !!props.error || undefined }, [
        h('span', { role: 'button', tabindex: 0, 'aria-disabled': 'true', 'aria-label': 'Locked' }),
        h('div', {
          role: 'slider',
          tabindex: 0,
          'aria-label': props.field.label,
          'aria-valuemin': 0,
          'aria-valuemax': 10,
          'aria-valuenow': 0,
        }),
      ]),
  }),
};

const harness: RendererHarness = {
  mount(props) {
    let handle: FormRendererHandle | null = null;
    const Mounted = defineComponent({
      inheritAttrs: false,
      setup:
        (_, { attrs }) =>
        () =>
          h(FormRenderer, {
            ...attrs,
            ref: (instance: unknown) => {
              handle = instance as FormRendererHandle | null;
            },
          }),
    });
    const { rerender } = render(Mounted, { props });
    return { update: (next) => rerender(next), handle: () => handle! };
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
  controls,
  mapped: { ...mapped, context },
  views,
  design,
};

const kit: TestKit = { it, expect, fn: vi.fn, waitFor, screen };

describe('renderer conformance: focus', () => focusScenarios(harness, kit));
describe('renderer conformance: flow', () => flowScenarios(harness, kit));
describe('renderer conformance: recall', () => recallScenarios(harness, kit));
describe('renderer conformance: error summary', () => summaryScenarios(harness, kit));
describe('renderer conformance: labels', () => labelScenarios(harness, kit));
describe('renderer conformance: states', () => stateScenarios(harness, kit));
describe('renderer conformance: fields', () => fieldScenarios(harness, kit));
describe('renderer conformance: ids', () => idScenarios(harness, kit));
describe('renderer conformance: options', () => optionScenarios(harness, kit));
describe('renderer conformance: exclusive options', () => exclusiveScenarios(harness, kit));
describe('renderer conformance: randomized options', () => randomizeScenarios(harness, kit));
describe('renderer conformance: file lists', () => fileListScenarios(harness, kit));
describe('renderer conformance: sources', () => sourceScenarios(harness, kit));
describe('renderer conformance: custom controls', () => controlScenarios(harness, kit));
describe('renderer conformance: sections and groups', () => containerScenarios(harness, kit));
describe('renderer conformance: remove dialog', () => dialogScenarios(harness, kit));
describe('renderer conformance: definition changes', () => definitionScenarios(harness, kit));
describe('renderer conformance: layout slots', () => layoutScenarios(harness, kit));
describe('renderer conformance: handle', () => handleScenarios(harness, kit));
describe('renderer conformance: onValidate', () => validateScenarios(harness, kit));
describe('renderer conformance: mapControls', () => mapControlScenarios(harness, kit));
describe('renderer conformance: mapControls commit', () => mapCommitScenarios(harness, kit));
describe('renderer conformance: mapControls change props', () => mapNamedScenarios(harness, kit));
describe('renderer conformance: mapControls object form', () => mapObjectScenarios(harness, kit));
describe('renderer conformance: mapControls field props', () => mapPropsScenarios(harness, kit));
describe('renderer conformance: mapControls context and field views', () => mapContextScenarios(harness, kit));
describe('renderer conformance: conditional reveal', () => revealScenarios(harness, kit));
