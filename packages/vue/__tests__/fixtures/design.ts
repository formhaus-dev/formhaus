import { type Component, defineComponent, h } from 'vue';
import {
  confirmDialogComponentProps,
  errorSummaryComponentProps,
  fieldComponentProps,
  fieldsContainerProps,
  formActionsProps,
  formErrorsComponentProps,
  formStepProgressProps,
  groupComponentProps,
  groupItemComponentProps,
  sectionComponentProps,
} from '../../src/props';

const types = ['text', 'email', 'phone', 'number', 'password', 'select', 'autocomplete', 'multiselect', 'checkbox', 'radio'];
const more = ['switch', 'file', 'date', 'datetime', 'time', 'textarea', 'hidden', 'scale', 'rating'];

const Field = defineComponent({
  props: fieldComponentProps,
  emits: ['update:modelValue'],
  setup:
    (props, { emit }) =>
    () =>
      h('div', { class: 'ds-field' }, [
        h('label', { for: props.id }, props.field.label),
        h('input', {
          id: props.id,
          value: typeof props.modelValue === 'string' ? props.modelValue : '',
          'aria-invalid': props.error ? 'true' : undefined,
          'data-matrix': props.matrix && `${props.matrix.row}/${props.matrix.columns.length}`,
          onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
        }),
        props.error && h('p', { id: `${props.id}-error` }, props.error),
      ]),
});

const layout: Record<string, Component> = {
  fields: defineComponent({
    props: fieldsContainerProps,
    setup:
      (props, { slots }) =>
      () =>
        h('div', { ...props.rootProps, class: 'ds-stack' }, slots.default?.()),
  }),
  section: defineComponent({
    props: sectionComponentProps,
    setup:
      (props, { slots }) =>
      () =>
        h('fieldset', { id: props.id, class: 'ds-section' }, [h('legend', props.title), slots.default?.()]),
  }),
  group: defineComponent({
    props: groupComponentProps,
    setup: (props) => () =>
      h('div', { id: props.id, class: 'ds-group' }, [
        h('span', props.label),
        ...props.items.map((item) => h(props.itemComponent, { key: item.id, ...item })),
        props.canAdd && h('button', { type: 'button', 'data-fh-group-add': '', onClick: props.add }, props.addLabel),
      ]),
  }),
  groupItem: defineComponent({
    props: groupItemComponentProps,
    setup: (props) => () =>
      h('div', { 'data-fh-group-item': '', role: 'group', 'aria-labelledby': props.titleId }, [
        h('span', { id: props.titleId, tabindex: -1 }, props.title),
        props.canRemove &&
          h(
            'button',
            { type: 'button', id: `${props.titleId}-remove`, 'aria-label': props.removeName, onClick: props.requestRemove },
            props.removeLabel,
          ),
        h(props.fields),
      ]),
  }),
  confirmDialog: defineComponent({
    props: confirmDialogComponentProps,
    setup: (props) => () =>
      h('div', { id: props.id, class: 'ds-dialog', 'data-open': String(props.open), hidden: !props.open }, [
        h('p', props.title),
        h('button', { type: 'button', onClick: props.confirm }, props.confirmLabel),
        h('button', { type: 'button', onClick: props.cancel }, props.cancelLabel),
      ]),
  }),
  errorSummary: defineComponent({
    props: errorSummaryComponentProps,
    setup: (props) => () =>
      h('div', { ...props.rootProps, class: 'ds-summary', 'data-count': props.count }, [
        h('strong', props.title),
        ...props.groups.flatMap((group) =>
          group.entries.map((entry) =>
            h(
              'a',
              {
                key: entry.key,
                href: `#${entry.id}`,
                onClick: (event: Event) => {
                  event.preventDefault();
                  props.showField(entry.key);
                },
              },
              entry.text,
            ),
          ),
        ),
      ]),
  }),
  formErrors: defineComponent({
    props: formErrorsComponentProps,
    setup: (props) => () =>
      h(
        'div',
        { ...props.rootProps, class: 'ds-errors' },
        props.errors.map((error) => h('p', { key: error }, error)),
      ),
  }),
  progress: defineComponent({
    props: formStepProgressProps,
    setup: (props) => () =>
      h('div', { ...props.rootProps, class: 'ds-progress' }, [
        h('span', `${props.current}/${props.total}`),
        h(
          'ol',
          props.steps?.map((step) => h('li', { key: step.id }, step.title)),
        ),
      ]),
  }),
  actions: defineComponent({
    props: formActionsProps,
    emits: ['back', 'primary'],
    setup:
      (props, { emit }) =>
      () =>
        h('div', { ...props.rootProps, class: 'ds-actions' }, [
          !props.isFirstStep && h('button', { type: 'button', onClick: () => emit('back') }, 'Back'),
          h(
            'button',
            {
              type: 'submit',
              onClick: (event: Event) => {
                event.preventDefault();
                emit('primary');
              },
            },
            props.primaryLabel,
          ),
        ]),
  }),
};

export const design = { components: Object.fromEntries([...types, ...more].map((type) => [type, Field])), layout };
