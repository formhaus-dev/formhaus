import { defineComponent, h } from 'vue';
import { mapControls } from '../../src/controls';
import { useFieldProps } from '../../src/composables/useFieldProps';
import { fieldComponentEmits, fieldComponentProps } from '../../src/props';
import { Plain, Shell, target } from './controls';

export const context = mapControls({
  shell: Shell,
  controls: {
    radio: [Plain, (_f, _options, { kind, field }) => ({ placeholder: `${kind} ${field.layout}` })],
    scale: [Plain, (_f, _options, { anchors }) => ({ placeholder: anchors.map((anchor) => anchor?.label).join('|') })],
    select: [Plain, (f) => ({ title: f.loading ? 'busy' : 'idle' })],
  },
});

const Combo = defineComponent({
  props: fieldComponentProps,
  emits: fieldComponentEmits,
  setup(props, { emit }) {
    const f = useFieldProps(props, emit);
    return () =>
      h('div', { 'data-fh': 'field' }, [
        h('label', { for: f.id }, f.label),
        h('input', {
          ...f.attrs,
          role: 'combobox',
          'aria-expanded': false,
          'aria-busy': f.loading || undefined,
          value: f.freeText.text,
          onInput: (event: Event) => f.freeText.setText(target(event).value),
        }),
      ]);
  },
});

export const views = { autocomplete: Combo };
