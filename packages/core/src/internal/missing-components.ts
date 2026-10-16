import type { DefinitionIssue } from '../definition-validation/issues';
import { getAllFields } from '../engine/engine-utils';
import type { FormDefinition } from '../types';
import { isGroup } from '../visibility/nodes';

const NODE_COMPONENTS = ['section', 'group', 'groupItem', 'confirmDialog'];

export function warnMissingComponents(
  definition: FormDefinition,
  components: object | undefined,
  warned: Set<string>,
  onWarning?: (issue: DefinitionIssue) => void,
): void {
  const registered = Object.entries(components ?? {})
    .filter(([key, component]) => component && !NODE_COMPONENTS.includes(key))
    .map(([key]) => key);
  for (const { type } of getAllFields(definition).flatMap((field) => (isGroup(field) ? field.fields : [field]))) {
    if (registered.includes(type) || warned.has(type)) continue;
    warned.add(type);
    const hint = `Add a component for "${type}" to components.`;
    const message = `No component is registered for the field type "${type}", so it renders a placeholder. Registered types: ${registered.join(', ') || 'none'}. ${hint}`;
    const issue: DefinitionIssue = { code: 'missing-component', severity: 'warning', path: '', message, hint };
    if (onWarning) onWarning(issue);
    else console.warn(`[formhaus] ${message}`);
  }
}
