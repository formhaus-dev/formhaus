import { same, settle, spaced } from './editor-measure.mjs';

const measureStep = (card) =>
  card.evaluate((node) => {
    const rect = (element) => element?.getBoundingClientRect();
    const title = node.querySelector('textarea[aria-label="Step title"]');
    const description = node.querySelector('textarea[aria-label="Step description"]');
    const count = [...node.querySelectorAll('span')].find((span) => /^Step \d+$/.test(span.textContent.trim()));
    const style = title && getComputedStyle(title);
    return {
      value: title?.value,
      count: rect(count)?.left,
      actions: rect(node.querySelector('button[aria-label="Step settings"]')?.parentElement)?.right,
      title: rect(title?.parentElement),
      inset: title && rect(title).left + parseFloat(style.paddingLeft) - rect(title.parentElement).left,
      description: rect(description?.parentElement),
      gaps: [
        ['step label to title', rect(title?.parentElement).top - rect(count?.parentElement).bottom, 'stack'],
        ['title to description', rect(description?.parentElement)?.top - rect(title?.parentElement).bottom, 'stack'],
      ],
    };
  });

export async function stepHeaders(page, name, header) {
  for (const index of [0, 1]) {
    const card = page.locator('[data-card]:has(textarea[aria-label="Step title"])').nth(index);
    await card.click({ position: { x: 3, y: 3 } });
    const found = await settle(page, () => measureStep(card));
    const where = `${name} step ${String(index + 1)}`;
    if (index === 0 && found.value !== '') throw new Error(`${where}: the default title repeats "Step 1" as "${found.value}"`);
    same(where, 'left edges', [['title', header.title.left], ['step label', found.count], ['step title', found.title?.left], ['step description', found.description?.left]]);
    same(where, 'right edges', [['title', header.title.right], ['step actions', found.actions], ['step title', found.title?.right], ['step description', found.description?.right]]);
    same(where, 'text insets', [['title', header.inset], ['step title', found.inset]]);
    spaced(where, found.gaps);
  }
}

export async function stepScroll(page, name) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  const outline = page.getByRole('navigation', { name: 'Steps' });
  const listed = (await outline.count()) > 0;
  if (listed) await outline.getByRole('button').nth(1).click();
  else await page.getByRole('combobox', { name: 'Jump to step' }).selectOption({ index: 2 });
  const found = await settle(page, () =>
    page.evaluate(() => {
      const header = document.querySelectorAll('[data-card]:has(textarea[aria-label="Step title"])')[1];
      const bars = [...document.querySelectorAll('body *')].filter((node) => {
        const style = getComputedStyle(node);
        const box = node.getBoundingClientRect();
        return ['sticky', 'fixed'].includes(style.position) && box.top <= 1 + parseFloat(style.top || '0') && box.width > innerWidth / 2 && box.top < innerHeight / 3 && box.height < innerHeight / 3;
      });
      const box = header?.getBoundingClientRect();
      return {
        top: box?.top,
        bottom: box?.bottom,
        below: Math.max(0, ...bars.map((node) => node.getBoundingClientRect().bottom)),
        height: innerHeight,
        scrolled: scrollY,
        end: scrollY + innerHeight >= document.documentElement.scrollHeight - 1,
        focused: header?.contains(document.activeElement) && document.activeElement.getAttribute('aria-label') === 'Step title',
      };
    }),
  );
  const where = `${name} step jump`;
  if (!found.scrolled) throw new Error(`${where}: picking step 2 did not scroll`);
  if (found.top < found.below - 0.5 || found.bottom > found.height + 0.5) throw new Error(`${where}: step 2 header is not fully visible below the sticky bar: ${JSON.stringify(found)}`);
  if (!found.end && found.top - found.below > 48) throw new Error(`${where}: step 2 header did not scroll up to the sticky bar: ${JSON.stringify(found)}`);
  if (listed && !found.focused) throw new Error(`${where}: clicking step 2 did not focus its title`);
}
