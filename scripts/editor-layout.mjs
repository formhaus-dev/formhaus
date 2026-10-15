const definition = {
  id: 'layout',
  title: 'Layout check',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'about',
      title: 'About you',
      description: 'A few details',
      fields: [{ key: 'name', type: 'text', label: 'Full name', validation: { required: true } }],
    },
    {
      id: 'more',
      title: 'More',
      fields: [
        {
          key: 'note',
          type: 'radio',
          label: 'Note',
          options: [
            { value: 'a', label: 'A' },
            { value: 'b', label: 'B' },
          ],
        },
      ],
    },
  ],
};

const measure = (page) =>
  page.evaluate(() => {
    const rect = (node) => node?.getBoundingClientRect();
    const card = document.querySelector('[data-card]:has(textarea[aria-label="Field label"]) > div');
    const style = getComputedStyle(card);
    const line = [rect(card).left + parseFloat(style.paddingLeft), rect(card).right - parseFloat(style.paddingRight)];
    const lefts = [];
    const rights = [];
    document.querySelectorAll('[data-card]:has(textarea[aria-label="Step title"])').forEach((step, at) => {
      const count = [...step.querySelectorAll('span')].find((span) => /^Step \d+$/.test(span.textContent.trim()));
      lefts.push([`step ${String(at + 1)} label`, rect(count)?.left]);
      const description = step.querySelector('textarea[aria-label="Step description"]');
      if (description) lefts.push([`step ${String(at + 1)} description`, rect(description.parentElement).left]);
      rights.push([`step ${String(at + 1)} actions`, rect(step.querySelector('button[aria-label="Step settings"]')?.parentElement)?.right]);
    });
    const lone = [...document.querySelectorAll('[aria-label^="Buttons for"]')]
      .map((group) => [...group.querySelectorAll('input:not([role="switch"])')])
      .filter((inputs) => inputs.length === 1)
      .map(([input]) => [rect(input).left, rect(input).right]);
    lone.forEach(([left, right], at) => {
      lefts.push([`lone button input ${String(at + 1)}`, left]);
      rights.push([`lone button input ${String(at + 1)}`, right]);
    });
    return { line, lefts, rights, lone: lone.length };
  });

async function cursors(page, name) {
  const choice = page.locator('[data-card]:has(textarea[aria-label="Field label"])').last();
  await choice.click({ position: { x: 3, y: 3 } });
  const card = page.locator('[data-card]:has(textarea[aria-label="Field label"])').first();
  await card.hover({ position: { x: 3, y: 3 } });
  const handles = await page.evaluate(() =>
    [...document.querySelectorAll('button[aria-label^="Reorder"]')].map((node) => [
      node.getAttribute('aria-label'),
      getComputedStyle(node).cursor,
    ]),
  );
  const off = handles.filter(([, cursor]) => cursor !== 'grab');
  if (handles.length < 3 || off.length) throw new Error(`${name}: drag handles without a grab cursor: ${JSON.stringify(handles)}`);
  const box = await card.locator(':scope > button[aria-label^="Reorder"]').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  for (const dy of [3, 6, 20]) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + dy);
  const during = await page.evaluate(() => getComputedStyle(document.body).cursor);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(300);
  if (during !== 'grabbing') throw new Error(`${name}: the page cursor is "${during}" during a drag`);
}

export async function layout(page, base, name) {
  await page.goto(`${base}/build`);
  await page.getByRole('textbox', { name: 'Field label' }).first().waitFor();
  await page.evaluate((seed) => {
    localStorage.setItem('fh:build:v1', JSON.stringify({ definition: seed, revision: 1, savedAt: new Date().toISOString() }));
  }, definition);
  await page.reload();
  await page.getByRole('textbox', { name: 'Field label' }).first().waitFor();
  await page.mouse.move(0, 0);
  const found = await measure(page);
  const [left, right] = found.line;
  const off = [
    ...found.lefts.filter(([, value]) => Math.abs(value - left) > 0.5),
    ...found.rights.filter(([, value]) => Math.abs(value - right) > 0.5),
  ];
  if (off.length)
    throw new Error(
      `${name}: step headers or button inputs leave the card content line ${JSON.stringify(found.line)}: ${JSON.stringify(off)}`,
    );
  if (!found.lone) throw new Error(`${name}: no Buttons card with a single input to check`);
  await cursors(page, name);
  await page.getByRole('button', { name: 'Add step' }).last().click();
  const hint = page.getByText('Add a field to this step.');
  if (!(await hint.first().isVisible())) throw new Error(`${name}: an empty step shows no hint`);
  await page.goto(`${base}/`);
  await page.evaluate(() => {
    localStorage.removeItem('fh:build:v1');
  });
}

const labels = [
  'Email',
  'Как вы узнали о нашем вебинаре и что хотите получить от участия?',
  'Please tell us how you heard about this webinar, what you expect to learn from it and which topics matter most to your team right now',
];

const centres = (page) =>
  page.locator('[data-card]:has(textarea[aria-label="Field label"])').evaluateAll((cards) =>
    cards.map((card) => {
      const text = card.querySelector('textarea[aria-label="Field label"]');
      const line = text.getBoundingClientRect().top + parseFloat(getComputedStyle(text).lineHeight) / 2;
      const controls = [
        ...card.querySelectorAll(
          ':scope > div > div > div > [class*="requiredTag"], button[aria-label^="Field type"], button[aria-label="Field settings"], button[aria-label="Field actions"], :scope > button[aria-label^="Reorder"]',
        ),
      ];
      const wrapped = (node) =>
        node.matches('[class*="requiredTag"]') &&
        node.getBoundingClientRect().top >= text.getBoundingClientRect().top + parseFloat(getComputedStyle(text).lineHeight);
      return controls
        .filter((node) => !wrapped(node) && node.getBoundingClientRect().width > 0)
        .map((node) => [
          node.getAttribute('aria-label') ?? node.textContent,
          node.getBoundingClientRect().top + node.getBoundingClientRect().height / 2 - line,
        ]);
    }),
  );

export async function firstLine(page, base, name) {
  await page.goto(`${base}/build`);
  await page.getByRole('textbox', { name: 'Field label' }).first().waitFor();
  await page.evaluate((list) => {
    const fields = list.map((label, at) => ({ key: `k${String(at)}`, type: 'text', label, validation: { required: at === 1 } }));
    localStorage.setItem(
      'fh:build:v1',
      JSON.stringify({
        definition: { id: 'lines', title: 'Lines', submit: { label: 'Send' }, fields },
        revision: 1,
        savedAt: new Date().toISOString(),
      }),
    );
  }, labels);
  await page.reload();
  await page.getByRole('textbox', { name: 'Field label' }).first().waitFor();
  for (const state of ['at rest', 'selected']) {
    if (state === 'selected')
      await page
        .locator('[data-card]:has(textarea[aria-label="Field label"])')
        .last()
        .click({ position: { x: 3, y: 3 } });
    await page.mouse.move(0, 0);
    await page.waitForTimeout(200);
    const found = await centres(page);
    const off = found.flatMap((list, card) =>
      list.filter(([, delta]) => Math.abs(delta) > 1).map(([control, delta]) => [card + 1, control, delta]),
    );
    if (off.length) throw new Error(`${name} ${state}: row one controls leave the label's first line: ${JSON.stringify(off)}`);
  }
  await page.goto(`${base}/`);
  await page.evaluate(() => {
    localStorage.removeItem('fh:build:v1');
  });
}
