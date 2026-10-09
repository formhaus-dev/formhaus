import type { Binding } from '../config';

export async function componentForBinding(binding: Binding): Promise<ComponentNode | null> {
  const node = await findNode(binding);
  if (node?.type === 'COMPONENT') return node;
  if (node?.type === 'COMPONENT_SET') return (node.defaultVariant as ComponentNode | null) ?? null;
  return null;
}

async function findNode(binding: Binding): Promise<BaseNode | null> {
  if (binding.source === 'local' && binding.id) {
    const local = await figma.getNodeByIdAsync(binding.id);
    if (local) return local;
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
  if (binding?.variant && component.parent?.type === 'COMPONENT_SET') {
    try {
      instance.setProperties(binding.variant);
    } catch {
      return instance;
    }
  }
  return instance;
}
