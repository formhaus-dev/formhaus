import { findIssues, isQuestion, serialize, type BuilderForm } from '@formhaus/builder';
import type { ServerProblem } from '../host';

export interface PublishProblem {
  uid: string | null;
  message: string;
  severity: 'error' | 'warning';
}

export function localProblems(form: BuilderForm): PublishProblem[] {
  const problems: PublishProblem[] = findIssues(form).map(({ uid, message, severity }) => ({ uid, message, severity }));
  if (!form.blocks.some(isQuestion)) problems.push({ uid: null, message: 'Add at least one field.', severity: 'error' });
  if (!form.title.trim()) problems.push({ uid: null, message: 'The form has no title.', severity: 'warning' });
  return problems;
}

export function serverProblems(form: BuilderForm, problems: ServerProblem[]): PublishProblem[] {
  const { paths } = serialize(form);
  return problems.map(({ path, message }) => {
    const parts = path.replace(/^definition\.?/, '').split('.');
    let uid: string | null = null;
    for (let end = parts.length; end > 0 && !uid; end--) uid = paths.get(parts.slice(0, end).join('.')) ?? null;
    return { uid, message: path && !uid ? `${path}: ${message}` : message, severity: 'error' };
  });
}
