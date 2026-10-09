import type { Binding } from '../config';
import { asComponent } from '../renderers/resolve';

export interface SelectedComponent {
  component: ComponentNode;
  binding: Binding;
}

const SELECT_HINT = 'Select a component or an instance on the canvas.';

export async function componentFromSelection(selection: readonly SceneNode[]): Promise<SelectedComponent> {
  const node = selection[0];
  if (node?.type === 'INSTANCE') {
    const main = await node.getMainComponentAsync();
    if (!main) throw new Error('This instance has no main component.');
    return { component: main, binding: { ...reference(main), properties: instanceProperties(node) } };
  }
  if (node?.type === 'COMPONENT' || node?.type === 'COMPONENT_SET') {
    const component = asComponent(node);
    return { component, binding: reference(component) };
  }
  throw new Error(SELECT_HINT);
}

export function reference(component: ComponentNode): Binding {
  const set = component.parent?.type === 'COMPONENT_SET' ? component.parent : null;
  const name = set ? `${set.name} / ${component.name}` : component.name;
  if (component.remote) return { source: 'library', key: component.key, name };
  return { source: 'local', id: component.id, key: component.key, name };
}

function instanceProperties(instance: InstanceNode): Binding['properties'] {
  const entries = Object.entries(instance.componentProperties)
    .filter(([, property]) => property.type === 'BOOLEAN' || property.type === 'VARIANT')
    .map(([key, property]) => [key, property.value]);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}
