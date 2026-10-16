import type { FormField, FormStep } from '../types';
import { conditionFields, isGroup, valueFields } from '../visibility/nodes';
import type { createStartValues } from './start-values';
import type { createActivePath } from './step-routes';
import type { DefinitionIndex } from './visibility-index';

type Values = Record<string, unknown>;

interface HiddenView {
  path: ReturnType<typeof createActivePath>;
  starts: ReturnType<typeof createStartValues>;
  activeField: (key: string, values: Values) => FormField | undefined;
  onPath: (field: FormField, values: Values) => boolean;
  visible: (source: FormField | FormStep, values: Values) => boolean;
  owner: (key: string) => string;
  settle: (values: Values, errors: Record<string, string>, cleared: Set<string>) => void;
}

export function createHiddenQueue(
  { allFields, fieldsByKey, fieldDependents, routeFields, stepDependents, stepOfField, sectionOf }: DefinitionIndex,
  { path, starts, activeField, onPath, visible, owner, settle }: HiddenView,
) {
  const order = [...new Set([...fieldDependents.keys(), ...stepDependents.keys()])];
  const position = new Map(order.map((key, index) => [key, index]));
  const sources = (field: FormField) =>
    [field, sectionOf.get(field), stepOfField.get(field), ...(isGroup(field) ? field.fields : [])].flatMap((source) =>
      source ? conditionFields(source) : [],
    );
  const duplicates = new Set([...fieldsByKey.keys()].filter((key) => fieldsByKey.get(key)!.length > 1));
  const groupKeys = new Set(allFields.filter(isGroup).map(({ key }) => key));
  const waiting = new Set<string>();
  let settled = false;

  const downstream = (key: string): Set<FormField> | undefined => {
    const fields = new Set<FormField>();
    const keys = new Set([key]);
    for (const next of keys) {
      if (routeFields.has(next) || stepDependents.has(next)) return undefined;
      for (const field of fieldsByKey.get(next) ?? []) fields.add(field);
      for (const field of fieldDependents.get(next) ?? []) keys.add(field.key);
    }
    return fields;
  };

  return {
    unsettle(): void {
      settled = false;
    },

    reconcile(values: Values, errors: Record<string, string>, initial: boolean, written?: string): Set<string> {
      if (written === undefined || !path.patch(values, written)) path.invalidate();
      const held = (key: string) => values[key] !== undefined || errors[key] !== undefined;
      const fields = !initial && written !== undefined && settled && [...waiting].every(held) ? downstream(written) : undefined;
      const keys = fields ? [...new Set([...fields].flatMap(sources))].sort((a, b) => position.get(a)! - position.get(b)!) : order;
      const queue = [...keys];
      const queued = new Set(queue);
      const cleared = new Set<string>();
      const mark = (key: string) => {
        if (!path.patch(values, key)) path.invalidate();
        cleared.add(key);
        for (const next of routeFields.has(key) ? [...order, key] : [key]) {
          if (queued.has(next)) continue;
          queued.add(next);
          queue.push(next);
        }
      };
      const clear = (key: string) => {
        starts.remember(key, values[key]);
        delete values[key];
        delete errors[key];
        if (groupKeys.has(key)) for (const errorKey of Object.keys(errors)) if (owner(errorKey) === key) delete errors[errorKey];
        mark(key);
      };
      const update = (field: FormField, shown: boolean, dry: boolean): boolean => {
        const { key } = field;
        if (dry) {
          waiting.delete(key);
          if (values[key] === undefined && errors[key] !== undefined) waiting.add(key);
        }
        const shared = duplicates.has(key);
        const active = shared && activeField(key, values);
        if (active && active !== field) return false;
        if (!shown) {
          const hidden = held(key);
          if (hidden && !dry) clear(key);
          return hidden;
        }
        if (held(key) || !(shared ? active : onPath(field, values) && visible(field, values))) return false;
        const value = starts.startValue(field);
        if (value === undefined || dry) return value !== undefined;
        values[key] = value;
        starts.seedItems(value);
        mark(key);
        return true;
      };
      const visit = (key: string, dry: boolean) => {
        let acted = false;
        for (const field of fieldDependents.get(key) ?? [])
          if ((!fields || fields.has(field)) && onPath(field, values)) acted = update(field, visible(field, values), dry) || acted;
        for (const step of stepDependents.get(key) ?? [])
          for (const field of valueFields(step.fields))
            if (!fields || fields.has(field)) acted = update(field, visible(step, values), dry) || acted;
        return acted;
      };
      for (let index = 0; index < queue.length; index++) {
        queued.delete(queue[index]);
        visit(queue[index], false);
      }
      settle(values, errors, cleared);
      if (!fields) waiting.clear();
      settled = !keys.some((key) => visit(key, true));
      return cleared;
    },
  };
}
