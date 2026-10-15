import { isPage, isQuestion, pageTitle, type BuilderForm, type BuilderOption, type BuilderPage, type BuilderQuestion } from './model';
import { renameReferences, type Renames } from './references';

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

function syncOptions(question: BuilderQuestion, renames: Renames): void {
  const taken = new Set(question.options.filter((option) => option.valueLocked).map((option) => option.value));
  const changed = new Map<string, string>();
  question.options.forEach((option: BuilderOption, index) => {
    if (option.valueLocked) return;
    const next = claim(option.value, optionBase(option.label, index), taken, '-');
    if (option.value && next !== option.value) changed.set(option.value, next);
    option.value = next;
  });
  if (changed.size) renames.values.set(question.key, changed);
}

export function syncIdentifiers(form: BuilderForm): void {
  const renames: Renames = { keys: new Map(), values: new Map(), steps: new Map() };
  const questions = form.blocks.filter(isQuestion);
  const keys = new Set(questions.filter((item) => item.keyLocked).map((item) => item.key));
  for (const question of questions) {
    if (!question.keyLocked) {
      const next = claim(question.key, keyBase(question.label), keys, '');
      if (question.key && next !== question.key) renames.keys.set(question.key, next);
      question.key = next;
    }
    syncOptions(question, renames);
  }
  const pages = form.blocks.filter(isPage);
  const offset = isPage(form.blocks[0]) ? 0 : 1;
  const ids = new Set(pages.filter((page) => page.idLocked).map((page) => page.id));
  pages.forEach((page, index) => {
    if (page.idLocked) return;
    const next = claim(page.id, stepBase(page, index + offset), ids, '-');
    if (page.id && next !== page.id) renames.steps.set(page.id, next);
    page.id = next;
  });
  renameReferences(form, renames);
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
