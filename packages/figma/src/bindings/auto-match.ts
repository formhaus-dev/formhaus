import { PLUGIN_NAMESPACE, type Binding } from '../config';
import { asComponent } from '../renderers/resolve';
import type { Role } from '../roles';
import { reference } from './selection';

interface Rule {
  match: RegExp;
  exclude?: RegExp;
  prefer?: RegExp;
}

interface Candidate {
  name: string;
  component: ComponentNode;
}

const NOT_A_FIELD = /\b(icons?|avatar|badge|banner|card|chip|tag|menu|nav|tabs?|tooltip|colou?r)\b/i;
const SECONDARY = /secondary|outlined?|tonal|ghost|tertiary/i;

const RULES: Record<Role, Rule> = {
  'field.textarea': { match: /text ?area|multi-?line/i },
  'field.select': { match: /\bselect\b|dropdown|\bcombo ?box/i },
  'field.date': { match: /\bdate\b|date ?picker|datepicker|calendar input/i },
  'field.file': { match: /\bfile\b|upload/i },
  'field.text': { match: /text ?field|text ?input|\binput\b|textbox/i, exclude: /area|multi|select|date|file|check|radio|search|otp|pin/i },
  'field.checkbox': { match: /check ?box/i },
  'field.switch': { match: /\bswitch\b|\btoggle\b/i },
  'option.radio': { match: /\bradio\b/i },
  'option.checkbox': { match: /check ?box/i },
  'button.primary': { match: /\bbutton\b|\bbtn\b/i, exclude: /icon|radio|toggle|text button|fab|split/i, prefer: /primary|filled|main|default/i },
  'button.secondary': { match: /\bbutton\b|\bbtn\b/i, exclude: /icon|radio|toggle|text button|fab|split/i, prefer: SECONDARY },
};

export function matchRole(role: Role, names: string[]): number {
  const rule = RULES[role];
  const allowed = names
    .map((name, index) => ({ name, index }))
    .filter(({ name }) => rule.match.test(name) && !rule.exclude?.test(name) && !NOT_A_FIELD.test(name));
  if (role === 'button.secondary') return allowed.find(({ name }) => SECONDARY.test(name))?.index ?? -1;
  const usable = role === 'button.primary' ? allowed.filter(({ name }) => !SECONDARY.test(name)) : allowed;
  const preferred = rule.prefer ? usable.find(({ name }) => rule.prefer!.test(name)) : undefined;
  return (preferred ?? usable[0])?.index ?? -1;
}

function candidates(page: PageNode): Candidate[] {
  return page.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] })
    .filter((node) => node.parent?.type !== 'COMPONENT_SET' && !node.getSharedPluginData(PLUGIN_NAMESPACE, 'kitVersion'))
    .flatMap((node) => [
      { name: node.name, component: asComponent(node) },
      ...(node.type === 'COMPONENT_SET' ? node.children.map((variant) => ({ name: `${node.name} / ${variant.name}`, component: variant as ComponentNode })) : []),
    ]);
}

export function autoMatch(page: PageNode, bound: Partial<Record<Role, Binding>>): Partial<Record<Role, Binding>> {
  const found = candidates(page);
  const names = found.map((candidate) => candidate.name);
  const matches: Partial<Record<Role, Binding>> = {};
  for (const role of Object.keys(RULES) as Role[]) {
    if (bound[role]) continue;
    const index = matchRole(role, names);
    if (index >= 0) matches[role] = reference(found[index].component);
  }
  return matches;
}
