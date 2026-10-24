import { readFileSync } from 'node:fs';
import { apps } from './play-server.mjs';

const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const forms = [
  { hash: 'p=multi-step', definition: read('../examples/definitions/multi-step.json') },
  { hash: 't=contact-form', definition: read('../templates/contact-form.json').definition },
];
const samples = { email: 'alex@example.com', phone: '+14155550134', checkbox: true, switch: true };
const literal = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function prefill(definition) {
  const fill = (field) => ({ ...field, defaultValue: samples[field.type] ?? field.options?.[0]?.value ?? 'Alex Morgan' });
  const steps = definition.steps?.map((step) => ({ ...step, fields: step.fields.map(fill) }));
  return { ...definition, ...(steps ? { steps } : { fields: definition.fields.map(fill) }) };
}

export function primaryButton(definition) {
  const labels = ['Continue', definition.submit.label, ...(definition.steps ?? []).flatMap((step) => step.next?.label ?? [])];
  return new RegExp(`^\\s*(${labels.map(literal).join('|')})\\s*$`);
}

const settle = (promise) =>
  promise.then(
    () => true,
    () => false,
  );

export function completionChecks({ open, rendered, edit }) {
  async function listed(view, fields) {
    const shown = await Promise.all(fields.map((field) => view.getByText(field.label, { exact: true }).filter({ visible: true }).count()));
    const inputs = await view.locator('input:not([type=hidden]), textarea, select').filter({ visible: true }).count();
    return !inputs && shown.every(Boolean);
  }

  async function until(page, check) {
    for (let attempt = 0; attempt < 300 && !(await check()); attempt += 1) await page.waitForTimeout(100);
  }

  async function submit(page, view, definition, fields) {
    const done = view.getByText('Response submitted', { exact: true }).filter({ visible: true });
    const button = view
      .getByRole('button', { name: primaryButton(definition) })
      .filter({ visible: true })
      .last();
    const text = () => view.locator('body').innerText();
    let review = false;
    for (let turn = 0; turn <= (definition.steps?.length ?? 1); turn += 1) {
      await until(page, async () => (await done.count()) > 0 || (await button.isEnabled().catch(() => false)));
      if (await done.count()) break;
      review = await listed(view, fields);
      const before = await text();
      await button.click({ timeout: 30000 });
      await until(page, async () => (await text()) !== before);
    }
    await settle(done.waitFor({ timeout: 5000 }));
    return (await done.count()) ? { answers: review || (await listed(view, fields)) } : null;
  }

  async function complete(page, app, { hash, definition }, problems) {
    const name = `${app.id} ${hash}`;
    await open(page, `/play#ds=${app.id}&${hash}`);
    await edit(page, JSON.stringify(prefill(definition), null, 2));
    await rendered(page);
    const view = page.frameLocator(`iframe[src*="/play/apps/${app.id}/"]`);
    const fields = (definition.steps?.[0].fields ?? definition.fields).slice(0, 2);
    const first = view.getByLabel(fields[0].label, { exact: false }).first();
    const expected = String(samples[fields[0].type] ?? 'Alex Morgan');
    await until(page, async () => (await first.inputValue().catch(() => '')) === expected);
    const result = await submit(page, view, definition, fields);
    if (!result) return problems.push(`${name}: no completion screen after submit`);
    if (!result.answers) problems.push(`${name}: the answers are not listed on the completion or review screen`);
    if (/[{}]/.test(await view.locator('body').innerText())) problems.push(`${name}: the completion screen shows raw JSON`);
    await view.getByRole('button', { name: 'Submit another response' }).click();
    if (!(await settle(first.waitFor({ timeout: 5000 })))) problems.push(`${name}: "Submit another response" did not bring the form back`);
  }

  return {
    async completion(page, problems) {
      for (const app of apps)
        for (const form of forms)
          await complete(page, app, form, problems).catch(async (error) => {
            const lines = String(error).split('\n');
            const shown = await page
              .frameLocator(`iframe[src*="/play/apps/${app.id}/"]`)
              .locator('body')
              .innerText({ timeout: 2000 })
              .catch(() => '');
            problems.push(
              `${app.id} ${form.hash}: threw ${lines[0]} | ${lines.slice(-6).join(' ').replace(/\s+/g, ' ')} | preview: ${shown.replace(/\s+/g, ' ').slice(0, 300)}`,
            );
          });
    },
  };
}
