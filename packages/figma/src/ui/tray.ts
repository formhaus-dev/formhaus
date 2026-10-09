import type { SelectionPreview } from '../bindings/selection-preview';
import { ROLE_LABELS, type Role } from '../roles';
import { DRAG_TYPE } from './cards';
import { element, previewStore } from './dom';
import { icon } from './icons';

const store = previewStore();

function empty(): HTMLElement[] {
  const glyph = element('span', 'tray-icon');
  glyph.appendChild(icon('pointer', 20));
  const text = element('div', 'tray-text');
  text.append(element('div', 'tray-title', 'Select a component on the canvas'), element('div', 'tray-sub', 'Then drag it onto a card, or click the card.'));
  return [glyph, text];
}

function chip(item: SelectionPreview): HTMLElement {
  const node = element('div', 'tray-chip');
  node.draggable = true;
  node.title = 'Drag onto a card';
  node.addEventListener('dragstart', (event) => {
    event.dataTransfer?.setData(DRAG_TYPE, item.name);
    document.body.classList.add('is-dragging');
  });
  node.addEventListener('dragend', () => document.body.classList.remove('is-dragging'));
  const handle = element('span', 'tray-handle');
  handle.appendChild(icon('drag'));
  const thumb = element('div', 'tray-thumb');
  if (item.thumbnail) {
    const image = element('img');
    image.src = store.url(item.thumbnail);
    image.alt = '';
    image.draggable = false;
    thumb.appendChild(image);
  }
  const text = element('div', 'tray-text');
  const hint = item.role ? `Looks like ${ROLE_LABELS[item.role]}` : 'Drag onto a card';
  text.append(element('div', 'tray-title', item.name), element('div', 'tray-sub', hint));
  node.append(handle, thumb, text);
  return node;
}

export function renderTray(container: HTMLElement, item: SelectionPreview | null, bind: (role: Role) => void): void {
  store.release();
  container.classList.toggle('is-empty', !item);
  document.body.classList.toggle('has-selection', Boolean(item));
  if (!item) {
    container.replaceChildren(...empty());
    return;
  }
  const parts: HTMLElement[] = [chip(item)];
  if (item.role) {
    const role = item.role;
    const action = element('button', 'btn btn-primary btn-small', `Bind as ${ROLE_LABELS[role]}`);
    action.type = 'button';
    action.onclick = () => bind(role);
    parts.push(action);
  }
  container.replaceChildren(...parts);
}
