import type { BuilderQuestion } from '@formhaus/builder';

const exempt = new Set(['section', 'hidden', 'group']);

export const takesRequired = (field: BuilderQuestion) => !exempt.has(field.type);
