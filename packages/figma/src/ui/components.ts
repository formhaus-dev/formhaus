import type { BindingRow } from '../bindings/rows';
import type { SelectionPreview } from '../bindings/selection-preview';
import type { TextSlot } from '../config';
import type { Role } from '../roles';
import { renderCards } from './cards';
import { coverageOf, renderCoverage } from './coverage';
import { byId } from './dom';
import { createProfilesBar } from './profiles';
import { closeSheet, openSheet } from './sheet';
import type { Profile } from '../profiles';
import { renderTray } from './tray';

type Post = (message: Record<string, unknown>) => void;

const KIT_NAMES: Record<string, string> = { material: 'Material 3', ios: 'iOS-like' };

export function createComponentsPanel(post: Post, show: (text: string, tone?: 'error' | 'success' | 'info') => void) {
  const profilesBar = createProfilesBar(post, show);
  const list = byId('bindings');
  const tray = byId('tray');
  let rows: BindingRow[] = [];
  let selection: SelectionPreview | null = null;
  let kitName = KIT_NAMES.material;
  let openRole: Role | null = null;

  const bind = (role: Role) => post({ type: 'bindSelection', role });
  const changeSlot = (row: BindingRow, slot: TextSlot, name: string) => post({ type: 'setSlot', role: row.role, slot, name });
  const handlers = {
    bind,
    unbind: (role: Role) => post({ type: 'unbind', role }),
    editSlots: (row: BindingRow) => {
      openRole = row.role;
      openSheet(row, changeSlot);
    },
    canBind: () => Boolean(selection),
  };

  function render(): void {
    renderCoverage(rows, kitName);
    renderCards(list, rows, kitName, handlers);
    const open = openRole && document.getElementById('sheet')?.classList.contains('is-open') ? rows.find((row) => row.role === openRole) : null;
    if (open?.candidates?.length) openSheet(open, changeSlot);
    else if (openRole) {
      closeSheet();
      openRole = null;
    }
  }

  renderTray(tray, null, bind);
  return {
    setRows(next: BindingRow[], profiles: Profile[] = [], focusProfile?: string) {
      rows = next;
      render();
      profilesBar.update(profiles, rows.some((row) => coverageOf(row) === 'yours'), focusProfile);
    },
    setSelection(next: SelectionPreview | null) {
      selection = next;
      renderTray(tray, next, bind);
    },
    setKit(id?: string) {
      kitName = KIT_NAMES[id ?? 'material'] ?? kitName;
      if (rows.length > 0) render();
    },
  };
}
