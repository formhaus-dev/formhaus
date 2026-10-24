import { checkDefinition, type DefinitionIssue } from '@formhaus/core';
import { computed, ref, shallowRef } from 'vue';
import type { JsonEditor } from './json-editor';
import { issueMarks, issueText, type JsonError, syntaxError } from './play-share';
import { presets } from './play-state';

export type Issue = Pick<DefinitionIssue, 'path' | 'message' | 'severity'>;

const templatePrefix = 'template:';

export function useDefinition(editor: () => JsonEditor | null, onValid: () => void) {
  const presetId = ref(presets[0]!.id);
  const text = ref('');
  const parseError = ref<JsonError | null>(null);
  const issues = ref<Issue[]>([]);
  const definition = shallowRef<object | null>(null);
  const template = shallowRef<(typeof presets)[number] | null>(null);
  const sources = computed(() => (template.value ? [...presets, template.value] : presets));
  let presetText = '';

  const errors = computed(() => (parseError.value ? 1 : issues.value.filter((issue) => issue.severity === 'error').length));
  const warnings = computed(() => issues.value.filter((issue) => issue.severity === 'warning').length);
  const status = computed(() => {
    if (parseError.value) return `JSON error on line ${parseError.value.line}`;
    const counts = [
      errors.value && `${errors.value} ${errors.value === 1 ? 'error' : 'errors'}`,
      warnings.value && `${warnings.value} ${warnings.value === 1 ? 'warning' : 'warnings'}`,
    ].filter(Boolean);
    return counts.length ? counts.join(', ') : 'Valid';
  });
  const statusKind = computed(() => (errors.value ? 'error' : warnings.value ? 'warning' : 'ok'));
  const listed = computed<Issue[]>(() =>
    parseError.value ? [{ path: '', message: parseError.value.message, severity: 'error' }] : issues.value,
  );
  const formTitle = computed(() => {
    const value = definition.value as { title?: unknown } | null;
    return typeof value?.title === 'string' ? value.title : 'Formhaus form';
  });

  function validate() {
    const source = text.value;
    let value: unknown;
    try {
      value = JSON.parse(source);
    } catch (error) {
      parseError.value = syntaxError(source, error);
      issues.value = [];
      const { from, message } = parseError.value;
      editor()?.setMarks([{ from, to: from + 1, message: issueText(message), severity: 'error' }]);
      return;
    }
    parseError.value = null;
    issues.value = checkDefinition(value);
    editor()?.setMarks(issueMarks(source, issues.value));
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      definition.value = value;
      onValid();
    }
  }

  async function loadTemplate(slug: string | undefined) {
    template.value = null;
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) return;
    try {
      const response = await fetch(`/templates/${slug}.json`);
      const entry = (await response.json()) as { title?: unknown; definition?: object };
      const { definition: loaded } = entry;
      if (!loaded) return;
      const title = typeof entry.title === 'string' ? entry.title : slug;
      template.value = { id: `${templatePrefix}${slug}`, label: title, load: async () => loaded };
    } catch {
      template.value = null;
    }
  }

  async function applyPreset(id: string, source?: string) {
    const preset = sources.value.find((entry) => entry.id === id) ?? presets[0]!;
    presetId.value = preset.id;
    presetText = `${JSON.stringify(await preset.load(), null, 2)}\n`;
    text.value = source ?? presetText;
    editor()?.setDoc(text.value);
    validate();
  }

  function shared() {
    const slug = presetId.value.startsWith(templatePrefix) ? presetId.value.slice(templatePrefix.length) : undefined;
    return { preset: slug ? undefined : presetId.value, template: slug, text: text.value === presetText ? undefined : text.value };
  }

  function jump(issue: Issue) {
    if (parseError.value) editor()?.select(parseError.value.from, parseError.value.from + 1);
    else {
      const [mark] = issueMarks(text.value, [issue]);
      if (mark) editor()?.select(mark.from, mark.to);
    }
  }

  return {
    presetId,
    text,
    definition,
    template,
    sources,
    errors,
    status,
    statusKind,
    listed,
    formTitle,
    validate,
    loadTemplate,
    applyPreset,
    shared,
    jump,
  };
}
