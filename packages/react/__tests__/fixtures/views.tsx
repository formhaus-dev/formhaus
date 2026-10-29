import { mapControls } from '../../src/controls';
import { useFieldProps } from '../../src/fieldProps';
import type { FieldComponentProps } from '../../src/types';
import { Plain, Shell } from './controls';

export const context = mapControls({
  shell: Shell,
  controls: {
    radio: [Plain, (_f, _options, { kind, field }) => ({ placeholder: `${kind} ${field.layout}` })],
    scale: [Plain, (_f, _options, { anchors }) => ({ placeholder: anchors.map((anchor) => anchor?.label).join('|') })],
    select: [Plain, (f) => ({ title: f.loading ? 'busy' : 'idle' })],
  },
});

function Combo(props: FieldComponentProps) {
  const f = useFieldProps(props);
  return (
    <div data-fh="field">
      <label htmlFor={f.id}>{f.label}</label>
      <input
        {...f.attrs}
        role="combobox"
        aria-expanded={false}
        aria-busy={f.loading || undefined}
        value={f.freeText.text}
        onChange={(event) => f.freeText.setText(event.target.value)}
      />
    </div>
  );
}

export const views = { autocomplete: Combo };
