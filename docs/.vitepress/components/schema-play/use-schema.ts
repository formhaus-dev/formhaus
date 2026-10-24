import type { ValidateContext } from '@formhaus/core';
import { computed, ref, shallowRef } from 'vue';
import type { Editor } from '../play/editor';
import { compile } from './compile';
import { libraries } from './recipes';
import type { Problem } from './runtime/module';
import { createSandbox, type Outcome } from './sandbox';

export interface Run {
  context: ValidateContext;
  outcome?: Outcome;
}

function lineSpan(text: string, line: number) {
  const lines = text.split('\n');
  const from = lines.slice(0, line - 1).reduce((total, entry) => total + entry.length + 1, 0);
  return { from, to: from + (lines[line - 1]?.length ?? 0) };
}

export function useSchema(editor: () => Editor | null) {
  const code = ref('');
  const problem = shallowRef<Problem>();
  const loading = ref<string[] | null>([]);
  const last = shallowRef<Run>();
  let sandbox: ReturnType<typeof createSandbox> | undefined;
  let token = 0;

  const status = computed(() => {
    if (loading.value) return ['Loading', ...loading.value].join(' ');
    if (!problem.value) return 'Valid';
    return problem.value.line ? `Error on line ${problem.value.line}` : 'Error';
  });
  const statusKind = computed(() => (loading.value ? 'warning' : problem.value ? 'error' : 'ok'));

  async function apply() {
    const mine = ++token;
    sandbox ??= createSandbox();
    loading.value = [];
    const compiled = await compile(code.value);
    if (mine !== token) return;
    if ('code' in compiled) loading.value = libraries.filter((entry) => compiled.libraries.includes(entry.id)).map((entry) => entry.label);
    const found = 'problem' in compiled ? compiled.problem : await sandbox.run(compiled.code, compiled.libraries);
    if (mine !== token) return;
    loading.value = null;
    problem.value = found;
    last.value = undefined;
    const marks = found?.line ? [{ ...lineSpan(code.value, found.line), message: found.message, severity: 'error' as const }] : [];
    editor()?.setMarks(marks);
  }

  async function validate(values: Record<string, unknown>, context: ValidateContext) {
    last.value = { context };
    const outcome = (await sandbox?.validate(values, context)) ?? { problem: { message: 'The schema is still loading' } };
    last.value = { context, outcome };
    if ('problem' in outcome) throw new Error(outcome.problem.message);
    return outcome.errors;
  }

  function jump() {
    if (!problem.value?.line) return;
    const { from, to } = lineSpan(code.value, problem.value.line);
    editor()?.select(from, to);
  }

  return { code, problem, status, statusKind, last, apply, validate, jump, destroy: () => sandbox?.destroy() };
}
