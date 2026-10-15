import { isPage, isQuestion, type BuilderForm, type BuilderPage, type BuilderQuestion } from '../model';

export const blockIndex = (form: BuilderForm, uid: string) => form.blocks.findIndex((block) => block.uid === uid);

export function findField(form: BuilderForm, uid: string): BuilderQuestion | undefined {
  const block = form.blocks.find((item) => item.uid === uid);
  return isQuestion(block) ? block : undefined;
}

export function findStep(form: BuilderForm, uid: string): BuilderPage | undefined {
  const block = form.blocks.find((item) => item.uid === uid);
  return isPage(block) ? block : undefined;
}

export function stepOf(form: BuilderForm, uid: string): BuilderPage | undefined {
  for (let index = blockIndex(form, uid); index >= 0; index--) {
    const block = form.blocks[index];
    if (isPage(block)) return block;
  }
  return undefined;
}

export function stepEnd(form: BuilderForm, stepUid: string | null): number {
  if (stepUid === null) {
    const first = form.blocks.findIndex(isPage);
    return first < 0 ? form.blocks.length : first;
  }
  let index = blockIndex(form, stepUid);
  if (index < 0) return form.blocks.length;
  for (index += 1; index < form.blocks.length && !isPage(form.blocks[index]); index++);
  return index;
}

export function stepFields(form: BuilderForm, stepUid: string | null): BuilderQuestion[] {
  const start = stepUid === null ? 0 : blockIndex(form, stepUid) + 1;
  const result: BuilderQuestion[] = [];
  for (let index = start; index < form.blocks.length && !isPage(form.blocks[index]); index++) {
    result.push(form.blocks[index] as BuilderQuestion);
  }
  return result;
}
