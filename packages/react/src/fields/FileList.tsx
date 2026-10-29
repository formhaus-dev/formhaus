import { fileEntries, filesFull, pickFiles, removeFile } from '@formhaus/core/fields';
import { nextRemove } from '@formhaus/core/internal';
import { useEffect, useRef, useState } from 'react';
import { useFileText } from '../labels';
import type { FieldComponentProps } from '../types';
import { inputProps } from './fieldProps';

export function FileList(props: FieldComponentProps) {
  const { field, value, onChange, disabled, loading } = props;
  const fileText = useFileText();
  const text = fileText.label;
  const [status, setStatus] = useState('');
  const [notice, setNotice] = useState('');
  const picker = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const focus = useRef<number | null>(null);
  const remove = text('removeItem');
  const entries = fileEntries(value);

  useEffect(() => {
    if (focus.current === null) return;
    (nextRemove(list.current, focus.current) ?? picker.current)?.focus();
    focus.current = null;
  });

  return (
    <>
      <input
        {...inputProps(props)}
        disabled={disabled || loading || filesFull(field, value)}
        ref={picker}
        type="file"
        multiple
        className="fh-field__input fh-field__input--file fh-field__input--files"
        accept={field.accept}
        onChange={(e) => {
          const picked = Array.from(e.target.files ?? []);
          e.target.value = '';
          if (picked.length === 0) return;
          const result = pickFiles(field, value, picked, fileText);
          focus.current = result.focus;
          if (result.value) onChange(result.value);
          setStatus(result.status);
          setNotice(result.notice);
        }}
      />
      {entries.length > 0 && (
        <ul ref={list} className="fh-file-list">
          {entries.map(({ index, name }, position) => (
            <li key={index} className="fh-file-list__item">
              <span className="fh-file-list__name" dir="auto">
                {name}
              </span>
              <button
                type="button"
                className="fh-form-actions__button fh-form-actions__button--text fh-file-list__remove"
                aria-label={text('removeItemNamed', { label: remove, item: name })}
                disabled={disabled || loading}
                onClick={() => {
                  focus.current = position;
                  setNotice('');
                  onChange(removeFile(value, index));
                  setStatus(text('itemRemoved', { item: name }));
                }}
              >
                {remove}
              </button>
            </li>
          ))}
        </ul>
      )}
      {notice && <p className="fh-field__helper fh-file-list__notice">{notice}</p>}
      <p className="fh-file-list__status" role="status">
        {status}
      </p>
    </>
  );
}
