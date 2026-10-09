import type { KitFonts } from '../fonts';
import type { IconName } from '../icons';
import { BUTTON_ROLES, type ButtonRole, type Role } from '../roles';
import { component, emptyAndFilled, type KitNode } from './primitives';

type Build = (root: ComponentNode) => void;
type ControlRole = 'field.checkbox' | 'field.switch' | 'option.radio' | 'option.checkbox';
type InputRole = Exclude<Role, ControlRole | ButtonRole>;

export interface KitParts {
  version: number;
  selectIcon: IconName;
  input(fonts: KitFonts, trailing: IconName | undefined, multiline: boolean, filled: boolean): Build;
  controls: Record<ControlRole, (fonts: KitFonts) => Build>;
  button(fonts: KitFonts, primary: boolean): Build;
}

const INPUTS: Record<InputRole, { trailing?: IconName | 'select'; multiline?: boolean }> = {
  'field.text': {},
  'field.select': { trailing: 'select' },
  'field.date': { trailing: 'calendar' },
  'field.file': { trailing: 'upload' },
  'field.textarea': { multiline: true },
};

function isButton(role: Role): role is ButtonRole {
  return (BUTTON_ROLES as readonly Role[]).includes(role);
}

function isInput(role: Role): role is InputRole {
  return role in INPUTS;
}

export function buildRole(parts: KitParts, role: Role, fonts: KitFonts): KitNode {
  if (isInput(role)) {
    const input = INPUTS[role];
    const trailing = input.trailing === 'select' ? parts.selectIcon : input.trailing;
    return emptyAndFilled(role, parts.version, (filled) => parts.input(fonts, trailing, Boolean(input.multiline), filled));
  }
  const build = isButton(role) ? parts.button(fonts, role === 'button.primary') : parts.controls[role](fonts);
  return component(role, role, parts.version, build);
}
