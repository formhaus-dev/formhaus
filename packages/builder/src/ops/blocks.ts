import { syncIdentifiers } from '../identifiers';
import { dropReferences } from '../references';
import { isPage, isQuestion, newQuestion, span, type BuilderForm, type BuilderPage } from '../model';

export function pageSpan(form: BuilderForm, index: number): number {
  let end = index + 1;
  while (end < form.blocks.length && !isPage(form.blocks[end])) end++;
  return end - index;
}

export function pageCount(form: BuilderForm): number {
  return form.blocks.filter(isPage).length;
}

export function canRemove(form: BuilderForm, index: number): boolean {
  const block = form.blocks[index];
  if (isPage(block)) return true;
  const siblings = isQuestion(block) && block.parent ? form.blocks.filter((item) => isQuestion(item) && item.parent === block.parent) : [];
  if (siblings.length === 1) return false;
  return form.blocks.filter(isQuestion).length > span(form, index);
}

export function clearTargets(form: BuilderForm, gone: Set<string>): void {
  const goneIds = new Set(form.blocks.filter((item): item is BuilderPage => isPage(item) && gone.has(item.uid)).map((item) => item.id));
  for (const item of form.blocks) {
    if (isPage(item)) {
      if (item.next && gone.has(item.next)) item.next = null;
      const routes = item.routes?.filter((route) => !route.to || !goneIds.has(route.to));
      if (routes?.length) item.routes = routes;
      else delete item.routes;
      continue;
    }
    for (const option of item.options) if (option.jump && gone.has(option.jump)) option.jump = null;
  }
}

export function removeBlock(form: BuilderForm, index: number): boolean {
  if (!canRemove(form, index)) return false;
  const block = form.blocks[index];
  const size = isPage(block) ? (pageCount(form) > 1 ? pageSpan(form, index) : 1) : span(form, index);
  const removed = form.blocks.slice(index, index + size);
  const gone = new Set(removed.map((item) => item.uid));
  clearTargets(form, gone);
  dropReferences(form, gone);
  form.blocks.splice(index, size);
  if (form.blocks.length && !form.blocks.some(isQuestion)) form.blocks.push(newQuestion(form));
  syncIdentifiers(form);
  return true;
}

export function canMove(form: BuilderForm, index: number, delta: -1 | 1): boolean {
  const block = form.blocks[index];
  if (isPage(block)) {
    if (delta < 0) return index > 0;
    return index + pageSpan(form, index) < form.blocks.length;
  }
  const target = index + delta;
  if (target < 0 || target >= form.blocks.length) return false;
  return !(delta < 0 && target === 0 && isPage(form.blocks[0]));
}

export function moveBlock(form: BuilderForm, index: number, delta: -1 | 1): boolean {
  if (!canMove(form, index, delta)) return false;
  const list = form.blocks;
  if (!isPage(list[index])) {
    list.splice(index + delta, 0, ...list.splice(index, 1));
  } else if (delta > 0) {
    const span = pageSpan(form, index);
    const next = index + span;
    list.splice(index, 0, ...list.splice(next, pageSpan(form, next)));
  } else {
    let prev = index - 1;
    while (prev > 0 && !isPage(list[prev])) prev--;
    list.splice(prev, 0, ...list.splice(index, pageSpan(form, index)));
  }
  syncIdentifiers(form);
  return true;
}

export function moveTo(form: BuilderForm, from: number, at: number): boolean {
  const list = form.blocks;
  const span = isPage(list[from]) ? pageSpan(form, from) : 1;
  if (at >= from && at <= from + span) return false;
  if (!isPage(list[from]) && at === 0 && isPage(list[0])) return false;
  const taken = list.splice(from, span);
  list.splice(at > from ? at - span : at, 0, ...taken);
  syncIdentifiers(form);
  return true;
}

export function moveItem<T>(list: T[], from: number, at: number): boolean {
  if (at === from || at === from + 1) return false;
  const [item] = list.splice(from, 1);
  list.splice(at > from ? at - 1 : at, 0, item);
  return true;
}
