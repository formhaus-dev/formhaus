import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type FormDefinition, type FormNode, isSection, type LocaleCatalog, revealTargets } from '../../src';
import { localize, type Overlay, translation, type TranslationFile } from '../../src/i18n';

interface ConformanceCase {
  name: string;
  input: { values: Record<string, unknown>; skippedSteps: string[]; hiddenValues?: 'clear' | 'keep' };
  expected: { values: Record<string, unknown>; errors: Record<string, string> };
  canSubmit: boolean;
  serverValues?: Record<string, unknown>;
}

export interface ConformanceFixture {
  name: string;
  issues: { code: string; path: string }[];
  warnings?: { code: string; path: string }[];
  refused?: { code: string; path: string }[];
  definition: FormDefinition;
  overlay?: Overlay;
  locale?: LocaleCatalog[];
  texts?: Record<string, string>;
  cases?: ConformanceCase[];
  recall?: RecallCase[];
  orders?: OrderVector[];
  reveals?: Record<string, { parent: string; option: number }>;
}

interface OrderVector {
  seed: string;
  key: string;
  count: number;
  pinned: number[];
  order: number[];
}

interface RecallCase {
  name: string;
  values: Record<string, unknown>;
  texts: { address: string; group?: string; item?: number; text: string }[];
}

const dir = join(__dirname, '../../fixtures/conformance');

export const corpus: ConformanceFixture[] = readdirSync(dir)
  .filter((file) => file.endsWith('.json'))
  .map((file) => JSON.parse(readFileSync(join(dir, file), 'utf8')));

const valid = corpus.filter(({ issues }) => !issues.length);

export const runtime = ({ definition, overlay }: ConformanceFixture) =>
  overlay ? localize(definition, translation({ locale: definition.lang ?? 'en', ...overlay } as TranslationFile)).definition : definition;

export const cases = valid.flatMap((fixture) =>
  (fixture.cases ?? []).map((testCase) => [`${fixture.name}: ${testCase.name}`, runtime(fixture), testCase, fixture.locale] as const),
);

export const recalls = corpus.flatMap((fixture) =>
  (fixture.recall ?? []).map((testCase) => [`${fixture.name}: ${testCase.name}`, runtime(fixture), testCase] as const),
);

export const orders = corpus.flatMap((fixture) =>
  (fixture.orders ?? []).map((vector, index) => [`${fixture.name}: ${index}`, vector] as const),
);

export function revealPointers(definition: FormDefinition): Record<string, { parent: string; option: number }> {
  const tops: [string, FormNode[]][] = definition.steps?.length
    ? definition.steps.map((step, index) => [`/steps/${index}/fields`, step.fields])
    : [['/fields', definition.fields ?? []]];
  const lists = tops.flatMap(([path, nodes]) => [
    [path, nodes] as const,
    ...nodes.flatMap((node, index) =>
      isSection(node) && node.layout !== 'matrix' ? [[`${path}/${index}/fields`, node.fields as FormNode[]] as const] : [],
    ),
  ]);
  const found: Record<string, { parent: string; option: number }> = {};
  for (const [path, nodes] of lists)
    revealTargets(nodes).forEach((target, index) => {
      if (target) found[`${path}/${index}`] = { parent: `${path}/${target.parent}`, option: target.option };
    });
  return found;
}
