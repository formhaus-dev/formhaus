import { QUESTION_TYPES, typeLabel as builderTypeLabel } from '@formhaus/builder';
import type { FieldType } from '@formhaus/core';
import {
  AlignLeft,
  Calendar,
  CalendarClock,
  ChevronsUpDown,
  CircleDot,
  Clock,
  EyeOff,
  Hash,
  ListChecks,
  Mail,
  Phone,
  SquareCheck,
  ToggleRight,
  Type,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { CommandItem } from './ui';

interface TypeInfo {
  type: string;
  label: string;
  hint: string;
}

const types: TypeInfo[] = [
  ...QUESTION_TYPES,
  { type: 'datetime', label: 'Date and time', hint: 'Date with a time of day' },
  { type: 'time', label: 'Time', hint: 'A time of day' },
  { type: 'switch', label: 'Switch', hint: 'An on or off toggle' },
  { type: 'hidden', label: 'Hidden value', hint: 'Sent with the answers, never shown' },
];

const icons: Record<string, LucideIcon> = {
  text: Type,
  textarea: AlignLeft,
  email: Mail,
  number: Hash,
  phone: Phone,
  date: Calendar,
  datetime: CalendarClock,
  time: Clock,
  radio: CircleDot,
  multiselect: ListChecks,
  select: ChevronsUpDown,
  checkbox: SquareCheck,
  switch: ToggleRight,
  hidden: EyeOff,
};

export const TYPE_GROUPS: [string, string[]][] = [
  ['Text', ['text', 'textarea']],
  ['Choice', ['radio', 'multiselect', 'select']],
  ['Contact', ['email', 'phone']],
  ['Date & number', ['number', 'date', 'datetime', 'time']],
  ['Other', ['checkbox', 'switch', 'hidden']],
];

export function typeIcon(type: FieldType): ReactNode {
  const Icon = icons[type] ?? Type;
  return <Icon aria-hidden />;
}

export const typeLabel = (type: FieldType) => types.find((item) => item.type === type)?.label ?? builderTypeLabel(type);

export function typeItem(type: string, group: string): CommandItem {
  const info = types.find((item) => item.type === type);
  return { id: type, label: info?.label ?? type, hint: info?.hint ?? '', icon: typeIcon(type), keywords: type, group };
}

export const paletteItems: CommandItem[] = TYPE_GROUPS.flatMap(([group, members]) => members.map((type) => typeItem(type, group)));
