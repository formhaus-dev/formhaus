import type { LayoutComponentMap } from '@formhaus/vue';
import { defineComponent, h, type PropType, type Ref } from 'vue';
import { icon, type UiIcon } from '../icons';

export interface AiLayoutContext {
  hint: Ref<string>;
  saved: Ref<boolean>;
  running: Ref<boolean>;
  cancelled: Ref<boolean>;
  forget(): void;
  close(): void;
  cancel(): void;
}

const glyph = (name: UiIcon) => (element: unknown) => (element as Element | null)?.replaceChildren(icon(name));

export function createAiLayout(context: AiLayoutContext): LayoutComponentMap {
  const fields = defineComponent({
    props: { rootProps: Object as PropType<Record<string, unknown>> },
    setup:
      (props, { slots }) =>
      () =>
        h('div', { ...props.rootProps, class: 'ai-fields' }, [
          h('span', { class: 'ai-title' }, 'Describe with AI'),
          slots.default?.(),
          h('div', { class: 'ai-hint' }, [
            h('span', { class: 'hint' }, context.hint.value),
            context.saved.value
              ? h('button', { type: 'button', class: 'link', disabled: context.running.value, onClick: context.forget }, 'Forget key')
              : null,
          ]),
          h('button', {
            ref: glyph('close'),
            type: 'button',
            class: 'icon-btn ai-close',
            title: 'Close',
            'aria-label': 'Close',
            onClick: context.close,
          }),
        ]),
  });

  const formErrors = defineComponent({
    props: {
      rootProps: Object as PropType<Record<string, unknown>>,
      errors: { type: Array as PropType<readonly string[]>, default: () => [] },
    },
    setup: (props) => () =>
      h(
        'div',
        { ...props.rootProps, class: ['output', context.cancelled.value ? 'info' : 'error'] },
        props.errors.map((error) => h('p', error)),
      ),
  });

  const actions = defineComponent({
    inheritAttrs: false,
    props: { loading: Boolean, rootProps: Object as PropType<Record<string, unknown>> },
    setup: (props) => () =>
      h('div', { ...props.rootProps, class: 'ai-actions' }, [
        props.loading ? h('button', { type: 'button', class: 'btn btn-secondary btn-small', onClick: context.cancel }, 'Cancel') : null,
        h(
          'button',
          { type: 'submit', class: 'btn btn-primary btn-small', disabled: props.loading },
          props.loading ? 'Generating…' : 'Generate',
        ),
      ]),
  });

  return { fields, formErrors, actions };
}
