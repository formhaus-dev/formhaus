import { isPage, isQuestion, pageTitle, type BuilderForm, type BuilderOption, type BuilderPage, type BuilderQuestion } from './model';
import { bindReferences, resolver } from './references';

export function words(label: string): string[] {
  return label
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);
}

export function unique(base: string, taken: Set<string>, join = ''): string {
  let value = base;
  for (let index = 2; taken.has(value); index++) value = `${base}${join}${index}`;
  taken.add(value);
  return value;
}

export function keyBase(label: string): string {
  const base =
    words(label)
      .map((word, index) => (index ? word[0].toUpperCase() + word.slice(1) : word))
      .join('') || 'question';
  return /^\d/.test(base) ? `q${base}` : base;
}

export const slugBase = (label: string, fallback: string) => words(label).join('-') || fallback;
export const keyFromLabel = (label: string, taken: Set<string>) => unique(keyBase(label), taken);
export const optionBase = (label: string, position: number) => slugBase(label, `option-${position + 1}`);
export const stepBase = (page: BuilderPage | undefined, position: number) => slugBase(pageTitle(page, position), `step-${position + 1}`);

export function follows(value: string, base: string, join = ''): boolean {
  if (value === base) return true;
  if (!value.startsWith(base + join)) return false;
  const rest = value.slice(base.length + join.length);
  return /^[1-9]\d*$/.test(rest) && Number(rest) >= 2;
}

function claim(current: string, base: string, taken: Set<string>, join: string): string {
  if (current && follows(current, base, join) && !taken.has(current)) {
    taken.add(current);
    return current;
  }
  return unique(base, taken, join);
}

function syncOptions(question: BuilderQuestion): void {
  const taken = new Set(question.options.filter((option) => option.valueLocked).map((option) => option.value));
  question.options.forEach((option: BuilderOption, index) => {
    if (!option.valueLocked) option.value = claim(option.value, optionBase(option.label, index), taken, '-');
  });
}

function syncKeys(form: BuilderForm, questions: BuilderQuestion[]): void {
  const { scope } = resolver(form);
  const all = new Set<string>();
  const scopes = new Map<string | undefined, Set<string>>();
  const keysOf = (group: string | undefined) => scopes.get(group) ?? scopes.set(group, new Set()).get(group)!;
  const take = (question: BuilderQuestion) => {
    all.add(question.key);
    keysOf(scope(question)).add(question.key);
  };
  questions.filter((item) => item.keyLocked).forEach(take);
  for (const question of questions) {
    if (question.keyLocked) continue;
    const group = scope(question);
    const taken = group === undefined ? all : new Set([...keysOf(undefined), ...keysOf(group)]);
    question.key = claim(question.key, keyBase(question.label), taken, '');
    take(question);
  }
}

export function syncIdentifiers(form: BuilderForm): void {
  const restore = bindReferences(form);
  const questions = form.blocks.filter(isQuestion);
  syncKeys(form, questions);
  for (const question of questions) syncOptions(question);
  const pages = form.blocks.filter(isPage);
  const offset = isPage(form.blocks[0]) ? 0 : 1;
  const ids = new Set(pages.filter((page) => page.idLocked).map((page) => page.id));
  pages.forEach((page, index) => {
    if (!page.idLocked) page.id = claim(page.id, stepBase(page, index + offset), ids, '-');
  });
  restore();
}

export function lockIdentifiers(form: BuilderForm): void {
  for (const block of form.blocks) {
    if (isPage(block)) block.idLocked = true;
    else {
      block.keyLocked = true;
      for (const option of block.options) option.valueLocked = true;
    }
  }
}
