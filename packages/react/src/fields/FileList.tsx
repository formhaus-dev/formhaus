import { addFiles, fileEntries, removeFile } from '@formhaus/core/fields';
import { fileNames, nextRemove } from '@formhaus/core/internal';
import { useContext, useEffect, useRef, useState } from 'react';
import { LabelContext } from '../labels';
import type { FieldComponentProps } from '../types';
import { inputProps } from './fieldProps';

export function FileList(props: FieldComponentProps) {
  const { field, value, onChange, disabled, loading } = props;
  const text = useContext(LabelContext);
  const [status, setStatus] = useState('');
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
        ref={picker}
        type="file"
        multiple
        className="fh-field__input fh-field__input--file fh-field__input--files"
        accept={field.accept}
        onChange={(e) => {
          const picked = Array.from(e.target.files ?? []);
          e.target.value = '';
          if (picked.length === 0) return;
          onChange(addFiles(value, picked));
          setStatus(text('itemAdded', { item: fileNames(picked) }));
        }}
      />
      {entries.length > 0 && (
        <ul ref={list} className="fh-file-list">
          {entries.map(({ index, name }, position) => (
            <li key={index} className="fh-file-list__item">
              <span className="fh-file-list__name">{name}</span>
              <button
                type="button"
                className="fh-form-actions__button fh-form-actions__button--text fh-file-list__remove"
                aria-label={text('removeItemNamed', { label: remove, item: name })}
                disabled={disabled || loading}
                onClick={() => {
                  focus.current = position;
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
      <p className="fh-file-list__status" role="status">
        {status}
      </p>
    </>
  );
}
