import { type LibraryId, libraries } from './recipes';
import type { Problem } from './runtime/module';

const builtins = ['@formhaus/core', '@formhaus/core/schema'];
const isLibrary = (name: string): name is LibraryId => libraries.some((library) => library.id === name);

export type Compiled = { code: string; libraries: LibraryId[] } | { problem: Problem };

const lineOf = (source: string, index: number) => (index < 0 ? undefined : source.slice(0, index).split('\n').length);

export async function compile(source: string): Promise<Compiled> {
  const { transform } = await import('sucrase');
  let code: string;
  try {
    code = transform(source, { transforms: ['typescript', 'imports'], disableESTransforms: true }).code;
  } catch (error) {
    const { message, loc } = error as { message: string; loc?: { line: number } };
    return { problem: { message: message.replace(/ \(\d+:\d+\)$/, ''), line: loc?.line } };
  }
  const names = [...new Set(Array.from(code.matchAll(/require\((['"])(.+?)\1\)/g), (match) => match[2]!))];
  const unknown = names.find((name) => !builtins.includes(name) && !isLibrary(name));
  if (unknown !== undefined)
    return {
      problem: {
        message: `Cannot import '${unknown}'. Import from zod, valibot, arktype or @formhaus/core/schema.`,
        line: lineOf(source, source.indexOf(`'${unknown}'`)) ?? lineOf(source, source.indexOf(`"${unknown}"`)),
      },
    };
  return { code: code.replace(/(_[\w$]+\.[\w$]+)\.call\(void 0(, )?/g, '(0, $1)('), libraries: names.filter(isLibrary) };
}
