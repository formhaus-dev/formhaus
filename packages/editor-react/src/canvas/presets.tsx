import type { FieldPreset, Placement } from '@formhaus/builder';
import { ChartNoAxesColumn, Mail, MessageSquare, Phone, User, type LucideIcon } from 'lucide-react';
import type { CommandItem } from '../ui';
import { TYPE_GROUPS, typeItem } from '../fieldTypes';
import type { EditorActions } from '../useEditorActions';

const TRACKING = 'preset:tracking';

const presets: Record<string, { label: string; hint: string; icon: LucideIcon; preset: FieldPreset }> = {
  'preset:name': { label: 'Name', hint: 'Short text for a name', icon: User, preset: { label: 'Name', type: 'text', key: 'name' } },
  email: {
    label: 'Email',
    hint: 'Required email address',
    icon: Mail,
    preset: { label: 'Email', type: 'email', required: true, key: 'email' },
  },
  phone: { label: 'Phone', hint: 'Phone number', icon: Phone, preset: { label: 'Phone', type: 'phone', key: 'phone' } },
  'preset:message': {
    label: 'Message',
    hint: 'Long text for a message',
    icon: MessageSquare,
    preset: { label: 'Message', type: 'textarea', key: 'message' },
  },
};

const tracking: CommandItem = {
  id: TRACKING,
  label: 'Tracking fields',
  hint: 'Hidden UTM parameters and referrer',
  icon: <ChartNoAxesColumn aria-hidden />,
  keywords: 'utm campaign referrer analytics hidden',
  group: 'Other',
};

function presetItem(id: string, group: string): CommandItem {
  if (id === TRACKING) return tracking;
  const entry = presets[id];
  if (!entry) return typeItem(id, group);
  const Icon = entry.icon;
  return {
    id,
    label: entry.label,
    hint: entry.hint,
    icon: <Icon aria-hidden />,
    keywords: entry.preset.type ?? '',
    group,
  };
}

export const addItems: CommandItem[] = [...TYPE_GROUPS, ['Layout', ['section', 'group']] as [string, string[]]].flatMap(
  ([group, members]) => {
    const ids = group === 'Contact' ? ['preset:name', ...members, 'preset:message'] : group === 'Other' ? [...members, TRACKING] : members;
    return ids.map((id) => presetItem(id, group));
  },
);

export function presetFor(id: string): FieldPreset {
  return presets[id]?.preset ?? { type: id };
}

export function addPicked(actions: EditorActions, at: Placement, id: string): { uid: string; target: 'card' | 'label' } | undefined {
  if (id === TRACKING) {
    const uid = actions.addTracking(at);
    return uid ? { uid, target: 'card' } : undefined;
  }
  const preset = presetFor(id);
  const uid = actions.addField(at, preset);
  return uid ? { uid, target: preset.label ? 'card' : 'label' } : undefined;
}
