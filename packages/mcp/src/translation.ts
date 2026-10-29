import type { FieldI18n, FormDefinition, FormI18n, GroupI18n, LabelI18n, StepI18n, ValidationI18n } from '@formhaus/core';
import {
  checkCatalog,
  defaultLabels,
  defaultMessages,
  localize,
  translation,
  textSlots,
  translationIssues,
  translationTemplate,
  type CatalogIssues,
  type Overlay,
  type TextSlot,
  type TranslationFile,
} from '@formhaus/core/i18n';
import { parseDefinition } from './definition-input';
import { inspectDefinition, type ValidationReport } from './validate';

export interface TemplateInput {
  definition: unknown;
  lang: string;
  prefix?: string | false;
  catalog?: unknown;
}

export type TemplateResult =
  | { ok: false; validation: ValidationReport }
  | {
      ok: true;
      validation: ValidationReport;
      lang: string;
      file: string;
      overlay: Overlay;
      slots: TextSlot[];
      catalog?: CatalogIssues;
    };

function withoutCatalog(definition: FormDefinition, overlay: Overlay, slots: TextSlot[], issues: CatalogIssues) {
  const covered = (address: string) => {
    const [part, key, ...rest] = address.split('.');
    return (
      (part === 'messages' || part === 'labels') &&
      !rest.length &&
      definition[part]?.[key as never] === undefined &&
      !issues.missing.some((missing) => missing === address || missing.startsWith(`${address}.`))
    );
  };
  for (const part of ['messages', 'labels'] as const) {
    const texts = overlay[part];
    if (typeof texts !== 'object') continue;
    for (const key of Object.keys(texts)) if (covered(`${part}.${key}`)) delete texts[key];
    if (!Object.keys(texts).length) delete overlay[part];
  }
  return slots.filter(({ address }) => !covered(address));
}

export function translationTemplateTool({ definition: input, lang, prefix, catalog }: TemplateInput): TemplateResult {
  const { report, definition } = inspectDefinition(input);
  if (!definition) return { ok: false, validation: report };
  const overlay: Overlay = { locale: lang, ...translationTemplate(definition) };
  const slots = textSlots(definition, { prefix });
  const file = `${definition.id}.${lang}.json`;
  if (catalog === undefined) return { ok: true, validation: report, lang, file, overlay, slots };
  const issues = checkCatalog(catalog);
  return { ok: true, validation: report, lang, file, overlay, slots: withoutCatalog(definition, overlay, slots, issues), catalog: issues };
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
    return {
      definition: localize(definition, translation({ locale: definition.lang ?? 'en', ...(overlay as Overlay) } as TranslationFile))
        .definition,
      issues,
    };
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
    rule: 'Optional "messages" catalog of validation templates by key. {min} and {max} are replaced. minItems and maxItems apply to multiselect values, and exclusive takes {option}, the label of an exclusive option. A field message (required: "text", minLengthMessage, ...) wins over the catalog.',
  },
  labels: {
    defaults: defaultLabels,
    rule: 'Optional "labels" catalog for renderer texts. stepOf takes {current} and {total}. addItem and removeItem are the group button defaults, itemLabel takes {label} and {index}, itemAdded, itemRemoved and removeItemPrompt take {item}, removeItemNamed is the accessible name of a Remove button with {label} and {item}, removeItemBody takes {item} and is the text of the remove dialog, cancel closes it. enlargeImage takes {label} and names the button that opens an option image, close closes that preview. skip and submit are the button defaults, stepTitle takes {index} and names a step without a title, stepErrors takes {count} and marks a step with errors in the step progress. fileCount takes {count} and is the number of files of a file list for native screen readers. or is the divider before exclusive multiselect options. select is the prompt of an empty select for native renderers. required is the word assistive technology announces for a required field; web renderers add it to the legend of a required option group. clear, done and chooseFile are for native renderers: the clear button of a field, the confirm button of a date or time picker, and the file picker button. Explicit next, back, skip and submit labels and group texts win.',
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
    rule: 'A translation is a separate JSON file, such as signup.ru.json, with string leaves nested by these addresses. Missing or empty strings fall back to the source. In a multi-step form, fields.<key> also works at the top level and steps.<id>.fields.<key> wins. Keep nesting, identifiers and {placeholders}. Get a skeleton from translation_template.',
  },
};
