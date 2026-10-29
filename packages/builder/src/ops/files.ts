import { dropFileList, type BuilderForm, type BuilderQuestion } from '../model';
import { hasFormat, requireFormat } from './form';
import { findField } from './locate';

export const isFileList = (form: BuilderForm, item: BuilderQuestion): boolean =>
  item.type === 'file' && item.extra.multiple === true && hasFormat(form, '1.7');

export function setMultiple(form: BuilderForm, uid: string, on: boolean): void {
  const item = findField(form, uid);
  if (item?.type !== 'file' || on === isFileList(form, item)) return;
  dropFileList(item);
  if (!on) return;
  item.extra.multiple = true;
  requireFormat(form, '1.7');
}
