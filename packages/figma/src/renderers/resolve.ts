import type { Binding } from '../config';

export async function componentForBinding(binding: Binding): Promise<ComponentNode | null> {
  const node = await findNode(binding);
  return node?.type === 'COMPONENT' || node?.type === 'COMPONENT_SET' ? asComponent(node) : null;
}

async function findNode(binding: Binding): Promise<BaseNode | null> {
  if (binding.source === 'local' && binding.id) {
    const local = await figma.getNodeByIdAsync(binding.id);
    if (local && !local.removed && local.parent) return local;
  }
  if (!binding.key) return null;
  try {
    return await figma.importComponentByKeyAsync(binding.key);
  } catch {
    return null;
  }
}

export function asComponent(node: ComponentNode | ComponentSetNode): ComponentNode {
  return node.type === 'COMPONENT_SET' ? (node.defaultVariant as ComponentNode) : node;
}

export function propertyOwner(component: ComponentNode): ComponentNode | ComponentSetNode {
  return component.parent?.type === 'COMPONENT_SET' ? component.parent : component;
}

export function missingProperties(component: ComponentNode, binding: Binding): string[] {
  const defined = Object.keys(propertyOwner(component).componentPropertyDefinitions);
  return Object.keys(binding.properties ?? {}).filter((key) => !defined.includes(key));
}

export function setVariant(instance: InstanceNode, property: string, value: string): void {
  if (instance.componentProperties[property]?.type !== 'VARIANT') return;
  try {
    instance.setProperties({ [property]: value });
  } catch {
    return;
  }
}

export function instantiate(component: ComponentNode, binding?: Binding): InstanceNode {
  const instance = component.createInstance();
  for (const [key, value] of Object.entries(binding?.properties ?? {})) {
    try {
      instance.setProperties({ [key]: value });
    } catch {
      continue;
    }
  }
  return instance;
}
