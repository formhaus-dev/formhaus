import { dropFileList, type BuilderForm } from '../model';
import { requireFormat } from './form';
import { findField } from './locate';

export function setMultiple(form: BuilderForm, uid: string, on: boolean): void {
  const item = findField(form, uid);
  if (item?.type !== 'file' || on === !!item.extra.multiple) return;
  dropFileList(item);
  if (!on) return;
  item.extra.multiple = true;
  requireFormat(form, '1.7');
}
