export async function alignment(page, base, name) {
  await page.goto(`${base}/build`);
  await page.getByRole('textbox', { name: 'Field label' }).first().click();
  await page.locator('style[data-fh-editor="editor"]').waitFor({ state: 'attached' });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  const measure = () => page.evaluate(() => {
    const rect = (node) => node?.getBoundingClientRect();
    const card = document.querySelector('[data-card]');
    const submit = [...document.querySelectorAll('label')].find((label) => label.textContent.trim() === 'Submit button');
    return {
      title: rect(document.querySelector('textarea[aria-label="Form title"]')?.parentElement),
      description: rect(document.querySelector('textarea[aria-label="Form description"]')?.parentElement),
      label: rect(document.querySelector('textarea[aria-label="Field label"]')?.parentElement),
      placeholder: rect(card?.querySelector('input[placeholder]')),
      submit: rect(submit && document.getElementById(submit.htmlFor)),
    };
  });
  let found = await measure();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await page.waitForTimeout(100);
    const next = await measure();
    if (JSON.stringify(next) === JSON.stringify(found)) break;
    found = next;
  }
  const lefts = Object.entries(found).map(([name, box]) => [name, box?.left]);
  const rights = ['title', 'description', 'placeholder'].map((name) => [name, found[name]?.right]);
  for (const [edge, list] of [['left', lefts], ['right', rights]]) {
    const [, first] = list[0];
    const off = list.filter(([, value]) => value === undefined || Math.abs(value - first) > 0.5);
    if (off.length) throw new Error(`${name}: ${edge} edges differ: ${JSON.stringify(list)}`);
  }
}
