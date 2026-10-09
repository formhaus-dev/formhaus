import type { FieldType, FormDefinition, FormField, FormStep, StepRoute } from '@formhaus/core';

export const QUESTION_TYPES = [
  { type: 'text', label: 'Short text', hint: 'One line of text', icon: 'type', placeholder: 'Question' },
  { type: 'textarea', label: 'Long text', hint: 'A paragraph', icon: 'align-left', placeholder: 'Tell us more about…' },
  { type: 'email', label: 'Email', hint: 'Validated email address', icon: 'mail', placeholder: "What's your email?" },
  { type: 'number', label: 'Number', hint: 'Digits only', icon: 'hash', placeholder: 'How many…?' },
  { type: 'phone', label: 'Phone', hint: 'Phone number', icon: 'phone', placeholder: "What's your phone number?" },
  { type: 'date', label: 'Date', hint: 'Date picker', icon: 'calendar', placeholder: 'When…?' },
  { type: 'radio', label: 'Multiple choice', hint: 'Pick one, answers can branch', icon: 'circle-dot', placeholder: 'Which one…?' },
  { type: 'multiselect', label: 'Checkboxes', hint: 'Pick all that apply', icon: 'check-square', placeholder: 'Which of these…?' },
  { type: 'select', label: 'Dropdown', hint: 'Pick one from a list', icon: 'chevron-down', placeholder: 'Choose a…' },
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number]['type'];
export type IconName = (typeof QUESTION_TYPES)[number]['icon'] | 'file' | 'split' | 'x' | 'plus' | 'trash' | 'asterisk' | 'arrow-up' | 'arrow-down';
export interface MenuItem { id: string; label: string; hint?: string; icon?: IconName; checked?: boolean; danger?: boolean }
export const TYPE_ITEMS: MenuItem[] = QUESTION_TYPES.map(({ type, label, hint, icon }) => ({ id: type, label, hint, icon }));
export const PAGE_ITEM: MenuItem = { id: 'page', label: 'New page', hint: 'Start a new step here', icon: 'file' };

export interface BuilderOption { uid: string; label: string; jump: string | null; value?: string }
export interface BuilderQuestion {
  kind: 'question';
  uid: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: BuilderOption[];
  extra: Partial<FormField>;
  key?: string;
}
export interface BuilderPage {
  kind: 'page';
  uid: string;
  title: string;
  next: string | null;
  nextLabel: string;
  backLabel: string;
  id?: string;
  extra: Partial<FormStep>;
  routes?: StepRoute[];
}
export const DEFAULT_NEXT = 'Continue';
export const DEFAULT_BACK = 'Back';
export type BuilderBlock = BuilderQuestion | BuilderPage;
export interface BuilderForm { id: string; title: string; submit: string; blocks: BuilderBlock[] }
export interface Group { page?: BuilderPage; questions: BuilderQuestion[] }

let counter = 0;
export const uid = () => `b${(counter += 1)}`;
export const hasOptions = (type: FieldType) => type === 'radio' || type === 'multiselect' || type === 'select';
export const canBranch = (type: FieldType) => type === 'radio' || type === 'select';
export const placeholderFor = (type: FieldType) => QUESTION_TYPES.find((item) => item.type === type)?.placeholder ?? 'Question';
export const typeLabel = (type: FieldType) => QUESTION_TYPES.find((item) => item.type === type)?.label ?? type.charAt(0).toUpperCase() + type.slice(1);
export const newPage = (title = ''): BuilderPage => ({ kind: 'page', uid: uid(), title, next: null, nextLabel: '', backLabel: '', extra: {} });
export const newOption = (label = ''): BuilderOption => ({ uid: uid(), label, jump: null });
export const pageTitle = (page: BuilderPage | undefined, position: number) => page?.title.trim() || `Page ${position + 1}`;

export function newQuestion(type: QuestionType = 'text'): BuilderQuestion {
  const question: BuilderQuestion = { kind: 'question', uid: uid(), label: '', type, required: false, options: [], extra: {} };
  setType(question, type);
  return question;
}

export function setType(question: BuilderQuestion, type: QuestionType): void {
  question.type = type;
  if (hasOptions(type) && !question.options.length) question.options.push(newOption(), newOption());
}

export function groups(form: BuilderForm): Group[] {
  const result: Group[] = [];
  for (const block of form.blocks) {
    if (block.kind === 'page') result.push({ page: block, questions: [] });
    else (result[result.length - 1] ?? (result[0] = { questions: [] })).questions.push(block);
  }
  return result;
}

export interface PageRef { uid: string; title: string }

export function pagesAfter(form: BuilderForm): PageRef[][] {
  const offset = form.blocks[0]?.kind === 'page' ? 0 : 1;
  const result: PageRef[][] = [];
  let tail: PageRef[] = [];
  let position = form.blocks.filter((block) => block.kind === 'page').length + offset;
  for (let index = form.blocks.length - 1; index >= 0; index--) {
    result[index] = tail;
    const block = form.blocks[index];
    if (block.kind !== 'page') continue;
    position -= 1;
    tail = [{ uid: block.uid, title: pageTitle(block, position) }, ...tail];
  }
  return result;
}

export function words(label: string): string[] {
  return label.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '').replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
}

export function unique(base: string, taken: Set<string>, join = ''): string {
  let value = base;
  for (let index = 2; taken.has(value); index++) value = `${base}${join}${index}`;
  taken.add(value);
  return value;
}

export function keyFromLabel(label: string, taken: Set<string>): string {
  const base = words(label).map((word, index) => (index ? word[0].toUpperCase() + word.slice(1) : word)).join('') || 'question';
  return unique(/^\d/.test(base) ? `q${base}` : base, taken);
}

const slug = (label: string, taken: Set<string>, fallback: string) => unique(words(label).join('-') || fallback, taken, '-');

function field(item: BuilderQuestion, keys: Set<string>, values: Map<string, string>): FormField {
  const { validation, ...extra } = item.extra;
  const rules = { ...(item.required ? { required: true } : {}), ...validation };
  const key = item.key ? unique(item.key, keys) : keyFromLabel(item.label, keys);
  const result: FormField = { key, type: item.type, label: item.label.trim() || 'Untitled question', ...extra };
  if (Object.keys(rules).length) result.validation = rules;
  if (hasOptions(item.type)) {
    const taken = new Set<string>();
    result.options = item.options.map((option, index) => {
      const label = option.label.trim() || `Option ${index + 1}`;
      const value = option.value ? unique(option.value, taken, '-') : slug(label, taken, `option-${index + 1}`);
      values.set(option.uid, value);
      return { value, label };
    });
  }
  return result;
}

export function toDefinition(form: BuilderForm): FormDefinition {
  const keys = new Set<string>();
  const values = new Map<string, string>();
  const parts = groups(form);
  const head = { $schema: 'https://formhaus.dev/schema/form-definition.json', id: form.id, title: form.title.trim() || 'Untitled form', submit: { label: form.submit.trim() || 'Submit' } };
  if (parts.length < 2) return { ...head, fields: (parts[0]?.questions ?? []).map((item) => field(item, keys, values)) } as FormDefinition;
  const taken = new Set<string>();
  const ids = parts.map((part, index) => (part.page?.id ? unique(part.page.id, taken, '-') : slug(pageTitle(part.page, index), taken, `page-${index + 1}`)));
  const fields = parts.map((part) => part.questions.map((item) => field(item, keys, values)));
  const routes: StepRoute[][] = parts.map(() => []);
  parts.forEach((part, index) => {
    const indexOf = (uid: string | null) => parts.findIndex((other, at) => at > index && other.page?.uid === uid);
    const branching = part.questions.filter((item) => canBranch(item.type) && item.options.some((option) => indexOf(option.jump) >= 0));
    for (const item of branching) {
      const key = fields[index][part.questions.indexOf(item)].key;
      for (const option of item.options) {
        const target = indexOf(option.jump);
        if (target >= 0) routes[index].push({ to: ids[target], show: [{ field: key, eq: values.get(option.uid)! }] });
      }
    }
    const covered = branching.length === 1 && branching[0].options.every((option) => indexOf(option.jump) >= 0);
    const next = indexOf(part.page?.next ?? null);
    if (covered) delete routes[index][routes[index].length - 1].show;
    else if (next >= 0) routes[index].push({ to: ids[next] });
    else if (routes[index].length && index + 1 < parts.length) routes[index].push({ to: ids[index + 1] });
  });
  const steps = parts.map((part, index): FormStep => {
    const next = part.page?.nextLabel.trim();
    const back = part.page?.backLabel.trim();
    const step: FormStep = {
      id: ids[index],
      title: pageTitle(part.page, index),
      ...part.page?.extra,
      ...(next && next !== DEFAULT_NEXT ? { next: { label: next } } : {}),
      ...(back && back !== DEFAULT_BACK ? { back: { label: back } } : {}),
      fields: fields[index],
    };
    const own = part.page?.routes ?? routes[index];
    if (own.length) step.routes = own;
    return step;
  });
  return { ...head, steps } as FormDefinition;
}
