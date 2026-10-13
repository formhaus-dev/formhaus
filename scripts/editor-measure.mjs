const fields = [
  { key: 'name', type: 'text', label: 'Full name', helperText: 'As on your ID', placeholder: 'Jane Doe', validation: { required: true } },
  { key: 'contact', type: 'radio', label: 'How should we reach you?', options: [{ value: 'email', label: 'Email' }, { value: 'phone', label: 'Phone' }] },
  { key: 'phone', type: 'tel', label: 'Phone number', show: [{ field: 'contact', in: ['phone'] }] },
];

export const definition = {
  id: 'edges',
  title: 'Edge check',
  submit: { label: 'Send' },
  steps: [
    { id: 'about', title: 'Step 1', fields },
    { id: 'reach', title: 'Contact details', description: 'How we reach you', fields: [{ key: 'note', type: 'text', label: 'Note' }] },
  ],
};

export async function settle(page, measure) {
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

const spacing = { stack: 8, group: 12 };

export function spaced(name, list) {
  const off = list.filter(([, gap, kind]) => Number.isNaN(gap ?? NaN) || Math.abs(gap - spacing[kind]) > 0.5);
  if (off.length) throw new Error(`${name}: vertical gaps differ: ${JSON.stringify(off)}`);
}

export function same(name, edge, list) {
  const [, first] = list[0];
  const off = list.filter(([, value]) => value === undefined || Math.abs(value - first) > 0.5);
  if (off.length) throw new Error(`${name}: ${edge} differ: ${JSON.stringify(list)}`);
}
