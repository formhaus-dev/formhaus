import type { DefinitionIssue, DefinitionIssueCode } from '../definition-validation/issues';
import { getAllFields } from '../engine/engine-utils';
import type { FormDefinition } from '../types';
import { isGroup } from '../visibility/nodes';

const NODE_COMPONENTS = ['section', 'group', 'groupItem', 'confirmDialog'];

interface RendererComponents {
  components?: Record<string, unknown>;
  actionsComponent?: unknown;
  progressComponent?: unknown;
}

export function warnMissingComponents(
  definition: FormDefinition,
  { components = {}, actionsComponent, progressComponent }: RendererComponents,
  warned: Set<string>,
  onWarning?: (issue: DefinitionIssue) => void,
): void {
  const warn = (name: string, code: DefinitionIssueCode, problem: string, hint: string) => {
    if (warned.has(name)) return;
    warned.add(name);
    const message = `${problem} ${hint}`;
    if (onWarning) onWarning({ code, severity: 'warning', path: '', message, hint });
    else console.warn(`[formhaus] ${message}`);
  };
  const registered = Object.keys(components).filter((key) => components[key] && !NODE_COMPONENTS.includes(key));
  for (const { type } of getAllFields(definition).flatMap((field) => (isGroup(field) ? field.fields : [field]))) {
    if (registered.includes(type)) continue;
    warn(
      type,
      'missing-component',
      `No component is registered for the field type "${type}", so it renders a placeholder. Registered types: ${registered.join(', ') || 'none'}.`,
      `Add a component for "${type}" to components.`,
    );
  }
  const legacy: [string, string, unknown][] = [
    ...NODE_COMPONENTS.map((key): [string, string, unknown] => [`components.${key}`, key, components[key]]),
    ['actionsComponent', 'actions', actionsComponent],
    ['progressComponent', 'progress', progressComponent],
  ];
  for (const [name, slot, component] of legacy) {
    if (component)
      warn(name, 'legacy-layout', `${name} is replaced by layout.${slot} and is removed in 2.0.`, `Pass it as layout.${slot}.`);
  }
}
