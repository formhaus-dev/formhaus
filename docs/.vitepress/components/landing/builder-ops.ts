import { newOption, newPage, newQuestion, setType, type BuilderBlock, type BuilderForm, type BuilderPage, type BuilderQuestion } from './builder-model';

const isPage = (block: BuilderBlock | undefined): block is BuilderPage => block?.kind === 'page';

export function pageSpan(form: BuilderForm, index: number): number {
  let end = index + 1;
  while (end < form.blocks.length && !isPage(form.blocks[end])) end++;
  return end - index;
}

export function insertQuestion(form: BuilderForm, at: number): BuilderQuestion {
  const question = newQuestion();
  form.blocks.splice(at, 0, question);
  return question;
}

export function insertPage(form: BuilderForm, at: number): BuilderPage {
  const flat = !isPage(form.blocks[0]);
  const page = newPage(flat ? 'Page 2' : '');
  if (at > 0 && flat) {
    form.blocks.unshift(newPage('Page 1'));
    at += 1;
  }
  form.blocks.splice(at, 0, page);
  return page;
}

export function convertToPage(form: BuilderForm, index: number): BuilderPage {
  const page = newPage();
  form.blocks.splice(index, 1, page);
  if (index > 0 && !isPage(form.blocks[0])) form.blocks.unshift(newPage());
  return page;
}

export function pageCount(form: BuilderForm): number {
  return form.blocks.filter(isPage).length;
}

export function canRemove(form: BuilderForm, index: number): boolean {
  if (isPage(form.blocks[index])) return true;
  return form.blocks.filter((item) => item.kind === 'question').length > 1;
}

export function removeBlock(form: BuilderForm, index: number): boolean {
  if (!canRemove(form, index)) return false;
  const block = form.blocks[index];
  const removed = form.blocks.splice(index, isPage(block) && pageCount(form) > 1 ? pageSpan(form, index) : 1);
  const gone = new Set(removed.map((item) => item.uid));
  const goneIds = new Set(removed.filter(isPage).map((item) => item.id ?? item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')));
  for (const item of form.blocks) {
    if (item.kind === 'page') {
      if (item.next && gone.has(item.next)) item.next = null;
      if (item.routes?.some((route) => route.to && goneIds.has(route.to))) delete item.routes;
      continue;
    }
    for (const option of item.options) if (option.jump && gone.has(option.jump)) option.jump = null;
  }
  if (form.blocks.length && !form.blocks.some((item) => item.kind === 'question')) form.blocks.push(newQuestion());
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
    return true;
  }
  const span = pageSpan(form, index);
  if (delta > 0) {
    const next = index + span;
    const nextSpan = pageSpan(form, next);
    list.splice(index, 0, ...list.splice(next, nextSpan));
  } else {
    let prev = index - 1;
    while (prev > 0 && !isPage(list[prev])) prev--;
    list.splice(prev, 0, ...list.splice(index, span));
  }
  return true;
}

export function outdent(form: BuilderForm, index: number, position: number): BuilderQuestion | undefined {
  const block = form.blocks[index];
  if (block?.kind !== 'question') return undefined;
  const [option] = block.options.splice(position, 1);
  if (!option) return undefined;
  if (!block.options.length) block.type = 'text';
  const question = newQuestion();
  question.label = option.label;
  form.blocks.splice(index + 1, 0, question);
  return question;
}

export function startOptions(form: BuilderForm, index: number, type: 'radio' | 'multiselect'): BuilderQuestion | undefined {
  const block = form.blocks[index];
  const prev = form.blocks[index - 1];
  if (block?.kind !== 'question') return undefined;
  if (prev?.kind === 'question') {
    form.blocks.splice(index, 1);
    if (prev.options.length) prev.options.push(newOption());
    else prev.options = [newOption()];
    prev.type = type;
    return prev;
  }
  setType(block, type);
  return block;
}
