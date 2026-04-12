import AppSvelte from '../../../../../examples/vanilla-svelte/src/App.svelte?raw';

export function buildFiles(definitionJson: string) {
  return {
    'App.svelte': AppSvelte.replace(
      'import definition from "./definition.json";',
      `const definition = ${definitionJson};`,
    ),
  };
}

export const template = 'svelte' as const;
export const entry: string | undefined = undefined;
export const activeFile = 'App.svelte';
export const visibleFiles = ['App.svelte'];
export const editorHeight = 520;
export const deps: Record<string, string> = {
  '@formhaus/core': '0.3.1',
  'svelte': '3.59.2',
};
