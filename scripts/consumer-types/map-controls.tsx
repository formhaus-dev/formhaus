import type { FieldComponentMap } from '@formhaus/react';
import { type ControlShellProps, mapControls } from '@formhaus/react/controls';

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

export const objects: FieldComponentMap = mapControls({
  shell: Shell,
  controls: {
    input: { component: Input },
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
];
