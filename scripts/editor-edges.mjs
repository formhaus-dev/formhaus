import { definition, same, settle, spaced } from './editor-measure.mjs';
import { stepHeaders, stepScroll } from './editor-steps.mjs';

const measureCard = (card) =>
  card.evaluate((node) => {
    const rect = (element) => element?.getBoundingClientRect();
    const inset = (element) => {
      if (!element) return undefined;
      const style = getComputedStyle(element);
      const box = element.tagName === 'TEXTAREA' ? rect(element.parentElement) : rect(element);
      return rect(element).left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft) - box.left;
    };
    const label = node.querySelector('textarea[aria-label="Field label"]');
    const help = node.querySelector('textarea[aria-label="Help text"]');
    const placeholder = node.querySelector('input[aria-label="Placeholder"]');
    const chip = node.querySelector('button[aria-label^="Field type"]');
    const head = label?.closest('[data-card] > div > div');
    const handle = node.querySelector(':scope > button');
    const labelBox = rect(label?.parentElement);
    const rights = [rect(head?.lastElementChild)?.right];
    const handleBox = rect(handle);
    if (handleBox && labelBox && handleBox.width && handleBox.top < labelBox.bottom && handleBox.bottom > labelBox.top) rights.push(handleBox.right);
    const chipBox = rect(chip);
    const conditionBox = rect([...node.querySelectorAll('button')].find((button) => button.textContent.startsWith('Shown if')));
    const rows = [...node.querySelectorAll('[data-option]')].map(rect);
    const stack = [['head', rect(head)], ['help', rect(help?.parentElement)], ['condition', conditionBox]].filter(([, box]) => box);
    const answer = rect(placeholder) ?? rows[0];
    const gaps = stack.slice(1).map(([key, box], index) => [`${stack[index][0]} to ${key}`, box.top - stack[index][1].bottom, 'stack']);
    if (answer) gaps.push(['question to answer', answer.top - stack.at(-1)[1].bottom, 'group']);
    rows.slice(1).forEach((box, index) => gaps.push([`option ${String(index + 1)} to ${String(index + 2)}`, box.top - rows[index].bottom, 'stack']));
    if (chipBox && labelBox && chipBox.top >= labelBox.bottom) gaps.push(['label to type picker', chipBox.top - labelBox.bottom, 'stack']);
    return {
      gaps,
      label: labelBox?.left,
      labelInset: inset(label),
      row: Math.max(...rights.filter((value) => value !== undefined)),
      chip: chipBox && labelBox && chipBox.top >= labelBox.bottom ? chipBox.left : null,
      help: rect(help?.parentElement),
      helpInset: inset(help),
      placeholder: rect(placeholder),
      placeholderInset: inset(placeholder),
      radio: rect(node.querySelector('[data-option] span[aria-hidden]'))?.left ?? null,
      condition: conditionBox?.left ?? null,
    };
  });

export async function seed(page) {
  await page.evaluate((seed) => {
    localStorage.setItem('fh:build:v1', JSON.stringify({ definition: seed, revision: 1, savedAt: new Date().toISOString() }));
  }, definition);
  await page.reload();
  await page.getByRole('textbox', { name: 'Field label' }).first().waitFor();
}

async function fieldCards(page, name) {
  await seed(page);
  const header = await settle(page, () => measureForm(page));
  const kinds = ['text', 'choice', 'conditional'];
  for (const [index, kind] of kinds.entries()) {
    const card = page.locator('[data-card]:has(textarea[aria-label="Field label"])').nth(index);
    await card.click({ position: { x: 3, y: 3 } });
    const found = await settle(page, () => measureCard(card));
    const where = `${name} ${kind}`;
    const lefts = [['title', header.title.left], ['label', found.label], ['help', found.help?.left]];
    if (kind === 'text') lefts.push(['placeholder', found.placeholder?.left]);
    if (kind === 'choice') lefts.push(['radio', found.radio]);
    if (kind === 'conditional') lefts.push(['condition', found.condition]);
    if (found.chip !== null) lefts.push(['type picker', found.chip]);
    same(where, 'left edges', lefts);
    const rights = [['title', header.title.right], ['label row', found.row], ['help', found.help?.right]];
    if (kind === 'text') rights.push(['placeholder', found.placeholder?.right]);
    same(where, 'right edges', rights);
    const insets = [['title', header.inset], ['label', found.labelInset], ['help', found.helpInset]];
    if (kind === 'text') insets.push(['placeholder', found.placeholderInset]);
    same(where, 'text insets', insets);
    spaced(where, found.gaps);
  }
  await stepHeaders(page, name, header);
  await stepScroll(page, name);
  await page.evaluate(() => {
    localStorage.removeItem('fh:build:v1');
  });
}

const measureForm = (page) =>
  page.evaluate(() => {
    const rect = (node) => node?.getBoundingClientRect();
    const card = document.querySelector('[data-card]');
    const submit = [...document.querySelectorAll('label')].find((label) => label.textContent.trim() === 'Submit button');
    const title = document.querySelector('textarea[aria-label="Form title"]');
    const style = title && getComputedStyle(title);
    return {
      title: rect(title?.parentElement),
      inset: title && rect(title).left + parseFloat(style.paddingLeft) - rect(title.parentElement).left,
      description: rect(document.querySelector('textarea[aria-label="Form description"]')?.parentElement),
      gap: rect(document.querySelector('textarea[aria-label="Form description"]')?.parentElement)?.top - rect(title?.parentElement)?.bottom,
      label: rect(document.querySelector('textarea[aria-label="Field label"]')?.parentElement),
      placeholder: rect(card?.querySelector('input[placeholder]')),
      submit: rect(submit && document.getElementById(submit.htmlFor)),
    };
  });

export async function alignment(page, base, name) {
  await page.goto(`${base}/build`);
  await page.getByRole('textbox', { name: 'Field label' }).first().click();
  await page.locator('style[data-fh-editor="editor"]').waitFor({ state: 'attached' });
  const found = await settle(page, () => measureForm(page));
  const lefts = ['title', 'description', 'label', 'placeholder', 'submit'].map((key) => [key, found[key]?.left]);
  const rights = ['title', 'description', 'placeholder'].map((key) => [key, found[key]?.right]);
  same(name, 'left edges', lefts);
  same(name, 'right edges', rights);
  spaced(name, [['form title to description', found.gap, 'stack']]);
  await fieldCards(page, name);
}
