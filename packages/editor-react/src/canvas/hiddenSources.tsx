import type { BuilderQuestion } from '@formhaus/builder';
import type { FieldSource } from '@formhaus/core';
import { Clock, CornerUpLeft, Globe, Heading, Languages, Link2, MapPin, MonitorSmartphone, Pin, type LucideIcon } from 'lucide-react';

export type SourceChoice = 'value' | 'query' | 'referrer' | 'page' | 'pageTitle' | 'language' | 'timezone' | 'device' | 'country';

export interface SourceInfo {
  id: SourceChoice;
  label: string;
  hint: string;
  icon: LucideIcon;
}

const FIXED: SourceInfo = { id: 'value', label: 'Fixed value', hint: 'The same value on every response', icon: Pin };

export const SOURCES: SourceInfo[] = [
  FIXED,
  { id: 'query', label: 'URL parameter', hint: 'A parameter in the form link, like utm_source', icon: Link2 },
  { id: 'referrer', label: 'Referrer', hint: 'The page the visitor came from', icon: CornerUpLeft },
  { id: 'page', label: 'Page URL', hint: 'The form page address, without parameters', icon: Globe },
  { id: 'pageTitle', label: 'Page title', hint: 'The title of the page with the form', icon: Heading },
  { id: 'language', label: 'Language', hint: 'The browser language, like en-US', icon: Languages },
  { id: 'timezone', label: 'Time zone', hint: 'The visitor’s time zone, like Europe/Berlin', icon: Clock },
  { id: 'device', label: 'Device', hint: 'Mobile, tablet or desktop', icon: MonitorSmartphone },
  { id: 'country', label: 'Country', hint: 'Two-letter country code, added by Formhaus Cloud', icon: MapPin },
];

export function sourceChoice(source: FieldSource | undefined): SourceChoice {
  if (source === undefined) return 'value';
  if (typeof source === 'object') return 'query';
  return SOURCES.some((item) => item.id === source) ? source : 'value';
}

export const sourceInfo = (choice: SourceChoice) => SOURCES.find((item) => item.id === choice) ?? FIXED;

export function sourceFor(choice: SourceChoice, field: BuilderQuestion): FieldSource | undefined {
  if (choice === 'value') return undefined;
  if (choice !== 'query') return choice;
  const current = field.extra.source;
  return { query: typeof current === 'object' ? current.query : field.key };
}

export function describeHidden(field: BuilderQuestion): { text: string; empty: boolean } {
  const value = field.extra.defaultValue;
  const fallback = typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : '';
  const choice = sourceChoice(field.extra.source);
  if (choice === 'value') return fallback ? { text: fallback, empty: false } : { text: 'No value', empty: true };
  const source = field.extra.source;
  const from = `From ${typeof source === 'object' ? `URL parameter ${source.query || '(no name)'}` : sourceInfo(choice).label.toLowerCase()}`;
  return { text: fallback ? `${from}, else ${fallback}` : from, empty: false };
}
