import type { PageData } from 'vitepress';

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

function templateDescription({ summary, steps, fields }: { summary: string; steps: number; fields: number }) {
  const counts = `${plural(steps, 'step')}, ${plural(fields, 'field')}.`;
  const tails = ['Free template with a live preview and the JSON definition.', 'Free template with a live preview and JSON.'];
  const candidates = [...tails.map((tail) => `${summary} ${counts} ${tail}`), ...tails.map((tail) => `${summary} ${tail}`)];
  return candidates.find((text) => text.length >= 120 && text.length <= 160) ?? candidates.at(-1)!;
}

export function transformPageData(pageData: PageData) {
  const params = pageData.params;
  if (!pageData.relativePath.startsWith('templates/') || !params?.slug) return;
  pageData.title = `${params.title} template`;
  pageData.description = templateDescription(params as { summary: string; steps: number; fields: number });
}
