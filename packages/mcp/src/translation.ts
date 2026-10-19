import type { FieldI18n, FormDefinition, FormI18n, GroupI18n, LabelI18n, StepI18n, ValidationI18n } from '@formhaus/core';
import {
  defaultLabels,
  defaultMessages,
  localize,
  textSlots,
  translationIssues,
  translationTemplate,
  type Overlay,
  type TextSlot,
} from '@formhaus/core/i18n';
import { parseDefinition } from './definition-input';
import { inspectDefinition, type ValidationReport } from './validate';

export interface TemplateInput {
  definition: unknown;
  lang: string;
  prefix?: string | false;
}

export type TemplateResult =
  | { ok: false; validation: ValidationReport }
  | { ok: true; validation: ValidationReport; lang: string; file: string; overlay: Overlay; slots: TextSlot[] };

export function translationTemplateTool({ definition: input, lang, prefix }: TemplateInput): TemplateResult {
  const { report, definition } = inspectDefinition(input);
  if (!definition) return { ok: false, validation: report };
  return {
    ok: true,
    validation: report,
    lang,
    file: `${definition.id}.${lang}.json`,
    overlay: translationTemplate(definition),
    slots: textSlots(definition, { prefix }),
  };
}

export function withOverlay(input: unknown, overlay: unknown): { definition: unknown; issues: string[] } {
  const parsed = parseDefinition(input);
  if (!overlay || !parsed.ok) return { definition: input, issues: [] };
  const definition = parsed.value as unknown as FormDefinition;
  try {
    const { unknown, invalid, placeholderMismatch } = translationIssues(definition, overlay);
    const issues = [
      ...unknown.map((address) => `unknown address ${address} was ignored`),
      ...invalid.map((address) => `${address || 'overlay'} is not text and was ignored`),
      ...placeholderMismatch.map((address) => `${address} has different {placeholders} than the source`),
    ];
    return { definition: localize(definition, { overlay: overlay as Overlay }).definition, issues };
  } catch (error) {
    return { definition: input, issues: [`overlay was not applied: ${error instanceof Error ? error.message : String(error)}`] };
  }
}

const slots = {
  form: ['title', 'description', 'messages', 'labels'] satisfies (keyof FormI18n)[],
  step: ['title', 'description'] satisfies (keyof StepI18n)[],
  section: ['title', 'description'] satisfies (keyof StepI18n)[],
  group: ['label', 'helperText', 'itemLabel', 'addLabel', 'removeLabel'] satisfies (keyof GroupI18n)[],
  field: ['label', 'placeholder', 'helperText'] satisfies (keyof FieldI18n)[],
  option: ['label'] satisfies (keyof LabelI18n)[],
  action: ['label'] satisfies (keyof LabelI18n)[],
  validation: ['required', 'minLength', 'maxLength', 'min', 'max', 'pattern', 'matchField'] satisfies (keyof ValidationI18n)[],
};

export const i18nCapabilities = {
  lang: 'Optional BCP 47 tag of the definition texts, such as "ru". Renderers set it as the lang attribute of the form.',
  messages: {
    defaults: defaultMessages,
    rule: 'Optional "messages" catalog of validation templates by key. {min} and {max} are replaced. minItems and maxItems apply to multiselect values. A field message (required: "text", minLengthMessage, ...) wins over the catalog.',
  },
  labels: {
    defaults: defaultLabels,
    rule: 'Optional "labels" catalog for renderer texts. stepOf takes {current} and {total}. addItem and removeItem are the group button defaults, itemLabel takes {label} and {index}, itemAdded, itemRemoved and removeItemPrompt take {item}, removeItemNamed is the accessible name of a Remove button with {label} and {item}, removeItemBody takes {item} and is the text of the remove dialog, cancel closes it. enlargeImage takes {label} and names the button that opens an option image, close closes that preview. skip and submit are the button defaults, stepTitle takes {index} and names a step without a title, stepErrors takes {count} and marks a step with errors in the step progress. or is the divider before exclusive multiselect options. clear, done, chooseFile and required are for native renderers: the clear button of a field, the confirm button of a date or time picker, the file picker button, and the word assistive technology announces for a required field. Explicit next, back, skip and submit labels and group texts win.',
  },
  keys: {
    slots,
    rule: 'An "i18n" object next to the texts maps each text to a translation key of the app, such as { "label": "signup.email.label" }. The literal text stays as the fallback and is required. Put keys exactly as given; never invent them.',
  },
  overlay: {
    addresses: [
      'title',
      'description',
      'submit.label',
      'cancel.label',
      'messages.<key>',
      'labels.<key>',
      'fields.<key>.label | placeholder | helperText',
      'fields.<key>.options.<value>',
      'fields.<key>.validation.<rule>',
      'steps.<id>.title | description',
      'steps.<id>.next.label | back.label | skip.label',
      'steps.<id>.fields.<key>...',
      'sections.<key>.title | description',
      'steps.<id>.sections.<key>.title | description',
      'fields.<group>.label | helperText | itemLabel | addLabel | removeLabel',
      'fields.<group>.fields.<key>...',
    ],
    rule: 'A translation is a separate JSON file, such as signup.ru.json, with string leaves nested by these addresses. Missing or empty strings fall back to the source. Keep nesting, identifiers and {placeholders}. Get a skeleton from translation_template.',
  },
};
