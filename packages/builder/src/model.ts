import type { FieldOption, FieldType, FormAction, FormDefinition, FormField, FormStep, StepRoute } from '@formhaus/core';

export const QUESTION_TYPES = [
  { type: 'text', label: 'Short text', hint: 'One line of text', icon: 'type', placeholder: 'Question' },
  { type: 'textarea', label: 'Long text', hint: 'A paragraph', icon: 'align-left', placeholder: 'Tell us more about…' },
  { type: 'email', label: 'Email', hint: 'Validated email address', icon: 'mail', placeholder: "What's your email?" },
  { type: 'number', label: 'Number', hint: 'Digits only', icon: 'hash', placeholder: 'How many…?' },
  { type: 'phone', label: 'Phone', hint: 'Phone number', icon: 'phone', placeholder: "What's your phone number?" },
  { type: 'date', label: 'Date', hint: 'Date picker', icon: 'calendar', placeholder: 'When…?' },
  { type: 'radio', label: 'Multiple choice', hint: 'Pick one, answers can branch', icon: 'circle-dot', placeholder: 'Which one…?' },
  { type: 'multiselect', label: 'Checkboxes', hint: 'Pick all that apply', icon: 'check-square', placeholder: 'Which of these…?' },
  { type: 'select', label: 'Select', hint: 'Pick one from a list', icon: 'chevron-down', placeholder: 'Choose a…' },
  { type: 'checkbox', label: 'Checkbox', hint: 'A single yes or no tick', icon: 'square-check', placeholder: 'I agree to…' },
  { type: 'rating', label: 'Rating', hint: 'Stars from one to five', icon: 'star', placeholder: 'How would you rate…?' },
  { type: 'scale', label: 'Opinion scale', hint: 'A number on a scale', icon: 'gauge', placeholder: 'How likely are you to…?' },
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number]['type'];
export type IconName =
  | (typeof QUESTION_TYPES)[number]['icon']
  | 'file'
  | 'split'
  | 'x'
  | 'plus'
  | 'trash'
  | 'asterisk'
  | 'arrow-up'
  | 'arrow-down';
export interface MenuItem {
  id: string;
  label: string;
  hint?: string;
  icon?: IconName;
  checked?: boolean;
  danger?: boolean;
}
export const TYPE_ITEMS: MenuItem[] = QUESTION_TYPES.map(({ type, label, hint, icon }) => ({ id: type, label, hint, icon }));
export const PAGE_ITEM: MenuItem = { id: 'page', label: 'New step', hint: 'Start a new step here', icon: 'file' };

export interface BuilderOption {
  uid: string;
  label: string;
  value: string;
  valueLocked: boolean;
  jump: string | null;
  extra?: Partial<Omit<FieldOption, 'value' | 'label'>>;
  shape?: string[];
}

export interface BuilderQuestion {
  kind: 'question';
  uid: string;
  label: string;
  type: FieldType;
  required: boolean;
  options: BuilderOption[];
  key: string;
  keyLocked: boolean;
  extra: Partial<FormField>;
  parent?: string;
  shape?: { field: string[]; validation?: string[] };
}

export interface BuilderPage {
  kind: 'page';
  uid: string;
  title: string;
  id: string;
  idLocked: boolean;
  next: string | null;
  nextLabel: string;
  backLabel: string;
  extra: Partial<FormStep>;
  routes?: StepRoute[];
  shape?: string[];
}

export type FormExtra = Partial<Omit<FormDefinition, 'id' | 'title' | 'submit' | 'fields' | 'steps'>> & { submit?: Partial<FormAction> };

export type BuilderBlock = BuilderQuestion | BuilderPage;

export interface BuilderForm {
  id: string;
  title: string;
  submit: string;
  blocks: BuilderBlock[];
  extra: FormExtra;
  seq: number;
  shape?: { form: string[]; submit?: string[] };
}

export interface Group {
  page?: BuilderPage;
  questions: BuilderQuestion[];
}

export const DEFAULT_NEXT = 'Continue';
export const DEFAULT_BACK = 'Back';
export const END = 'end';
export const SCHEMA_URL = 'https://formhaus.dev/schema/form-definition.json';

export const uid = (form: { seq: number }) => `b${(form.seq += 1)}`;
export const isPage = (block: BuilderBlock | undefined): block is BuilderPage => block?.kind === 'page';
export const isQuestion = (block: BuilderBlock | undefined): block is BuilderQuestion => block?.kind === 'question';
export const isContainer = (block: BuilderBlock | undefined): block is BuilderQuestion =>
  isQuestion(block) && (block.type === 'section' || block.type === 'group');
export const CONTAINER_LABELS: Record<string, string> = { section: 'Section', group: 'Repeatable group' };
export const hasOptions = (type: FieldType) => type === 'radio' || type === 'multiselect' || type === 'select';
export const isScale = (type: FieldType) => type === 'scale' || type === 'rating';
export const canBranch = (type: FieldType) => type === 'radio' || type === 'select' || isScale(type);
export const canAutoAdvance = (type: FieldType) => type === 'radio' || isScale(type);
export const placeholderFor = (type: FieldType) =>
  QUESTION_TYPES.find((item) => item.type === type)?.placeholder ??
  (type === 'section' ? 'Section title' : type === 'group' ? 'Group name' : 'Question');
export const typeLabel = (type: FieldType) =>
  QUESTION_TYPES.find((item) => item.type === type)?.label ?? CONTAINER_LABELS[type] ?? type.charAt(0).toUpperCase() + type.slice(1);
export const pageTitle = (page: BuilderPage | undefined, position: number) => page?.title.trim() || `Step ${position + 1}`;

export function newPage(form: BuilderForm, title = ''): BuilderPage {
  return { kind: 'page', uid: uid(form), title, id: '', idLocked: false, next: null, nextLabel: '', backLabel: '', extra: {} };
}

export function newOption(form: BuilderForm, label = ''): BuilderOption {
  return { uid: uid(form), label, value: '', valueLocked: false, jump: null };
}

export function newQuestion(form: BuilderForm, type: FieldType = 'text'): BuilderQuestion {
  const question: BuilderQuestion = {
    kind: 'question',
    uid: uid(form),
    label: '',
    type,
    required: false,
    options: [],
    key: '',
    keyLocked: false,
    extra: {},
  };
  setType(form, question, type);
  return question;
}

function dropScale(question: BuilderQuestion, keepRange: boolean): void {
  const { min: _min, max, ...rules } = question.extra.validation ?? {};
  const kept = keepRange && max !== undefined ? { ...rules, max } : rules;
  if (!keepRange) delete question.extra.options;
  if (Object.keys(kept).length) question.extra.validation = kept;
  else delete question.extra.validation;
}

type OptionExtra = NonNullable<BuilderOption['extra']>;

export function setOptionExtra<K extends keyof OptionExtra>(option: BuilderOption, key: K, value: OptionExtra[K] | undefined): void {
  const { [key]: _old, ...rest } = option.extra ?? {};
  option.extra = value === undefined ? rest : { ...rest, [key]: value };
  if (!Object.keys(option.extra).length) delete option.extra;
}

export function dropOrder(question: BuilderQuestion): void {
  delete question.extra.randomize;
  for (const option of question.options) if (option.extra?.pinned !== undefined) setOptionExtra(option, 'pinned', undefined);
}

export function setType(form: BuilderForm, question: BuilderQuestion, type: FieldType): void {
  if (isScale(question.type) && question.type !== type) dropScale(question, isScale(type));
  if (!canAutoAdvance(type)) delete question.extra.autoAdvance;
  if (type !== 'radio' && type !== 'multiselect') delete question.extra.columns;
  if (!hasOptions(type)) dropOrder(question);
  question.type = type;
  if (type === 'hidden') question.required = false;
  else delete question.extra.source;
  if (hasOptions(type) && !question.options.length) question.options.push(newOption(form), newOption(form));
}

export function createForm(id = 'untitled-form', title = ''): BuilderForm {
  return { id, title, submit: 'Submit', blocks: [], extra: { $schema: SCHEMA_URL }, seq: 0 };
}

export function groups(form: BuilderForm): Group[] {
  const result: Group[] = [];
  for (const block of form.blocks) {
    if (block.kind === 'page') result.push({ page: block, questions: [] });
    else (result[result.length - 1] ?? (result[0] = { questions: [] })).questions.push(block);
  }
  return result;
}

export function span(form: BuilderForm, index: number): number {
  const block = form.blocks[index];
  let end = index + 1;
  const owners = new Set([block?.uid]);
  if (isContainer(block)) {
    for (let next = form.blocks[end]; isQuestion(next) && next.parent && owners.has(next.parent); next = form.blocks[++end])
      owners.add(next.uid);
  }
  return end - index;
}

export interface PageRef {
  uid: string;
  title: string;
}

export function pagesAfter(form: BuilderForm): PageRef[][] {
  const offset = form.blocks[0]?.kind === 'page' ? 0 : 1;
  const result: PageRef[][] = [];
  let tail: PageRef[] = [];
  let position = form.blocks.filter(isPage).length + offset;
  for (let index = form.blocks.length - 1; index >= 0; index--) {
    result[index] = tail;
    const block = form.blocks[index];
    if (block.kind !== 'page') continue;
    position -= 1;
    tail = [{ uid: block.uid, title: pageTitle(block, position) }, ...tail];
  }
  return result;
}

export function arrange<T extends object>(value: T, shape: string[] | undefined): T {
  if (!shape) return value;
  const known = shape.filter((key) => key in value);
  const rest = Object.keys(value).filter((key) => !shape.includes(key));
  return Object.fromEntries([...known, ...rest].map((key) => [key, value[key as keyof T]])) as T;
}

export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
