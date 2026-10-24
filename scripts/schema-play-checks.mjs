const selectAll = process.platform === 'darwin' ? 'Meta+A' : 'Control+A';

const players = async (form, names) => {
  for (const [index, name] of names.entries()) {
    if (index >= (await form.getByLabel(/^Name/).count())) await form.getByRole('button', { name: 'Add player' }).click();
    await form.getByLabel(/^Name/).nth(index).fill(name);
  }
};

const recipes = [
  {
    id: 'players',
    libraries: ['zod', 'valibot', 'arktype'],
    async fill(form) {
      await form.getByLabel(/^Email/).fill('sam@');
      await players(form, ['A', 'Robin']);
    },
    keys: ['email', 'players.0.name'],
  },
  {
    id: 'empty',
    libraries: ['zod', 'valibot', 'arktype'],
    fill: (form) => form.getByLabel(/^Website/).fill('foo'),
    keys: ['website'],
  },
  {
    id: 'confirm',
    libraries: ['zod', 'valibot', 'arktype'],
    async fill(form, run) {
      await form.getByLabel(/^Email/).fill('sam@example.com');
      if ((await run()) !== 'No errors') throw new Error('Continue did not pass');
      await form.getByLabel(/^Password/).fill('12345678');
      await form.getByLabel(/^Repeat the password/).fill('1234');
    },
    keys: ['confirm'],
  },
  {
    id: 'server-check',
    libraries: ['zod', 'valibot'],
    fill: (form) => form.getByLabel(/^Email/).fill('taken@example.com'),
    keys: ['email'],
  },
  {
    id: 'on-validate',
    libraries: ['zod'],
    async fill(form) {
      await form.getByLabel(/^Email/).fill('sam@example.com');
      await players(form, ['Sam', 'sam', 'Kim']);
    },
    keys: ['players.1.name', 'form'],
  },
];

async function open(page, base, hash) {
  await page.goto(`${base}/play/schema#${hash}`);
  await page.locator('.sp-status', { hasText: /^(Valid|Error)/ }).waitFor({ timeout: 20000 });
}

async function runForm(page) {
  const before = await page.locator('.sp-result').innerText();
  await page.locator('.sp-form .fh-form button[type="submit"]').click();
  await page.waitForFunction(
    (previous) =>
      document.querySelector('.sp-result')?.innerText !== previous && !document.querySelector('.sp-result__badge[data-kind="busy"]'),
    before,
    { timeout: 10000 },
  );
  return page.locator('.sp-result__badge').textContent();
}

async function typeCode(page, text) {
  const editor = page.locator('.cm-content[aria-label="Schema code"]');
  await editor.click();
  await page.keyboard.press(selectAll);
  await page.keyboard.insertText(text);
  await page.waitForTimeout(400);
  return page.locator('.sp-status', { hasText: /^(Valid|Error)/ }).textContent({ timeout: 10000 });
}

export function schemaChecks(base) {
  return {
    async schemaRecipes(page, problems) {
      for (const recipe of recipes) {
        for (const library of recipe.libraries) {
          const name = `${recipe.id}/${library}`;
          try {
            await open(page, base, `p=${recipe.id}&lib=${library}`);
            const status = await page.locator('.sp-status').textContent();
            if (status !== 'Valid') problems.push(`${name}: status "${status}"`);
            await recipe.fill(page.locator('.sp-form'), () => runForm(page));
            await runForm(page);
            const keys = await page.locator('.sp-result .play-issues__path').allTextContents();
            if (keys.join() !== recipe.keys.join()) problems.push(`${name}: errors on ${keys.join(', ') || 'nothing'}`);
          } catch (error) {
            problems.push(`${name}: ${String(error).split('\n')[0]}`);
          }
        }
      }
    },

    async schemaCode(page, problems) {
      await open(page, base, 'p=empty&lib=zod');
      const cases = [
        ["import { z } from 'zod';\n\nexport const schema = z.object(;\n", 'Error on line 3'],
        ["import { z } from 'zod';\nexport const schema = z.object({});\nmissing.call();\n", 'Error on line 3'],
        ["import yup from 'yup';\nexport const schema = yup.object();\n", 'Error on line 1'],
        ["import * as v from 'valibot';\nexport const schema = v.object({ website: v.literal('ok') });\n", 'Valid'],
      ];
      for (const [code, expected] of cases) {
        const status = await typeCode(page, code);
        if (status !== expected) problems.push(`code ${JSON.stringify(code.split('\n')[0])}: status "${status}", expected "${expected}"`);
      }
      await page.getByLabel(/^Website/).fill('nope');
      await runForm(page);
      const message = await page.locator('.sp-result .play-issues__text').first().textContent();
      if (!message?.includes('"ok"')) problems.push(`the edited Valibot schema reported "${message}"`);
      await page.waitForTimeout(600);
      const copy = await page.context().newPage();
      await open(copy, base, page.url().split('#')[1]);
      const restored = await copy.evaluate(() => document.querySelector('.cm-content[aria-label="Schema code"]')?.innerText);
      if (!restored?.includes("v.literal('ok')")) problems.push('the share link did not restore the edited code');
      await copy.close();
    },
  };
}
