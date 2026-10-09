import type { FormField } from '@formhaus/core';
import type { Binding, PluginConfig } from '../config';
import type { KitTheme } from '../kits/kit';
import { STATE_PROPERTY, solid, stack, text } from '../kits/primitives';
import { loadKit } from '../kits/registry';
import { isOptionRole, roleForField, type Role } from '../roles';
import { applySlots } from '../text-slots';
import { asComponent, componentForBinding, instantiate, setVariant } from './resolve';
import { labelText, type FormRenderer } from './types';

interface Resolved {
  component: ComponentNode;
  binding?: Binding;
}

export async function createKitRenderer(config: PluginConfig): Promise<FormRenderer> {
  const { theme, components } = await loadKit(config.kit);
  const cache = new Map<Role, Resolved>();

  async function resolve(role: Role): Promise<Resolved> {
    const cached = cache.get(role);
    if (cached) return cached;
    const binding = config.bindings[role];
    const bound = binding ? await componentForBinding(binding) : null;
    const resolved = bound ? { component: bound, binding } : { component: asComponent(components.get(role)!) };
    cache.set(role, resolved);
    return resolved;
  }

  async function instance(role: Role, values: Parameters<typeof applySlots>[1], state?: string): Promise<InstanceNode> {
    const { component, binding } = await resolve(role);
    const node = instantiate(component, binding);
    if (state) setVariant(node, STATE_PROPERTY, state);
    await applySlots(node, values, binding);
    return node;
  }

  return {
    theme,
    async field(field) {
      const role = roleForField(field);
      if (isOptionRole(role)) return optionGroup(field, role, theme, instance);
      const filled = field.defaultValue !== undefined && field.defaultValue !== '';
      const node = await instance(role, {
        label: labelText(field),
        value: filled ? String(field.defaultValue) : field.placeholder || ' ',
        helper: field.helperText ?? '',
      }, filled ? 'Filled' : 'Empty');
      node.name = field.key;
      return node;
    },
    async button(label, primary) {
      const node = await instance(primary ? 'button.primary' : 'button.secondary', { label });
      node.name = label;
      return node;
    },
  };
}

async function optionGroup(
  field: FormField,
  role: Role,
  theme: KitTheme,
  instance: (role: Role, values: { label: string }) => Promise<InstanceNode>,
): Promise<FrameNode> {
  const group = stack('VERTICAL', field.key, { itemSpacing: 8 });
  group.appendChild(text(labelText(field), { font: theme.fonts.medium, size: theme.captionSize + 2, color: theme.muted }, 'Label'));
  const list = stack('VERTICAL', 'Options', { itemSpacing: theme.optionGroup.gap });
  if (theme.optionGroup.fill) {
    list.fills = solid(theme.optionGroup.fill);
    list.cornerRadius = theme.optionGroup.radius ?? 0;
    list.clipsContent = true;
  }
  group.appendChild(list);
  list.layoutSizingHorizontal = 'FILL';
  for (const option of field.options ?? []) {
    const row = await instance(role, { label: option.label });
    row.name = option.value;
    list.appendChild(row);
    row.layoutSizingHorizontal = 'FILL';
  }
  const last = list.children[list.children.length - 1];
  const separator = last && 'findOne' in last ? last.findOne((node) => node.name === 'Separator') : null;
  if (separator) separator.visible = false;
  return group;
}
