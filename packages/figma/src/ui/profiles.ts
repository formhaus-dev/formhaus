import type { Profile } from '../profiles';
import { byId, element } from './dom';
import { decodeProfile, encodeProfile } from './profile-code';

type Post = (message: Record<string, unknown>) => void;
type Show = (text: string, tone?: 'error' | 'success' | 'info') => void;
type Mode = 'idle' | 'save' | 'paste' | 'copy' | 'delete';

function button(label: string, className: string, onClick: () => void): HTMLButtonElement {
  const node = element('button', className, label);
  node.type = 'button';
  node.onclick = onClick;
  return node;
}

function field(placeholder: string, value: string, onInput?: (value: string) => void): HTMLInputElement {
  const node = element('input', 'input');
  node.placeholder = placeholder;
  node.value = value;
  node.setAttribute('aria-label', placeholder);
  if (onInput) node.oninput = () => onInput(node.value);
  return node;
}

export function createProfilesBar(post: Post, show: Show) {
  const root = byId('profiles');
  let profiles: Profile[] = [];
  let selected = '';
  let mode: Mode = 'idle';
  let canSave = false;
  const drafts = { name: 'My design system', code: '' };

  function current(): Profile | undefined {
    return profiles.find((item) => item.id === selected);
  }

  function inline(content: HTMLElement, action: HTMLButtonElement): HTMLElement {
    const row = element('div', 'profile-inline');
    if (content instanceof HTMLInputElement) content.onkeydown = (event) => event.key === 'Enter' && action.click();
    row.append(content, action, button('Cancel', 'btn btn-secondary btn-small', () => setMode('idle')));
    return row;
  }

  function copyRow(profile: Profile): HTMLElement {
    const input = field('Setup code', encodeProfile(profile));
    input.readOnly = true;
    return inline(input, button('Copy', 'btn btn-primary btn-small', () => {
      input.select();
      const copied = document.execCommand('copy');
      show(copied ? 'Setup code copied. Share it with a teammate.' : 'Select the code and copy it with Cmd+C.', copied ? 'success' : 'info');
    }));
  }

  function extra(): HTMLElement | null {
    const profile = current();
    if (mode === 'save') {
      return inline(field('Design system name', drafts.name, (value) => { drafts.name = value; }), button('Save', 'btn btn-primary btn-small', () => {
        post({ type: 'saveProfile', name: drafts.name });
        drafts.name = 'My design system';
        setMode('idle');
      }));
    }
    if (mode === 'paste') {
      return inline(field('Paste a setup code', drafts.code, (value) => { drafts.code = value; }), button('Add', 'btn btn-primary btn-small', () => {
        try {
          post({ type: 'importProfile', profile: decodeProfile(drafts.code) });
          drafts.code = '';
          setMode('idle');
        } catch {
          show('That setup code is not valid.', 'error');
        }
      }));
    }
    if (mode === 'delete' && profile) {
      return inline(element('span', 'hint grow', `Delete “${profile.name}” from your saved design systems?`), button('Delete', 'btn btn-secondary btn-small link-danger', () => {
        post({ type: 'deleteProfile', id: selected });
        setMode('idle');
      }));
    }
    return mode === 'copy' && profile ? copyRow(profile) : null;
  }

  function picker(): HTMLElement {
    const row = element('div', 'profile-row');
    const select = element('select');
    select.setAttribute('aria-label', 'Saved design system');
    for (const profile of profiles) {
      const option = element('option', '', profile.useInNewFiles ? `${profile.name} · new files` : profile.name);
      option.value = profile.id;
      select.appendChild(option);
    }
    select.value = selected;
    select.onchange = () => { selected = select.value; setMode('idle'); };
    row.append(select, button('Use here', 'btn btn-primary btn-small', () => post({ type: 'applyProfile', id: selected })));
    return row;
  }

  function saveAndPaste(label: string, className: string): HTMLElement {
    const row = element('div', className);
    const save = button(label, 'link', () => setMode('save'));
    save.disabled = !canSave;
    row.append(save, button('Paste setup code', 'link', () => setMode('paste')));
    return row;
  }

  function actions(profile: Profile): HTMLElement {
    const row = element('div', 'profile-actions');
    const toggle = element('label', 'profile-check');
    const box = element('input');
    box.type = 'checkbox';
    box.checked = Boolean(profile.useInNewFiles);
    box.onchange = () => post({ type: 'toggleNewFiles', id: profile.id });
    toggle.append(box, document.createTextNode('Use in new files'));
    row.append(toggle, button('Copy setup code', 'link', () => setMode('copy')), button('Delete', 'link link-danger', () => setMode('delete')));
    return row;
  }

  function render(): void {
    const head = element('div', 'profile-head');
    head.appendChild(element('div', 'section-label', 'Design system'));
    const profile = current();
    if (!profile) head.appendChild(element('div', 'hint', 'Save these bindings to reuse them in other files, or paste a setup code from a teammate.'));
    const parts = profile
      ? [head, picker(), actions(profile), saveAndPaste('Save current as new', 'profile-actions secondary'), extra()]
      : [head, saveAndPaste('Save as design system', 'profile-actions'), extra()];
    root.replaceChildren(...parts.filter((node): node is HTMLElement => Boolean(node)));
  }

  function setMode(next: Mode): void {
    mode = next;
    render();
    const target = root.querySelector<HTMLElement>('.profile-inline .input, .profile-inline .btn') ?? root.querySelector<HTMLElement>('select, .link');
    target?.focus();
  }

  return {
    update(next: Profile[], hasBindings: boolean, focusId?: string) {
      profiles = next;
      canSave = hasBindings;
      if (focusId && profiles.some((item) => item.id === focusId)) selected = focusId;
      if (!current()) selected = profiles.find((item) => item.useInNewFiles)?.id ?? profiles[0]?.id ?? '';
      render();
    },
  };
}
