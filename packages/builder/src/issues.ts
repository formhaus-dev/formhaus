import { recallEnabled, recallKeys } from '@formhaus/core/internal';
import { hasOptions, isPage, isQuestion, type BuilderForm } from './model';
import { conditionsOf, resolver } from './references';

export type IssueSeverity = 'error' | 'warning';

export interface Issue {
  uid: string;
  severity: IssueSeverity;
  message: string;
}

const reserved = (key: string) => key in Object.prototype || key === 'prototype';

const recalled = (texts: (string | undefined)[]) => texts.flatMap((text) => recallKeys(text ?? ''));

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
  const { scope, target } = resolver(form);
  const outer = new Set(questions.filter((item) => scope(item) === undefined).map((item) => item.key));
  const clashes = new Set([
    ...duplicates(questions, (question) => `${scope(question) ?? ''}:${question.key}`),
    ...questions.filter((question) => scope(question) !== undefined && outer.has(question.key)),
  ]);
  for (const item of questions.filter((question) => clashes.has(question))) {
    issues.push({ uid: item.uid, severity: 'error', message: `Response key "${item.key}" is used by another field.` });
  }
  for (const item of questions) {
    if (!item.key.trim()) issues.push({ uid: item.uid, severity: 'error', message: 'Response key is empty.' });
    else if (reserved(item.key)) issues.push({ uid: item.uid, severity: 'error', message: `Response key "${item.key}" is reserved.` });
    if (item.type !== 'hidden' && !item.label.trim())
      issues.push({ uid: item.uid, severity: 'warning', message: 'This field has no label.' });
    if (!hasOptions(item.type)) continue;
    for (const option of duplicates(item.options, (entry) => entry.value)) {
      issues.push({ uid: option.uid, severity: 'error', message: `Option value "${option.value}" is used twice.` });
    }
  }
  const pages = form.blocks.filter(isPage);
  for (const page of duplicates(pages, (entry) => entry.id)) {
    issues.push({ uid: page.uid, severity: 'error', message: `Step id "${page.id}" is used by another step.` });
  }
  let page = 0;
  const pageOf = new Map(form.blocks.map((block) => [block, isPage(block) ? ++page : page]));
  form.blocks.forEach((block, index) => {
    const texts = isPage(block) ? [block.title, block.extra.description] : [block.label, block.extra.helperText, block.extra.placeholder];
    for (const key of recallEnabled(form.extra) ? recalled(texts) : []) {
      const found = target(key, scope(block));
      if (!found) issues.push({ uid: block.uid, severity: 'warning', message: `Recalls "{{${key}}}", which is not a field.` });
      else if (found === block || pageOf.get(found)! > pageOf.get(block)!)
        issues.push({ uid: block.uid, severity: 'warning', message: `Recalls "{{${key}}}", which is not answered yet.` });
    }
    if (isPage(block) && !isQuestion(form.blocks[index + 1]) && !block.title.trim() && !block.extra.description?.trim())
      issues.push({ uid: block.uid, severity: 'warning', message: 'This step has no fields or text.' });
    for (const condition of conditionsOf(block.extra)) {
      const found = target(condition.field, scope(block));
      const at = found && form.blocks.indexOf(found);
      if (at === undefined)
        issues.push({
          uid: block.uid,
          severity: 'error',
          message: `The "Shown when" condition uses "${condition.field}", which is not a field.`,
        });
      else if (at >= index)
        issues.push({
          uid: block.uid,
          severity: 'warning',
          message: `The "Shown when" condition uses "${condition.field}", which comes later.`,
        });
    }
  });
  return issues;
}
