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

export function completionChecks({ open, rendered, frameOf, edit }) {
  async function listed(frame, fields) {
    const shown = await Promise.all(fields.map((field) => frame.getByText(field.label, { exact: true }).filter({ visible: true }).count()));
    const inputs = await frame.locator('input:not([type=hidden]), textarea, select').filter({ visible: true }).count();
    return !inputs && shown.every(Boolean);
  }

  async function submit(frame, definition, fields) {
    const primary = primaryButton(definition);
    const done = frame.getByText('Response submitted', { exact: true }).filter({ visible: true });
    let review = false;
    for (let turn = 0; turn <= (definition.steps?.length ?? 1) && !(await done.count()); turn += 1) {
      review = await listed(frame, fields);
      await frame.getByRole('button', { name: primary }).filter({ visible: true }).last().click();
      await done.waitFor({ timeout: 1500 }).catch(() => {});
    }
    return (await done.count()) ? { answers: review || (await listed(frame, fields)) } : null;
  }

  return {
    async completion(page, problems) {
      for (const app of apps)
        for (const { hash, definition } of forms) {
          const name = `${app.id} ${hash}`;
          await open(page, `/play#ds=${app.id}&${hash}`);
          await edit(page, JSON.stringify(prefill(definition), null, 2));
          await rendered(page);
          const frame = frameOf(page, app.id);
          const fields = (definition.steps?.[0].fields ?? definition.fields).slice(0, 2);
          const result = await submit(frame, definition, fields);
          if (!result) {
            problems.push(`${name}: no completion screen after submit`);
            continue;
          }
          if (!result.answers) problems.push(`${name}: the answers are not listed on the completion or review screen`);
          const text = await frame.evaluate(() => document.body.innerText);
          if (/[{}]/.test(text)) problems.push(`${name}: the completion screen shows raw JSON`);
          await frame.getByRole('button', { name: 'Submit another response' }).click();
          const back = await frame
            .getByLabel(fields[0].label, { exact: false })
            .first()
            .waitFor({ timeout: 5000 })
            .then(
              () => true,
              () => false,
            );
          if (!back) problems.push(`${name}: "Submit another response" did not bring the form back`);
        }
    },
  };
}
