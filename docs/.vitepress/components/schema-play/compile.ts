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
  const imports = Array.from(code.matchAll(/var (_[\w$]+) = (?:_interopRequire\w+\()?require\((['"])(.+?)\2\)/g));
  const names = [...new Set(imports.map((match) => match[3]!))];
  const unknown = names.find((name) => !builtins.includes(name) && !isLibrary(name));
  if (unknown !== undefined)
    return {
      problem: {
        message: `Cannot import '${unknown}'. Import from zod, valibot, arktype or @formhaus/core/schema.`,
        line: lineOf(source, source.indexOf(`'${unknown}'`)) ?? lineOf(source, source.indexOf(`"${unknown}"`)),
      },
    };
  const bindings = imports.map((match) => match[1]!.replace(/\$/g, '\\$')).join('|');
  const calls = new RegExp(`\\b((?:${bindings})\\.[\\w$]+)\\.call\\(void 0(, )?`, 'g');
  return { code: bindings ? code.replace(calls, '(0, $1)(') : code, libraries: names.filter(isLibrary) };
}
