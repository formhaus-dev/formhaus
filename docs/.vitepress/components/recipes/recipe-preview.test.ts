import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const recipes = fileURLToPath(new URL('../../../recipes/', import.meta.url));

describe('RecipePreview names', () => {
  const pages = readdirSync(recipes).filter((file) => file.endsWith('.md'));
  const names = pages.flatMap((page) =>
    [...readFileSync(`${recipes}${page}`, 'utf8').matchAll(/<RecipePreview name="([^"]+)"/g)].map((match) => ({ page, name: match[1] })),
  );

  it('finds previews', () => {
    expect(names.length).toBeGreaterThan(0);
  });

  it.each(names)('$page uses an existing definition $name', ({ name }) => {
    expect(existsSync(`${recipes}definitions/${name}.json`)).toBe(true);
  });
});
