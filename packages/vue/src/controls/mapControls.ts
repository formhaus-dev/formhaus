import type { FieldType, FormField } from '@formhaus/core';
import type { ScaleAnchor } from '@formhaus/core/fields';
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
  type LooseProps,
  type MapControlsOptions,
  type MappedTypes,
  mapControlTypes,
  warnDoubleLabel,
} from '@formhaus/core/controls';
import { type FieldProps, fieldComponentEmits, fieldComponentProps, useFieldProps } from '@formhaus/vue';
import { type Component, defineComponent, h, onBeforeUnmount, onMounted, type PropType, ref, type VNodeChild } from 'vue';

export interface ControlRootProps extends ControlRoot {
  onPointerdown: () => void;
  onKeydownCapture: (event: ControlKeyEvent) => void;
  onKeydown: (event: ControlKeyEvent) => void;
  onKeyup: (event: ControlKeyEvent) => void;
  onClick: (event: ControlClickEvent) => void;
}

const required = <T>(type: PropType<T>) => ({ type, required: true as const });

export const controlShellProps = {
  kind: /* @__PURE__ */ required(String as PropType<ControlKind>),
  field: /* @__PURE__ */ required(Object as PropType<FormField>),
  f: /* @__PURE__ */ required(Object as PropType<FieldProps>),
  rootProps: /* @__PURE__ */ required(Object as PropType<ControlRootProps>),
  anchors: /* @__PURE__ */ required(Array as PropType<(ScaleAnchor | undefined)[]>),
};

type PropsOf<C> = C extends abstract new (
  ...args: never
) => { $props: infer Props }
  ? Props
  : C extends (props: infer Props, ...rest: never) => unknown
    ? Props
    : Record<string, unknown>;

type Slot = VNodeChild | (() => VNodeChild);

export type ControlAdapter<C extends Component> =
  | (keyof PropsOf<C> & string)
  | ((f: FieldProps, options: ControlOption[]) => LooseProps<PropsOf<C>> & { children?: Slot });

export type ControlEntry<C extends Component = Component> = C | readonly [C, ControlAdapter<C> | null, (keyof PropsOf<C> & string)?];

type Checked<Controls> = {
  [Type in keyof Controls]: Controls[Type] extends readonly [infer C extends Component, unknown, ...unknown[]]
    ? readonly [C, ControlAdapter<C> | null, (keyof PropsOf<C> & string)?]
    : Controls[Type];
};

export type ControlMap = { [Type in FieldType | 'input']?: ControlEntryOf<Component, FieldProps> };

export type MapControlsConfig<Controls = ControlMap> = MapControlsOptions<Component, FieldProps, Component, Controls>;

function mapped(entry: ControlEntryOf<Component, FieldProps>, input: boolean, config: MapControlsConfig): Component {
  const [Control, adapter, changeProp = 'onUpdate:modelValue'] = (Array.isArray(entry) ? entry : [entry]) as unknown as [
    Component,
    ControlAdapter<Component>?,
    string?,
  ];
  return defineComponent({
    name: 'MappedControl',
    props: fieldComponentProps,
    emits: fieldComponentEmits,
    setup(props, { emit }) {
      const f = useFieldProps(props, emit);
      const text = ref('');
      const { pick, stop, pointerDown, keyDownCapture, keyDown, keyUp, click } = choiceControl(
        () => ({ field: props.field, value: props.modelValue, options: f.options, disabled: f.disabled }),
        f.change,
        f.commit,
      );
      onBeforeUnmount(stop);
      onMounted(() => {
        try {
          if (process.env.NODE_ENV !== 'production') warnDoubleLabel(document, f.id);
        } catch {}
      });
      return () => {
        if (props.matrix && config.matrix)
          return h(config.matrix, {
            ...props,
            'onUpdate:modelValue': f.change,
            onCommit: (value: unknown) => emit('commit', value),
            onBlur: f.blur,
            onFocus: f.focus,
          });
        const { field } = props;
        const kind = controlKind(field.type, config.kinds);
        const Shell = controlShell(config.shell, kind);
        const { control, root, anchors, save } = controlProps(field, f, {
          kind,
          shell: !!Shell,
          input,
          attrs: f.input,
          valueKey: 'modelValue',
          text: config.freeText ? text.value : undefined,
          setText: (typed) => {
            text.value = typed;
          },
        });
        const options = controlOptions(field, f.options);
        const { children, ...adapted } = (typeof adapter === 'string' ? { [adapter]: options } : (adapter?.(f, options) ?? {})) as {
          children?: Slot;
        };
        const element = h(
          Control,
          {
            ...control,
            [changeProp]: (value: unknown) => pick(save(value)),
            ...(Shell ? undefined : config.labels?.(f)),
            ...adapted,
          },
          children === undefined ? undefined : { default: typeof children === 'function' ? children : () => children },
        );
        const rootProps: ControlRootProps = {
          ...root,
          onPointerdown: pointerDown,
          onKeydownCapture: keyDownCapture,
          onKeydown: keyDown,
          onKeyup: keyUp,
          onClick: click,
        };
        return Shell ? h(Shell, { kind, field, f, rootProps, anchors }, { default: () => element }) : h('div', rootProps, [element]);
      };
    },
  });
}

export function mapControls<const Controls extends ControlMap>(
  config: MapControlsConfig<Checked<Controls>>,
): { [Type in MappedTypes<Controls>]: Component } {
  return mapControlTypes(config.controls as ControlMap, (entry, input) => mapped(entry, input, config)) as {
    [Type in MappedTypes<Controls>]: Component;
  };
}
