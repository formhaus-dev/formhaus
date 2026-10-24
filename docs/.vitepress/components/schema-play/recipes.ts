export const libraries = [
  { id: 'zod', label: 'Zod' },
  { id: 'valibot', label: 'Valibot' },
  { id: 'arktype', label: 'ArkType' },
] as const;

export type LibraryId = (typeof libraries)[number]['id'];

export interface Recipe {
  id: string;
  label: string;
  definition: string;
  snippets: Partial<Record<LibraryId, string>> | string;
}

export const recipes: Recipe[] = [
  {
    id: 'players',
    label: 'Players',
    definition: 'players',
    snippets: { zod: 'schema-zod', valibot: 'schema-valibot', arktype: 'schema-arktype' },
  },
  {
    id: 'empty',
    label: 'Empty answers',
    definition: 'empty',
    snippets: { zod: 'schema-empty', valibot: 'schema-empty-valibot', arktype: 'schema-empty-arktype' },
  },
  {
    id: 'confirm',
    label: 'Checks across fields',
    definition: 'confirm',
    snippets: { zod: 'schema-confirm', valibot: 'schema-confirm-valibot', arktype: 'schema-confirm-arktype' },
  },
  {
    id: 'server-check',
    label: 'Async server check',
    definition: 'server-check',
    snippets: { zod: 'schema-server-check', valibot: 'schema-server-check-valibot' },
  },
  { id: 'on-validate', label: 'Without a schema', definition: 'players', snippets: 'on-validate' },
];

const snippets = import.meta.glob<string>('../../../recipes/snippets/{schema-*,on-validate}.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const definitions = import.meta.glob<object>('./definitions/*.json', { import: 'default', eager: true });

export const recipeOf = (id: string | undefined) => recipes.find((recipe) => recipe.id === id) ?? recipes[0]!;

export const supports = (recipe: Recipe, library: LibraryId) => typeof recipe.snippets === 'string' || library in recipe.snippets;

export function snippetOf(recipe: Recipe, library: LibraryId) {
  const name = typeof recipe.snippets === 'string' ? recipe.snippets : (recipe.snippets[library] ?? Object.values(recipe.snippets)[0]!);
  return snippets[`../../../recipes/snippets/${name}.ts`]!;
}

export const definitionOf = (recipe: Recipe) => definitions[`./definitions/${recipe.definition}.json`]!;
