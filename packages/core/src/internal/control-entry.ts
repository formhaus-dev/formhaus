import type { ControlContext, ControlEntryOf, ControlSpecOf } from '../controls/types';

export interface ControlPlan<Component, View, Option> {
  component: Component;
  changeProp: string;
  props: (f: View, options: Option[], context: ControlContext) => Record<string, unknown>;
}

const isSpec = <Component, View, Option>(entry: unknown): entry is ControlSpecOf<Component, View, Option> =>
  typeof entry === 'object' && entry !== null && 'component' in entry;

export function controlEntry<Component, View, Option>(
  entry: ControlEntryOf<Component, View, Option>,
  defaultChange: string,
): ControlPlan<Component, View, Option> {
  const tuple = Array.isArray(entry) ? (entry as unknown[]) : null;
  const spec: ControlSpecOf<Component, View, Option> = tuple
    ? {
        component: tuple[0] as Component,
        [typeof tuple[1] === 'string' ? 'optionsProp' : 'props']: tuple[1] ?? undefined,
        changeProp: tuple[2] as string | undefined,
      }
    : isSpec<Component, View, Option>(entry)
      ? entry
      : { component: entry as Component };
  const { component, props, optionsProp, changeProp = defaultChange } = spec;
  return {
    component,
    changeProp,
    props: (f, options, context) => ({ ...(optionsProp ? { [optionsProp]: options } : undefined), ...props?.(f, options, context) }),
  };
}
