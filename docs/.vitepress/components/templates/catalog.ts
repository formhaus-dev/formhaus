import type { FormDefinition } from '@formhaus/core';
import { appUrl } from '../editor/launch';

export interface TemplateEntry {
  slug: string;
  title: string;
  summary: string;
  category: string;
  steps: number;
  fields: number;
}

export interface TemplatePage extends TemplateEntry {
  definition: FormDefinition;
}

export const categories = [
  { id: 'lead-gen', label: 'Lead generation' },
  { id: 'intake', label: 'Intake' },
  { id: 'application', label: 'Applications' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'survey', label: 'Surveys' },
  { id: 'registration', label: 'Registration' },
  { id: 'quiz', label: 'Quizzes' },
  { id: 'operations', label: 'Operations' },
];

export const categoryLabel = (id: string) => categories.find((category) => category.id === id)?.label ?? id;

export const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

export const counts = ({ steps, fields }: TemplateEntry) => `${plural(steps, 'step')} · ${plural(fields, 'field')}`;

export const cloudUrl = (slug: string) => `${appUrl}/forms/new?template=${encodeURIComponent(slug)}`;
