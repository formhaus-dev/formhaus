import { primaryButton } from './play-completion-checks.mjs';
import { apps } from './play-server.mjs';

const choice = (key, type, label, options, extra) => ({
  key,
  type,
  label,
  options: options.map(([value, text]) => ({ value, label: text })),
  ...extra,
});
const shown = (field, rule) => ({ show: [{ field, ...rule }] });

export const contact = {
  id: 'reveal-check',
  title: 'Contact details',
  submit: { label: 'Send' },
  fields: [
    choice(
      'contact',
      'radio',
      'How should we contact you?',
      [
        ['email', 'Email'],
        ['phone', 'Phone'],
        ['post', 'Post'],
      ],
      { validation: { required: true } },
    ),
    { key: 'email', type: 'email', label: 'Email address', validation: { required: true }, ...shown('contact', { eq: 'email' }) },
    { key: 'phone', type: 'phone', label: 'Phone number', validation: { required: true }, ...shown('contact', { eq: 'phone' }) },
    { key: 'texts', type: 'checkbox', label: 'You can text this number', ...shown('contact', { eq: 'phone' }) },
    choice('topics', 'multiselect', 'Topics', [
      ['news', 'News'],
      ['events', 'Events'],
    ]),
    { key: 'remind', type: 'checkbox', label: 'Remind me a day before', ...shown('topics', { contains: 'events' }) },
  ],
};

export const sizes = {
  id: 'focus-check',
  title: 'Order',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'plan',
      title: 'Plan',
      fields: [
        choice('plan', 'radio', 'Plan', [
          ['basic', 'Basic'],
          ['pro', 'Pro'],
          ['team', 'Team'],
        ]),
      ],
    },
    {
      id: 'size',
      title: 'Size',
      fields: [
        choice(
          'size',
          'radio',
          'Size',
          [
            ['s', 'Small'],
            ['m', 'Medium'],
            ['l', 'Large'],
          ],
          { defaultValue: 'l' },
        ),
      ],
    },
  ],
};

const option = (frame, role, name) => frame.getByRole(role, { name, exact: true }).first();
export const pick = (frame, text) => frame.getByText(text, { exact: true }).filter({ visible: true }).first().click();
const isChecked = (locator) => locator.isChecked().catch(() => false);

function placement(frame, role, name, next) {
  return option(frame, role, name).evaluate(
    (input, [nextName, kind]) => {
      const block = document.getElementById(input.getAttribute('aria-controls') ?? '');
      const field = input.closest('[data-fh="field"], .fh-field');
      const later =
        nextName &&
        [...field.querySelectorAll(`[role=${kind}], input[type=${kind}]`)].find(
          (node) => node.getAttribute('aria-label') === nextName || node.labels?.[0]?.textContent?.trim() === nextName,
        );
      const content = block?.querySelector('input, textarea, select, label');
      return {
        block: !!block && block.dataset.fh === 'reveal',
        expanded: input.getAttribute('aria-expanded'),
        open: !!block && !block.hidden && block.getBoundingClientRect().height > 0,
        inside: !!block && field.contains(block) && block.closest('[data-fh="field"], .fh-field') === field,
        after: !!block && !!(input.compareDocumentPosition(block) & Node.DOCUMENT_POSITION_FOLLOWING),
        before: !!block && (!later || !!(block.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING)),
        indent: content ? content.getBoundingClientRect().left - field.getBoundingClientRect().left : 0,
      };
    },
    [next, role],
  );
}

function nested(problems, name, found, checkbox) {
  if (!found.block) problems.push(`${name}: the option has no aria-controls pointing at a data-fh="reveal" block`);
  if (!found.open) problems.push(`${name}: the revealed block is not open`);
  if (!found.inside) problems.push(`${name}: the revealed block is not inside the option group`);
  if (!found.after || !found.before) problems.push(`${name}: the revealed block is not between its option and the next one`);
  if (found.indent < 12) problems.push(`${name}: the revealed block is indented by ${Math.round(found.indent)}px`);
  if (checkbox && found.expanded !== 'true') problems.push(`${name}: the checkbox option has aria-expanded=${found.expanded}`);
}

const invalid = (input) =>
  input.evaluate(
    (node) =>
      node.getAttribute('aria-invalid') === 'true' ||
      !!node.closest('[data-fh="field"], .fh-field')?.querySelector('[aria-invalid="true"]'),
  );

async function finish(frame, definition) {
  const done = frame.getByText('Response submitted', { exact: true }).filter({ visible: true });
  for (let turn = 0; turn < 3 && !(await done.count()); turn += 1) {
    await frame
      .getByRole('button', { name: primaryButton(definition) })
      .filter({ visible: true })
      .last()
      .click();
    await done.waitFor({ timeout: 1500 }).catch(() => {});
  }
  return done.count();
}

async function topics(frame, problems, name) {
  const events = option(frame, 'checkbox', 'Events');
  if (!(await events.count())) return;
  await pick(frame, 'Events');
  nested(problems, `${name} multiselect`, await placement(frame, 'checkbox', 'Events', null), true);
  await pick(frame, 'Remind me a day before');
  if (!(await isChecked(option(frame, 'checkbox', 'Remind me a day before'))) || !(await isChecked(events)))
    problems.push(`${name}: the checkbox under "Events" did not check on its own`);
  await pick(frame, 'Events');
  if (await frame.getByText('Remind me a day before', { exact: true }).filter({ visible: true }).count())
    problems.push(`${name}: the field under "Events" stays visible after unchecking it`);
}

async function reveal(frame, problems, name) {
  const email = frame.getByLabel('Email address', { exact: false }).first();
  if (await email.isVisible()) problems.push(`${name}: the email field shows before an option is chosen`);
  if (await frame.locator('[data-fh="reveal"]:not([hidden])').filter({ visible: true }).count())
    problems.push(`${name}: a revealed block is open before an option is chosen`);
  await pick(frame, 'Email');
  nested(problems, `${name} radio`, await placement(frame, 'radio', 'Email', 'Phone'), false);
  await frame
    .getByRole('button', { name: primaryButton(contact) })
    .filter({ visible: true })
    .last()
    .click();
  if (!(await invalid(email))) problems.push(`${name}: the empty revealed email is not invalid after submit`);
  await email.fill('alex@example.com');
  for (const key of ['ArrowLeft', 'ArrowDown', 'ArrowUp', 'Home', 'Space']) await email.press(key);
  const kept = await email.evaluate((node) => node === document.activeElement && node.value.trim() === 'alex@example.com');
  if (!kept || !(await isChecked(option(frame, 'radio', 'Email'))))
    problems.push(`${name}: keys in the revealed field reached the radio group`);
  await email.fill('alex@example.com');
  await pick(frame, 'Phone');
  if (await email.isVisible()) problems.push(`${name}: the email field stays visible after choosing Phone`);
  await pick(frame, 'You can text this number');
  if (!(await isChecked(option(frame, 'radio', 'Phone')))) problems.push(`${name}: the checkbox under "Phone" changed the radio`);
  if (!(await isChecked(option(frame, 'checkbox', 'You can text this number'))))
    problems.push(`${name}: the checkbox under "Phone" did not check`);
  await pick(frame, 'Email');
  if ((await email.inputValue()) !== 'alex@example.com') problems.push(`${name}: the email shown again lost its last value`);
  await topics(frame, problems, name);
  await pick(frame, 'Phone');
  await frame.getByLabel('Phone number', { exact: false }).first().fill('+14155550134');
  if (!(await finish(frame, contact))) return problems.push(`${name}: no completion screen after submit`);
  if ((await frame.evaluate(() => document.body.innerText)).includes('alex@example.com'))
    problems.push(`${name}: the hidden email was submitted`);
}

async function focused(frame, label, value) {
  await frame.page().waitForTimeout(400);
  return frame.evaluate(
    ([text, val]) => {
      const active = document.activeElement;
      const checked = active?.checked === true || active?.getAttribute('aria-checked') === 'true';
      const names = [active?.value, active?.getAttribute('value'), active?.getAttribute('aria-label'), active?.textContent]
        .concat([...(active?.labels ?? [])].map((node) => node.textContent))
        .concat(active?.closest('label')?.textContent);
      return checked && names.some((name) => name?.trim() === val || name?.trim() === text);
    },
    [label, value],
  );
}

export async function continueTo(frame) {
  await pick(frame, 'Pro');
  await frame
    .getByRole('button', { name: /^\s*Continue\s*$/ })
    .filter({ visible: true })
    .last()
    .click();
  await frame.getByText('Large', { exact: true }).filter({ visible: true }).first().waitFor({ timeout: 5000 });
}

async function backFocus(frame, problems, name) {
  await continueTo(frame);
  if (!(await focused(frame, 'Large', 'l'))) problems.push(`${name}: Continue did not focus the pre-checked "Large"`);
  await frame.getByText('Back', { exact: true }).filter({ visible: true }).first().click();
  await frame.getByText('Basic', { exact: true }).filter({ visible: true }).first().waitFor({ timeout: 5000 });
  if (!(await focused(frame, 'Pro', 'pro'))) problems.push(`${name}: Back did not focus the checked "Pro"`);
}

export function eachApp({ open, rendered, frameOf, edit }) {
  return async function each(page, problems, definition, run, width = '') {
    for (const app of apps) {
      await open(page, `/play#ds=${app.id}${width}`);
      await edit(page, JSON.stringify(definition, null, 2));
      await rendered(page);
      const frame = frameOf(page, app.id);
      try {
        await frame
          .getByText(definition.steps?.[0].fields[0].label ?? definition.fields[0].label)
          .filter({ visible: true })
          .first()
          .waitFor({ timeout: 10000 });
        await run(frame, problems, app.id);
      } catch (error) {
        problems.push(`${app.id}: threw ${String(error).split('\n')[0]}`);
      }
    }
  };
}

export function revealChecks(play) {
  const each = eachApp(play);
  return {
    reveal: (page, problems) => each(page, problems, contact, reveal),
    backFocus: (page, problems) => each(page, problems, sizes, backFocus),
  };
}
