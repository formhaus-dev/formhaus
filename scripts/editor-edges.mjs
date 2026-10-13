const fields = [
  { key: 'name', type: 'text', label: 'Full name', helperText: 'As on your ID', placeholder: 'Jane Doe', validation: { required: true } },
  { key: 'contact', type: 'radio', label: 'How should we reach you?', options: [{ value: 'email', label: 'Email' }, { value: 'phone', label: 'Phone' }] },
  { key: 'phone', type: 'tel', label: 'Phone number', show: [{ field: 'contact', in: ['phone'] }] },
];

const definition = {
  id: 'edges',
  title: 'Edge check',
  submit: { label: 'Send' },
  steps: [
    { id: 'about', title: 'Step 1', fields },
    { id: 'reach', title: 'Contact details', description: 'How we reach you', fields: [{ key: 'note', type: 'text', label: 'Note' }] },
  ],
};

async function settle(page, measure) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  let found = await measure();
  for (let attempt = 0; attempt < 20; attempt += 1) {
    await page.waitForTimeout(100);
    const next = await measure();
    if (JSON.stringify(next) === JSON.stringify(found)) break;
    found = next;
  }
  return found;
}

function same(name, edge, list) {
  const [, first] = list[0];
  const off = list.filter(([, value]) => value === undefined || Math.abs(value - first) > 0.5);
  if (off.length) throw new Error(`${name}: ${edge} differ: ${JSON.stringify(list)}`);
}

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
    return {
      label: labelBox?.left,
      labelInset: inset(label),
      row: Math.max(...rights.filter((value) => value !== undefined)),
      chip: chipBox && labelBox && chipBox.top >= labelBox.bottom ? chipBox.left : null,
      help: rect(help?.parentElement),
      helpInset: inset(help),
      placeholder: rect(placeholder),
      placeholderInset: inset(placeholder),
      radio: rect(node.querySelector('[data-option] span[aria-hidden]'))?.left ?? null,
      condition: rect([...node.querySelectorAll('button')].find((button) => button.textContent.startsWith('Shown if')))?.left ?? null,
    };
  });

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
      split: description && rect(title.parentElement).bottom <= rect(description.parentElement).top,
    };
  });

async function stepHeaders(page, name, header) {
  for (const index of [0, 1]) {
    const card = page.locator('[data-card]:has(textarea[aria-label="Step title"])').nth(index);
    await card.click({ position: { x: 3, y: 3 } });
    const found = await settle(page, () => measureStep(card));
    const where = `${name} step ${String(index + 1)}`;
    if (index === 0 && found.value !== '') throw new Error(`${where}: the default title repeats "Step 1" as "${found.value}"`);
    same(where, 'left edges', [['title', header.title.left], ['step label', found.count], ['step title', found.title?.left], ['step description', found.description?.left]]);
    same(where, 'right edges', [['title', header.title.right], ['step actions', found.actions], ['step title', found.title?.right], ['step description', found.description?.right]]);
    same(where, 'text insets', [['title', header.inset], ['step title', found.inset]]);
    if (!found.split) throw new Error(`${where}: the description does not sit under the title`);
  }
}

async function stepScroll(page, name) {
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
  await fieldCards(page, name);
}
