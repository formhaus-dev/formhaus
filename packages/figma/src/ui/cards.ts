import type { BindingRow } from '../bindings/rows';
import { ROLE_LABELS, type Role } from '../roles';
import { coverageOf, type Coverage } from './coverage';
import { element, iconButton, previewStore } from './dom';
import { icon } from './icons';

export interface CardHandlers {
  bind(role: Role): void;
  unbind(role: Role): void;
  editSlots(row: BindingRow): void;
  canBind(): boolean;
}

const GROUPS: Record<string, string> = { field: 'Fields', option: 'Options', button: 'Buttons' };
export const DRAG_TYPE = 'application/x-formhaus-selection';
const store = previewStore();

const BADGES = { yours: 'Yours', reused: 'Substitute', kit: 'Not set', missing: 'Missing' };

function preview(row: BindingRow): HTMLElement {
  const frame = element('div', 'card-preview');
  if (row.thumbnail) {
    const image = element('img');
    image.src = store.url(row.thumbnail);
    image.alt = '';
    image.draggable = false;
    frame.appendChild(image);
  } else {
    frame.appendChild(element('span', 'card-empty', row.missing ? 'Component not found' : 'No preview yet'));
  }
  return frame;
}

function subtitle(row: BindingRow, kitName: string): string {
  if (row.missing) return 'Select it again or clear it';
  if (row.via) return `Uses your ${ROLE_LABELS[row.via]}`;
  return row.name ?? `Renders with ${kitName}`;
}

function acceptSelection(card: HTMLElement, role: Role, handlers: CardHandlers): void {
  card.addEventListener('dragover', (event) => {
    if (!event.dataTransfer?.types.includes(DRAG_TYPE)) return;
    event.preventDefault();
    card.classList.add('is-target');
  });
  card.addEventListener('dragleave', () => card.classList.remove('is-target'));
  card.addEventListener('drop', (event) => {
    card.classList.remove('is-target');
    if (!event.dataTransfer?.types.includes(DRAG_TYPE)) return;
    event.preventDefault();
    handlers.bind(role);
  });
}

function placeOnCanvas(card: HTMLElement, role: Role): void {
  card.draggable = true;
  card.addEventListener('dragstart', (event) => event.dataTransfer?.setData('text/plain', role));
  card.addEventListener('dragend', (event) => {
    if (event.view && event.view.length === 0) return;
    parent.postMessage({ pluginDrop: { clientX: event.clientX, clientY: event.clientY, items: [], dropMetadata: { role } } }, '*');
  });
}

function card(row: BindingRow, kitName: string, handlers: CardHandlers): HTMLElement {
  const state = coverageOf(row);
  const node = element('article', `card cov-${state}`);
  node.dataset.role = row.role;
  const head = element('div', 'card-head');
  head.append(element('div', 'card-title', ROLE_LABELS[row.role]), element('span', `badge cov-${state}`, BADGES[state]));
  const body = element('div', 'card-body');
  body.append(head, element('div', 'card-sub', subtitle(row, kitName)));
  if (state === 'kit') body.appendChild(element('div', 'card-hint', 'Select your component, then click this card'));
  if (row.staleProperties) {
    const warning = element('div', 'card-warning');
    warning.append(icon('warning', 12), document.createTextNode(`Missing ${row.staleProperties.join(', ')}. Bind again.`));
    body.appendChild(warning);
  }
  const actions = element('div', row.candidates?.length || (row.name && !row.via) ? 'card-actions' : 'card-actions only-bind');
  actions.appendChild(iconButton('link', 'Bind the selected component', () => handlers.bind(row.role), 'icon-btn bind-btn'));
  if (row.candidates?.length) actions.appendChild(iconButton('tune', 'Text slots', () => handlers.editSlots(row)));
  if (row.name && !row.via) actions.appendChild(iconButton('close', 'Clear binding', () => handlers.unbind(row.role)));
  const overlay = element('div', 'card-overlay');
  const pill = element('span', 'overlay-pill');
  pill.append(icon('link'), document.createTextNode('Bind selection'));
  overlay.appendChild(pill);
  node.append(preview(row), body, actions, overlay);
  node.tabIndex = 0;
  node.setAttribute('aria-label', `${ROLE_LABELS[row.role]}: ${BADGES[state]}`);
  node.onclick = () => handlers.canBind() && handlers.bind(row.role);
  node.onkeydown = (event) => {
    if (event.target !== node || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    if (handlers.canBind()) handlers.bind(row.role);
  };
  acceptSelection(node, row.role, handlers);
  placeOnCanvas(node, row.role);
  return node;
}

function grid(rows: BindingRow[], kitName: string, handlers: CardHandlers): HTMLElement {
  const node = element('div', 'grid');
  for (const row of rows) node.appendChild(card(row, kitName, handlers));
  return node;
}

function section(title: string, note: string, children: HTMLElement[]): HTMLElement {
  const node = element('section', 'group');
  const header = element('header', 'group-header');
  header.append(element('h3', '', title), element('span', 'group-count', note));
  node.append(header, ...children);
  return node;
}

function setupSection(rows: BindingRow[], kitName: string, handlers: CardHandlers): HTMLElement | null {
  if (rows.length === 0) return null;
  return section('Needs setup', `${rows.length} left`, [
    element('p', 'hint', `These still render with ${kitName}. Select your component on the canvas and click a card, or drag the bar above onto it.`),
    grid(rows, kitName, handlers),
  ]);
}

function substituteSection(rows: BindingRow[], kitName: string, handlers: CardHandlers): HTMLElement | null {
  if (rows.length === 0) return null;
  return section('Using a substitute', `${rows.length}`, [
    element('p', 'hint', 'These render with a similar component of yours. Bind a dedicated one if your library has it.'),
    grid(rows, kitName, handlers),
  ]);
}

function boundSection(rows: BindingRow[], kitName: string, handlers: CardHandlers): HTMLElement {
  const groups = Object.entries(GROUPS)
    .map(([prefix, title]) => ({ title, items: rows.filter((row) => row.role.startsWith(`${prefix}.`)) }))
    .filter((group) => group.items.length > 0)
    .map((group) => section(group.title, '', [grid(group.items, kitName, handlers)]));
  const node = element('div', 'covered');
  if (groups.length > 0) node.append(element('h2', 'covered-title', 'Bound'), ...groups);
  return node;
}

export function renderCards(container: HTMLElement, rows: BindingRow[], kitName: string, handlers: CardHandlers): void {
  store.release();
  const by = (...states: Coverage[]) => rows.filter((row) => states.includes(coverageOf(row)));
  const done = by('yours').length === rows.length ? element('div', 'all-covered', 'Every element has its own component.') : null;
  const parts = [done, setupSection(by('kit', 'missing'), kitName, handlers), substituteSection(by('reused'), kitName, handlers), boundSection(by('yours'), kitName, handlers)];
  container.replaceChildren(...parts.filter((node): node is HTMLElement => Boolean(node)));
}

