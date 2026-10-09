import type { BindingRow } from '../bindings/rows';
import type { TextSlot } from '../config';
import { ROLE_LABELS, ROLE_SLOTS } from '../roles';

type Post = (message: Record<string, unknown>) => void;

const GROUPS: Record<string, string> = { field: 'Fields', option: 'Options', button: 'Buttons' };
let previews: string[] = [];

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(label: string, className: string, onClick: () => void): HTMLButtonElement {
  const node = element('button', className, label);
  node.onclick = onClick;
  return node;
}

function preview(row: BindingRow): HTMLElement {
  if (!row.thumbnail) return element('div', 'thumb empty', row.missing ? 'Missing' : 'Kit');
  const url = URL.createObjectURL(new Blob([row.thumbnail as Uint8Array<ArrayBuffer>], { type: 'image/png' }));
  previews.push(url);
  const image = element('img', 'thumb');
  image.src = url;
  image.alt = row.name ?? '';
  return image;
}

function slotPicker(row: BindingRow, slot: TextSlot, post: Post): HTMLElement {
  const label = element('label', 'slot', slot);
  const select = element('select', '');
  for (const name of ['', ...(row.candidates ?? [])]) {
    const option = element('option', '', name || 'none');
    option.value = name;
    select.appendChild(option);
  }
  select.value = row.slots?.[slot] ?? '';
  select.onchange = () => post({ type: 'setSlot', role: row.role, slot, name: select.value });
  label.appendChild(select);
  return label;
}

function rowElement(row: BindingRow, post: Post): HTMLElement {
  const node = element('div', row.name ? 'binding bound' : 'binding');
  const info = element('div', 'info');
  info.append(element('div', 'role', ROLE_LABELS[row.role]), element('div', 'name', row.name ?? 'Built-in kit'));
  if (row.missing) info.appendChild(element('div', 'warning', 'Component not found. Select it again or clear the binding.'));
  if (row.staleProperties) info.appendChild(element('div', 'warning', `Saved properties are gone: ${row.staleProperties.join(', ')}. Bind the instance again.`));
  const actions = element('div', 'actions');
  actions.appendChild(button('Use selection', 'btn-small', () => post({ type: 'bindSelection', role: row.role })));
  if (row.name) actions.appendChild(button('×', 'btn-small btn-clear', () => post({ type: 'unbind', role: row.role })));
  node.append(preview(row), info, actions);
  if (row.candidates?.length) {
    const slots = element('div', 'slots');
    for (const slot of ROLE_SLOTS[row.role]) slots.appendChild(slotPicker(row, slot, post));
    node.appendChild(slots);
  }
  return node;
}

export function renderBindings(container: HTMLElement, rows: BindingRow[], post: Post): void {
  for (const url of previews) URL.revokeObjectURL(url);
  previews = [];
  const sections = Object.entries(GROUPS).map(([prefix, title]) => {
    const section = element('section', 'binding-group');
    section.appendChild(element('h3', '', title));
    for (const row of rows.filter((item) => item.role.startsWith(`${prefix}.`))) section.appendChild(rowElement(row, post));
    return section;
  });
  container.replaceChildren(...sections);
}
