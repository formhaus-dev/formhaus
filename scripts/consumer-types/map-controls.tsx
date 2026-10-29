import type { FieldComponentMap, FieldProps } from '@formhaus/react';
import { type ControlShellProps, type ControlSpec, mapControls } from '@formhaus/react/controls';

function Shell({ f, rootProps, children }: ControlShellProps) {
  return (
    <div {...rootProps}>
      <label htmlFor={f.id}>{f.label}</label>
      {children}
    </div>
  );
}

function Input({ id, value, size }: { id?: string; value?: string; size?: 'small' | 'large'; onChange?: (event: unknown) => void }) {
  return <input id={id} value={value} data-size={size} readOnly />;
}

function Picker({
  value,
  items,
  onValueChange,
}: {
  value?: string;
  items?: { value: string | number }[];
  onValueChange?: (value: string) => void;
}) {
  return <button type="button" value={value} data-count={items?.length} onClick={() => onValueChange?.('a')} />;
}

const separate: ControlSpec<typeof Input> = { component: Input, props: (f) => ({ value: f.text }) };

export const objects: FieldComponentMap = mapControls({
  shell: Shell,
  controls: {
    input: { component: Input },
    password: separate,
    textarea: { component: Input, props: () => ({ size: 'large' }) },
    select: { component: Input, props: (f, options) => ({ value: f.text + options.length }) },
    radio: { component: Picker, optionsProp: 'items', changeProp: 'onValueChange' },
    scale: [Picker, 'items', 'onValueChange'],
  },
});

export const wrong = [
  // @ts-expect-error
  mapControls({ shell: Shell, controls: { textarea: { component: Input, props: () => ({ size: 1 }) } } }),
  // @ts-expect-error
  mapControls({ shell: Shell, controls: { textarea: { component: Input, props: () => ({ width: 1 }) } } }),
  // @ts-expect-error
  mapControls({ shell: Shell, controls: { radio: { component: Picker, changeProp: 'onCheckedChange' } } }),
  // @ts-expect-error
  mapControls({ shell: Shell, controls: { radio: { component: Picker, optionsProp: 'options' } } }),
  // @ts-expect-error
  mapControls({ shell: Shell, controls: { radio: { component: Picker, change: 'onValueChange' } } }),
  // @ts-expect-error
  { component: Picker, changeProp: 'onChange' } satisfies ControlSpec<typeof Picker>,
  // @ts-expect-error
  mapControls({ shell: Shell, controls: { radio: [Input, (_f, _options, { field }) => ({ size: field.columns })] } }),
];

export const contextual: FieldComponentMap = mapControls({
  shell: Shell,
  controls: {
    radio: [Input, (_f, _options, { kind, field }) => ({ size: field.layout === 'inline' && kind === 'group' ? 'small' : 'large' })],
    scale: { component: Input, props: (_f, _options, { anchors }) => ({ value: anchors.map((anchor) => anchor?.label).join() }) },
    select: [Input, (f) => ({ value: f.loading ? '' : f.freeText?.text })],
  },
});

export const handBuilt: FieldProps = {
  id: 'name',
  name: 'name',
  label: 'Name',
  inputType: 'text',
  helperId: 'name-helper',
  errorId: 'name-error',
  invalid: false,
  required: false,
  disabled: false,
  aria: {},
  optionId: (index) => `name-${index}`,
  value: '',
  text: '',
  options: [],
  change: () => {},
  commit: () => {},
  blur: () => {},
  focus: () => {},
  onInput: () => {},
  attrs: { id: 'name', name: 'name', disabled: false, onBlur: () => {}, onFocus: () => {} },
  option: (option, index) => ({
    id: `name-${index}`,
    name: 'name',
    value: option.value,
    checked: false,
    disabled: false,
    onBlur: () => {},
    onFocus: () => {},
  }),
  input: { id: 'name', name: 'name', disabled: false, onBlur: () => {}, onFocus: () => {}, value: '', onChange: () => {} },
};
