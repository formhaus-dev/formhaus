import type { FormField } from '@formhaus/core';
import type { Binding, PluginConfig } from '../config';
import type { KitTheme } from '../kits/kit';
import { STATE_PROPERTY, solid, stack, text } from '../kits/primitives';
import { loadKit } from '../kits/registry';
import { isOptionRole, ROLE_FALLBACKS, ROLE_LABELS, roleForField, type Role } from '../roles';
import { applySlots } from '../text-slots';
import { customTheme, textButtonStyle } from './custom-theme';
import { textButton } from './text-button';
import { asComponent, componentForBinding, instantiate, setVariant } from './resolve';
import { labelText, type FormRenderer } from './types';

interface Resolved {
  component: ComponentNode;
  binding?: Binding;
}

export interface KitRenderer extends FormRenderer {
  sample(role: Role): Promise<SceneNode>;
}

export async function createKitRenderer(config: PluginConfig): Promise<KitRenderer> {
  const { theme: kitTheme, components } = await loadKit(config.kit);
  const cache = new Map<Role, Resolved | null>();

  async function bound(role: Role): Promise<Resolved | null> {
    if (!cache.has(role)) {
      const binding = config.bindings[role];
      const component = binding ? await componentForBinding(binding) : null;
      cache.set(role, component ? { component, binding } : null);
    }
    return cache.get(role)!;
  }

  async function resolve(role: Role): Promise<Resolved> {
    for (const candidate of [role, ...(ROLE_FALLBACKS[role] ?? [])]) {
      const found = await bound(candidate);
      if (found) return found;
    }
    return { component: asComponent(components.get(role)!) };
  }

  const resolved = await Promise.all((Object.keys(config.bindings) as Role[]).map(bound));
  const custom = resolved.some(Boolean);
  const theme = custom ? await customTheme(kitTheme, (await bound('field.text'))?.component) : kitTheme;

  async function instance(role: Role, values: Parameters<typeof applySlots>[1], state?: string): Promise<InstanceNode> {
    const { component, binding } = await resolve(role);
    const node = instantiate(component, binding);
    if (state) setVariant(node, STATE_PROPERTY, state);
    await applySlots(node, values, binding);
    return node;
  }

  async function synthesized(label: string): Promise<SceneNode | null> {
    const primary = custom && !(await bound('button.text')) ? await bound('button.primary') : null;
    if (!primary) return null;
    const fallback = { font: theme.fonts.medium, size: theme.bodySize, color: theme.text };
    return textButton(label, await textButtonStyle(primary.component, fallback), primary.component);
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
    async sample(role) {
      const node = (role === 'button.text' && await synthesized(ROLE_LABELS[role])) || await instance(role, { label: ROLE_LABELS[role], value: ' ', helper: '' }, 'Empty');
      node.name = ROLE_LABELS[role];
      return node;
    },
    async button(label, kind) {
      const node = (kind === 'text' && await synthesized(label)) || await instance(`button.${kind}`, { label });
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
  const labelStyle = theme.groupLabel ?? { font: theme.fonts.medium, size: theme.captionSize + 2, color: theme.muted };
  group.appendChild(text(labelText(field), labelStyle, 'Label'));
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
