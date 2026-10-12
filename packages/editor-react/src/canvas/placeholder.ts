import type { BuilderQuestion } from '@formhaus/builder';

const placeholders = new Set(['text', 'email', 'phone', 'number', 'textarea', 'select']);

export const takesPlaceholder = (field: BuilderQuestion) => placeholders.has(field.type);
