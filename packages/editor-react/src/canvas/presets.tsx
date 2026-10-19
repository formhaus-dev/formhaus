import type { FieldPreset, Placement } from '@formhaus/builder';
import {
  ChartNoAxesColumn,
  DoorOpen,
  Grid3x3,
  Images,
  Mail,
  MessageSquare,
  Phone,
  Smile,
  TextQuote,
  User,
  type LucideIcon,
} from 'lucide-react';
import type { CommandItem } from '../ui';
import { TYPE_GROUPS, typeItem } from '../fieldTypes';
import type { EditorActions } from '../useEditorActions';

const TRACKING = 'preset:tracking';
const PICTURE = 'preset:picture';

const NPS: FieldPreset = {
  label: 'How likely are you to recommend us to a friend or colleague?',
  type: 'scale',
  key: 'nps',
  extra: {
    autoAdvance: true,
    validation: { min: 0, max: 10 },
    options: [
      { value: '0', label: 'Not at all likely' },
      { value: '10', label: 'Extremely likely' },
    ],
  },
};

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
  'preset:nps': { label: 'NPS', hint: 'Scale from 0 to 10 with labels', icon: Smile, preset: NPS },
  [PICTURE]: { label: 'Picture choice', hint: 'Options with images', icon: Images, preset: { type: 'radio' } },
};

const actionItems: Record<string, Omit<CommandItem, 'id' | 'group'> & { run: (actions: EditorActions, at: Placement) => Added }> = {
  'preset:matrix': {
    label: 'Matrix',
    hint: 'Rows that share the same columns',
    icon: <Grid3x3 aria-hidden />,
    keywords: 'likert grid table section',
    run: (actions, at) => ({ uid: actions.addMatrix(at), target: 'label' }),
  },
  'preset:statement': {
    label: 'Statement',
    hint: 'A title and text without a question',
    icon: <TextQuote aria-hidden />,
    keywords: 'text heading section intro',
    run: (actions, at) => ({ uid: actions.addStatement(at), target: 'label' }),
  },
  'preset:welcome': {
    label: 'Welcome screen',
    hint: 'A first step with a title and a Start button',
    icon: <DoorOpen aria-hidden />,
    keywords: 'intro start statement step',
    run: (actions) => ({ uid: actions.addWelcome(), target: 'title' }),
  },
};

type Added = { uid: string | undefined; target: 'card' | 'label' | 'title' };

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
  const action = actionItems[id];
  if (action) {
    const { run: _run, ...item } = action;
    return { id, group, ...item };
  }
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

const EXTRA: Record<string, [string[], string[]]> = {
  Contact: [['preset:name'], ['preset:message']],
  Choice: [[], [PICTURE]],
  'Rating & scale': [[], ['preset:nps']],
  Other: [[], [TRACKING]],
  Layout: [[], ['preset:matrix', 'preset:statement', 'preset:welcome']],
};

export const addItems: CommandItem[] = [...TYPE_GROUPS, ['Layout', ['section', 'group']] as [string, string[]]].flatMap(
  ([group, members]) => {
    const [before, after] = EXTRA[group] ?? [[], []];
    return [...before, ...members, ...after].map((id) => presetItem(id, group));
  },
);

export function presetFor(id: string): FieldPreset {
  return presets[id]?.preset ?? { type: id };
}

export function addPicked(actions: EditorActions, at: Placement, id: string): { uid: string; target: Added['target'] } | undefined {
  if (id === TRACKING) {
    const uid = actions.addTracking(at);
    return uid ? { uid, target: 'card' } : undefined;
  }
  const action = actionItems[id];
  if (action) {
    const { uid, target } = action.run(actions, at);
    return uid ? { uid, target } : undefined;
  }
  const preset = presetFor(id);
  const uid = actions.addField(at, preset);
  if (uid && id === PICTURE) actions.showPictures(uid);
  return uid ? { uid, target: preset.label ? 'card' : 'label' } : undefined;
}
