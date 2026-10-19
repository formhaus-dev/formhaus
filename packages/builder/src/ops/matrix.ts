import { syncIdentifiers } from '../identifiers';
import { clone, newOption, setType, uid, type BuilderForm, type BuilderQuestion } from '../model';
import { bindReferences } from '../references';
import { childrenOf, findField } from './locate';

export const MATRIX_COLUMNS = ['Strongly disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly agree'];

const isRow = (item: BuilderQuestion) => item.type === 'radio' || item.type === 'multiselect';

export const isMatrix = (item: BuilderQuestion | undefined): item is BuilderQuestion =>
  item?.type === 'section' && (item.extra as { layout?: string }).layout === 'matrix';

export function matrixOf(form: BuilderForm, rowUid: string): BuilderQuestion | undefined {
  const parent = findField(form, findField(form, rowUid)?.parent ?? '');
  return isMatrix(parent) ? parent : undefined;
}

function copyColumns(form: BuilderForm, source: BuilderQuestion, row: BuilderQuestion): void {
  if (!isRow(row)) setType(form, row, 'radio');
  row.options = source.options.map((option, index) => ({ ...clone(option), uid: row.options[index]?.uid ?? uid(form), jump: null }));
}

export function syncMatrix(form: BuilderForm, sectionUid: string, sourceUid?: string): void {
  const section = findField(form, sectionUid);
  if (!isMatrix(section)) return;
  const rows = childrenOf(form, section.uid);
  for (const row of rows) delete row.extra.columns;
  const source = rows.find((row) => row.uid === sourceUid && isRow(row)) ?? rows.find(isRow);
  if (!source) return;
  const restore = bindReferences(form);
  for (const row of rows) if (row !== source) copyColumns(form, source, row);
  restore();
}

export function syncRow(form: BuilderForm, rowUid: string): void {
  const section = matrixOf(form, rowUid);
  if (section) syncMatrix(form, section.uid, rowUid);
}

export function matrixColumns(form: BuilderForm, sectionUid: string): string[] {
  const first = childrenOf(form, sectionUid).find(isRow);
  return first ? first.options.map((option) => option.label) : [];
}

export function setMatrixColumns(form: BuilderForm, sectionUid: string, labels: string[]): void {
  const section = findField(form, sectionUid);
  const rows = section ? childrenOf(form, section.uid) : [];
  const first = rows.find(isRow) ?? rows[0];
  if (!isMatrix(section) || !first) return;
  if (!isRow(first)) setType(form, first, 'radio');
  first.options = labels.map((label, index) => {
    const kept = first.options[index];
    return kept ? { ...kept, label } : newOption(form, label);
  });
  syncIdentifiers(form);
  syncMatrix(form, section.uid, first.uid);
}

export function setMatrix(form: BuilderForm, sectionUid: string, on: boolean): void {
  const section = findField(form, sectionUid);
  if (section?.type !== 'section') return;
  const extra = section.extra as { layout?: string };
  if (!on) {
    delete extra.layout;
    return;
  }
  extra.layout = 'matrix';
  const first = childrenOf(form, section.uid)[0];
  const blank = !first || !isRow(first) || first.options.every((option) => !option.label.trim());
  if (blank) setMatrixColumns(form, section.uid, MATRIX_COLUMNS);
  else syncMatrix(form, section.uid, first.uid);
}
