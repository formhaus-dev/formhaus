import type { BuilderQuestion } from '@formhaus/builder';

export const questionName = (field: BuilderQuestion) => field.label.trim() || 'Untitled question';
