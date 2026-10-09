import type { BindingRow } from '../bindings/rows';
import type { TextSlot } from '../config';
import { ROLE_LABELS, ROLE_SLOTS } from '../roles';
import { byId, element, iconButton, previewStore } from './dom';

const SLOT_NAMES: Record<TextSlot, string> = { label: 'Label', value: 'Value or placeholder', helper: 'Helper text' };
const store = previewStore();
let returnRole: string | null = null;

export type SlotChange = (row: BindingRow, slot: TextSlot, name: string) => void;

function picker(row: BindingRow, slot: TextSlot, change: SlotChange): HTMLElement {
  const field = element('label', 'sheet-field');
  field.appendChild(element('span', '', SLOT_NAMES[slot]));
  const select = element('select');
  for (const name of ['', ...(row.candidates ?? [])]) {
    const option = element('option', '', name || 'None');
    option.value = name;
    select.appendChild(option);
  }
  select.value = row.slots?.[slot] ?? '';
  select.onchange = () => change(row, slot, select.value);
  field.appendChild(select);
  return field;
}

export function closeSheet(): void {
  byId('sheet').classList.remove('is-open');
  store.release();
  if (returnRole) document.querySelector<HTMLElement>(`.card[data-role="${returnRole}"]`)?.focus();
  returnRole = null;
}

export function openSheet(row: BindingRow, change: SlotChange): void {
  store.release();
  returnRole = row.role;
  const sheet = byId('sheet');
  const panel = element('div', 'sheet-panel');
  const header = element('header', 'sheet-header');
  const title = element('div');
  title.append(element('div', 'sheet-title', 'Text slots'), element('div', 'sheet-sub', `${ROLE_LABELS[row.role]} · ${row.name ?? ''}`));
  header.append(title, iconButton('close', 'Close', closeSheet));
  panel.appendChild(header);
  if (row.thumbnail) {
    const frame = element('div', 'sheet-preview');
    const image = element('img');
    image.src = store.url(row.thumbnail);
    image.alt = '';
    frame.appendChild(image);
    panel.appendChild(frame);
  }
  panel.appendChild(element('p', 'sheet-hint', 'Pick the text layer that receives each part of a field.'));
  for (const slot of ROLE_SLOTS[row.role]) panel.appendChild(picker(row, slot, change));
  const done = element('button', 'btn btn-primary', 'Done');
  done.type = 'button';
  done.onclick = closeSheet;
  panel.appendChild(done);
  sheet.replaceChildren(panel);
  sheet.classList.add('is-open');
  sheet.onclick = (event) => event.target === sheet && closeSheet();
  sheet.onkeydown = (event) => event.key === 'Escape' && closeSheet();
  done.focus();
}
