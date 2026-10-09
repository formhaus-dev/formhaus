import { ROLES, type Role } from '../roles';
import { matchRole } from './auto-match';
import { thumbnail } from './rows';
import { componentFromSelection } from './selection';

export interface SelectionPreview {
  name: string;
  role?: Role;
  thumbnail?: Uint8Array;
}

export async function selectionPreview(selection: readonly SceneNode[]): Promise<SelectionPreview | null> {
  if (selection.length !== 1) return null;
  const { binding } = await componentFromSelection(selection).catch(() => ({ binding: null }));
  if (!binding?.name) return null;
  const role = ROLES.find((candidate) => matchRole(candidate, [binding.name!]) === 0);
  return { name: binding.name, role, thumbnail: await thumbnail(selection[0]) };
}
