import type { FieldType, FormField } from '@formhaus/core';
import {
  choiceControl,
  type ControlClickEvent,
  type ControlEntryOf,
  type ControlKeyEvent,
  type ControlKind,
  type ControlOption,
  type ControlRoot,
  controlKind,
  controlOptions,
  controlProps,
  controlShell,
  fromControl,
  type LooseProps,
  type MapControlsOptions,
  type MappedTypes,
  mapControlTypes,
  warnDoubleLabel,
} from '@formhaus/core/controls';
import { type FieldComponentProps, type FieldProps, fieldProps } from '@formhaus/react';
import { type ComponentType, createElement, isValidElement, type ReactElement, type ReactNode, useEffect, useRef } from 'react';

export interface ControlRootProps extends ControlRoot {
  onPointerDown: () => void;
  onKeyDownCapture: (event: ControlKeyEvent) => void;
  onKeyDown: (event: ControlKeyEvent) => void;
  onKeyUp: (event: ControlKeyEvent) => void;
  onClick: (event: ControlClickEvent) => void;
}

export interface ControlShellProps {
  kind: ControlKind;
  field: FormField;
  f: FieldProps;
  rootProps: ControlRootProps;
  children: ReactNode;
}

type Control = ComponentType<never>;

type PropsOf<C> = C extends ComponentType<infer Props> ? Props : never;

export type ControlAdapter<C extends Control> =
  | (keyof PropsOf<C> & string)
  | ((f: FieldProps, options: ControlOption[]) => LooseProps<PropsOf<C>>);

export type ControlEntry<C extends Control = Control> = C | readonly [C, ControlAdapter<C> | null, (keyof PropsOf<C> & string)?];

type Checked<Controls> = {
  [Type in keyof Controls]: Controls[Type] extends readonly [infer C extends Control, unknown, ...unknown[]]
    ? readonly [C, ControlAdapter<C> | null, (keyof PropsOf<C> & string)?]
    : Controls[Type];
};

export type ControlMap = { [Type in FieldType | 'input']?: ControlEntryOf<Control, FieldProps> };

export type MapControlsConfig<Controls = ControlMap> = MapControlsOptions<
  ComponentType<ControlShellProps>,
  FieldProps,
  ComponentType<FieldComponentProps>,
  Controls
>;

export type MappedControl = (props: FieldComponentProps) => ReactElement;

function mapped(entry: ControlEntryOf<Control, FieldProps>, input: boolean, config: MapControlsConfig): MappedControl {
  const [Control, adapter, changeProp = 'onChange'] = (Array.isArray(entry) ? entry : [entry]) as unknown as [
    ComponentType<Record<string, unknown>>,
    ControlAdapter<Control>?,
    string?,
  ];
  return function MappedControl(props: FieldComponentProps) {
    const f = fieldProps(props);
    const latest = useRef({ props, f });
    latest.current = { props, f };
    const choice = useRef<ReturnType<typeof choiceControl>>(null);
    choice.current ??= choiceControl(
      () => ({
        field: latest.current.props.field,
        value: latest.current.f.value,
        options: latest.current.f.options,
        disabled: latest.current.f.disabled,
      }),
      (value) => latest.current.f.change(value),
      (value) => latest.current.f.commit(value),
    );
    const { pick, stop, pointerDown, keyDownCapture, keyDown, keyUp, click } = choice.current;
    useEffect(() => stop, []);
    useEffect(() => {
      try {
        if (process.env.NODE_ENV !== 'production') warnDoubleLabel(document, f.id);
      } catch {}
    }, [f.id]);
    if (props.matrix && config.matrix) return <config.matrix {...props} />;
    const { field } = props;
    const kind = controlKind(field.type, config.kinds);
    const Shell = controlShell(config.shell, kind);
    const options = controlOptions(field, f.options);
    const valueKey = kind === 'inline' ? 'checked' : 'value';
    const { control, root } = controlProps(field, f, { kind, shell: !!Shell, input, attrs: f.input, valueKey });
    const element = createElement(Control, {
      ...control,
      [changeProp]: (value: unknown, detail?: unknown) => pick(fromControl(field, value, isValidElement(detail) ? undefined : detail)),
      ...(Shell ? undefined : config.labels?.(f)),
      ...(typeof adapter === 'string' ? { [adapter]: options } : adapter?.(f, options)),
    });
    const rootProps: ControlRootProps = {
      ...root,
      onPointerDown: pointerDown,
      onKeyDownCapture: keyDownCapture,
      onKeyDown: keyDown,
      onKeyUp: keyUp,
      onClick: click,
    };
    return Shell ? (
      <Shell kind={kind} field={field} f={f} rootProps={rootProps}>
        {element}
      </Shell>
    ) : (
      <div {...rootProps}>{element}</div>
    );
  };
}

export function mapControls<const Controls extends ControlMap>(
  config: MapControlsConfig<Checked<Controls>>,
): { [Type in MappedTypes<Controls>]: MappedControl } {
  return mapControlTypes(config.controls as ControlMap, (entry, input) => mapped(entry, input, config)) as {
    [Type in MappedTypes<Controls>]: MappedControl;
  };
}
