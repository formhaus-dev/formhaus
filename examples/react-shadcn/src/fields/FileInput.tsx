import { type FormField, getDefaultMessage } from '@formhaus/core';
import { addFiles, fileEntries, fileLimit, removeFile } from '@formhaus/core/fields';
import type { FieldProps } from '@formhaus/react';
import { type ComponentProps, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FieldDescription } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type FileInputProps = ComponentProps<'input'> & { f: FieldProps; field: FormField };

function FileList({ f, field, ...props }: FileInputProps) {
  const [notice, setNotice] = useState('');
  const max = fileLimit(field);
  const entries = fileEntries(f.value);
  return (
    <>
      <Input
        {...props}
        type="file"
        disabled={props.disabled || addFiles(f.value, []).length >= max}
        onChange={({ target }) => {
          const picked = Array.from(target.files ?? []);
          target.value = '';
          if (!picked.length) return;
          const next = addFiles(f.value, picked, max);
          setNotice(
            next.length < addFiles(f.value, picked).length
              ? (field.validation?.maxLengthMessage ?? getDefaultMessage('maxItems', { max }))
              : '',
          );
          f.change(next);
        }}
      />
      {entries.length > 0 && (
        <ul className="grid gap-1">
          {entries.map(({ index, name }) => (
            <li key={index} className="flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1 text-sm">
              <span className="min-w-0 break-words">{name}</span>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Remove ${name}`}
                disabled={props.disabled}
                onClick={() => {
                  setNotice('');
                  f.change(removeFile(f.value, index));
                }}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
      {notice && <FieldDescription>{notice}</FieldDescription>}
    </>
  );
}

export function FileInput({ f, field, ...props }: FileInputProps) {
  return props.multiple ? <FileList {...props} f={f} field={field} /> : <Input {...props} type="file" />;
}
