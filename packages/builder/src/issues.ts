import { hasOptions, isPage, isQuestion, type BuilderForm } from './model';

export type IssueSeverity = 'error' | 'warning';

export interface Issue {
  uid: string;
  severity: IssueSeverity;
  message: string;
}

const reserved = (key: string) => key in Object.prototype || key === 'prototype';

function duplicates<T>(items: T[], name: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const value = name(item);
    if (seen.has(value)) return true;
    seen.add(value);
    return false;
  });
}

export function findIssues(form: BuilderForm): Issue[] {
  const issues: Issue[] = [];
  const questions = form.blocks.filter(isQuestion);
  for (const item of duplicates(questions, (question) => question.key)) {
    issues.push({ uid: item.uid, severity: 'error', message: `Response key "${item.key}" is used by another field.` });
  }
  for (const item of questions) {
    if (!item.key.trim()) issues.push({ uid: item.uid, severity: 'error', message: 'Response key is empty.' });
    else if (reserved(item.key)) issues.push({ uid: item.uid, severity: 'error', message: `Response key "${item.key}" is reserved.` });
    if (!item.label.trim()) issues.push({ uid: item.uid, severity: 'warning', message: 'This field has no label.' });
    if (!hasOptions(item.type)) continue;
    for (const option of duplicates(item.options, (entry) => entry.value)) {
      issues.push({ uid: option.uid, severity: 'error', message: `Option value "${option.value}" is used twice.` });
    }
  }
  const pages = form.blocks.filter(isPage);
  for (const page of duplicates(pages, (entry) => entry.id)) {
    issues.push({ uid: page.uid, severity: 'error', message: `Step id "${page.id}" is used by another step.` });
  }
  form.blocks.forEach((block, index) => {
    if (isPage(block) && !isQuestion(form.blocks[index + 1])) issues.push({ uid: block.uid, severity: 'error', message: 'This step has no fields.' });
  });
  return issues;
}
