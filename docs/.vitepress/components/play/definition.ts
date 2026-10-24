import { checkDefinition, type DefinitionIssue } from '@formhaus/core';
import { computed, ref, shallowRef } from 'vue';
import type { Editor } from './editor';
import { issueMarks, issueText, type JsonError, syntaxError } from './play-share';

export type Issue = Pick<DefinitionIssue, 'path' | 'message' | 'severity'>;

export interface Source {
  id: string;
  load: () => Promise<unknown>;
}

export function useDefinition(editor: () => Editor | null, onValid: () => void, list: Source[]) {
  const presetId = ref(list[0]!.id);
  const text = ref('');
  const parseError = ref<JsonError | null>(null);
  const issues = ref<Issue[]>([]);
  const definition = shallowRef<object | null>(null);
  const loading = ref(true);
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

  async function applyPreset(id: string, source?: string) {
    const preset = list.find((entry) => entry.id === id) ?? list[0]!;
    presetId.value = preset.id;
    loading.value = true;
    const loaded = await preset.load().catch(() => null);
    loading.value = false;
    if (!loaded && preset !== list[0]) return applyPreset(list[0]!.id, source);
    presetText = `${JSON.stringify(loaded, null, 2)}\n`;
    text.value = source ?? presetText;
    editor()?.setDoc(text.value);
    validate();
  }

  const shared = () => ({ id: presetId.value, text: text.value === presetText ? undefined : text.value });

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
    loading,
    errors,
    status,
    statusKind,
    listed,
    formTitle,
    validate,
    applyPreset,
    shared,
    jump,
  };
}
