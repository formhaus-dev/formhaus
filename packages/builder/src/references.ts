import type { ShowCondition } from '@formhaus/core';
import { isPage, isQuestion, type BuilderBlock, type BuilderForm, type BuilderQuestion } from './model';

export function scopeOf(form: BuilderForm, block: BuilderBlock | undefined): string | undefined {
  const parent = isQuestion(block) && block.parent ? form.blocks.find((item) => item.uid === block.parent) : undefined;
  if (!isQuestion(parent)) return undefined;
  return parent.type === 'group' ? parent.uid : scopeOf(form, parent);
}

export interface Resolver {
  scope: (block: BuilderBlock) => string | undefined;
  target: (key: string, scope?: string) => BuilderQuestion | undefined;
}

export function resolver(form: BuilderForm): Resolver {
  const questions = form.blocks.filter(isQuestion);
  const scopes = new Map(questions.map((item) => [item.uid, scopeOf(form, item)]));
  const find = (key: string, scope: string | undefined) => questions.find((item) => item.key === key && scopes.get(item.uid) === scope);
  return {
    scope: (block) => scopes.get(block.uid),
    target: (key, scope) => (scope !== undefined ? find(key, scope) : undefined) ?? find(key, undefined),
  };
}

const conditionsOf = (holder: { show?: ShowCondition[]; showAny?: ShowCondition[] }) => [...(holder.show ?? []), ...(holder.showAny ?? [])];

export function bindReferences(
  form: BuilderForm,
  blocks: BuilderBlock[] = form.blocks,
  retarget: (question: BuilderQuestion) => BuilderQuestion = (question) => question,
): () => void {
  const { scope, target } = resolver(form);
  const writes: (() => void)[] = [];
  const field = (key: string, at: string | undefined, write: (key: string) => void) => {
    const found = target(key, at);
    const bound = found && retarget(found);
    if (bound) writes.push(() => write(bound.key));
    return bound;
  };
  const value = (question: BuilderQuestion, current: unknown, write: (value: string) => void) => {
    const option = question.options.find((item) => item.value === current);
    if (option) writes.push(() => write(option.value));
  };
  const condition = (item: ShowCondition, at: string | undefined) => {
    const question = field(item.field, at, (key) => (item.field = key));
    if (!question) return;
    if (item.eq !== undefined) value(question, item.eq, (next) => (item.eq = next));
    if (item.neq !== undefined) value(question, item.neq, (next) => (item.neq = next));
    for (const prop of ['in', 'notIn'] as const) {
      const list = item[prop];
      list?.forEach((entry, index) => {
        value(question, entry, (next) => (list[index] = next));
      });
    }
  };
  const steps = form.blocks.filter(isPage);
  for (const block of blocks) {
    const at = scope(block);
    for (const item of conditionsOf(block.extra)) condition(item, at);
    if (isPage(block)) {
      for (const route of block.routes ?? []) {
        const step = route.to === null ? undefined : steps.find((page) => page.id === route.to);
        if (step) writes.push(() => (route.to = step.id));
        for (const item of conditionsOf(route)) condition(item, undefined);
      }
      continue;
    }
    const validation = block.extra.validation;
    if (validation?.matchField) field(validation.matchField, at, (key) => (validation.matchField = key));
    const depends = block.extra.optionsDependsOn;
    depends?.forEach((key, index) => {
      field(key, undefined, (next) => (depends[index] = next));
    });
  }
  return () => {
    for (const write of writes) write();
  };
}

function prune(target: { show?: ShowCondition[]; showAny?: ShowCondition[] }, keep: (condition: ShowCondition) => boolean): void {
  for (const prop of ['show', 'showAny'] as const) {
    const list = target[prop]?.filter(keep);
    if (list?.length) target[prop] = list;
    else delete target[prop];
  }
}

export function dropReferences(form: BuilderForm, gone: Set<string>, blocks: BuilderBlock[] = form.blocks): void {
  if (!gone.size) return;
  const { scope, target } = resolver(form);
  const lost = (key: string, at: string | undefined) => gone.has(target(key, at)?.uid ?? '');
  for (const block of blocks) {
    const at = scope(block);
    prune(block.extra, (condition) => !lost(condition.field, at));
    if (isPage(block)) {
      if (block.routes) block.routes = block.routes.filter((route) => !conditionsOf(route).some((item) => lost(item.field, undefined)));
      continue;
    }
    const validation = block.extra.validation;
    if (validation?.matchField && lost(validation.matchField, at)) delete validation.matchField;
  }
}

export function referencesTo(form: BuilderForm, uid: string): string[] {
  const { scope, target } = resolver(form);
  const hits = (list: ShowCondition[], at: string | undefined) => list.some((condition) => target(condition.field, at)?.uid === uid);
  return form.blocks
    .filter(
      (block) =>
        hits(conditionsOf(block.extra), scope(block)) ||
        (isPage(block) && (block.routes ?? []).some((route) => hits(conditionsOf(route), undefined))),
    )
    .map((block) => block.uid);
}
