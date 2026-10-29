import type { FieldType, FormField } from '@formhaus/core';
import type { ScaleAnchor } from '@formhaus/core/fields';
import {
  choiceControl,
  type ControlClickEvent,
  type ControlContext,
  type ControlEntryOf,
  type ControlKeyEvent,
  type ControlKind,
  type ControlOption as CoreControlOption,
  type ControlRoot,
  type ControlSpecKey,
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
import { controlEntry } from '@formhaus/core/internal';
import { type FieldProps, fieldComponentEmits, fieldComponentProps, useFieldProps } from '@formhaus/vue';
import { type Component, defineComponent, h, onBeforeUnmount, onMounted, type PropType, type VNode, type VNodeChild } from 'vue';

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

export type ControlOption = CoreControlOption<VNode>;

type PropName<C> = keyof PropsOf<C> & string;

type ControlProps<C extends Component> = (
  f: FieldProps,
  options: ControlOption[],
  context: ControlContext,
) => LooseProps<PropsOf<C>> & { children?: Slot };

export type ControlAdapter<C extends Component> = PropName<C> | ControlProps<C>;

export interface ControlSpec<C extends Component = Component> {
  component: C;
  props?: ControlProps<C>;
  optionsProp?: PropName<C>;
  changeProp?: PropName<C>;
}

export type ControlEntry<C extends Component = Component> = C | readonly [C, ControlAdapter<C> | null, PropName<C>?] | ControlSpec<C>;

type Checked<Controls> = {
  [Type in keyof Controls]: Controls[Type] extends readonly [infer C extends Component, unknown, ...unknown[]]
    ? readonly [C, ControlAdapter<C> | null, PropName<C>?]
    : [ControlSpecKey<Controls[Type]>] extends [never]
      ? Controls[Type]
      : Controls[Type][ControlSpecKey<Controls[Type]>] extends infer C extends Component
        ? ControlSpec<C>
        : never;
};

export type ControlMap = { [Type in FieldType | 'input']?: ControlEntryOf<Component, FieldProps, ControlOption> };

export type MapControlsConfig<Controls = ControlMap> = MapControlsOptions<Component, FieldProps, Component, Controls>;

function mapped(entry: ControlEntryOf<Component, FieldProps, ControlOption>, input: boolean, config: MapControlsConfig): Component {
  const { component, changeProp, props: adapt } = controlEntry(entry, 'onUpdate:modelValue');
  const Control = component as Component;
  return defineComponent({
    name: 'MappedControl',
    props: fieldComponentProps,
    emits: fieldComponentEmits,
    setup(props, { emit }) {
      const f = useFieldProps(props, emit);
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
        const { control, root, anchors, save, freeText } = controlProps(field, f, {
          kind,
          shell: !!Shell,
          input,
          attrs: f.input,
          valueKey: 'modelValue',
          freeText: config.freeText ? f.freeText : undefined,
        });
        const options = controlOptions(field, f.options, props.reveals);
        const { children, ...adapted } = adapt(f, options, { kind, field, anchors }) as { children?: Slot };
        const element = h(
          Control,
          {
            ...control,
            [changeProp]: (value: unknown) => {
              const next = save(value);
              if (!freeText) pick(next);
            },
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
  return mapControlTypes(config.controls as ControlMap, (entry, input) => mapped(entry, input, config), config.conditionalReveal) as {
    [Type in MappedTypes<Controls>]: Component;
  };
}
