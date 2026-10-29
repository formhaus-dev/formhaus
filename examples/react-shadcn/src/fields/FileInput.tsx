import type { FormField } from '@formhaus/core';
import { fileEntries, filesFull, pickFiles, removeFile } from '@formhaus/core/fields';
import type { FieldProps } from '@formhaus/react';
import { type ComponentProps, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FieldDescription } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type FileInputProps = ComponentProps<'input'> & { f: FieldProps; field: FormField };

function FileList({ f, field, ...props }: FileInputProps) {
  const [notice, setNotice] = useState('');
  const [status, setStatus] = useState('');
  const entries = fileEntries(f.value);
  return (
    <>
      <Input
        {...props}
        type="file"
        disabled={props.disabled || filesFull(field, f.value)}
        onChange={({ target }) => {
          const picked = Array.from(target.files ?? []);
          target.value = '';
          if (!picked.length) return;
          const result = pickFiles(field, f.value, picked);
          if (result.value) f.change(result.value);
          setNotice(result.notice);
          setStatus(result.status);
        }}
      />
      {entries.length > 0 && (
        <ul className="grid gap-1">
          {entries.map(({ index, name }) => (
            <li key={index} className="flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1 text-sm">
              <span className="min-w-0 break-words" dir="auto">
                {name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Remove ${name}`}
                disabled={props.disabled}
                onClick={() => {
                  setNotice('');
                  f.change(removeFile(f.value, index));
                  setStatus(`${name} removed`);
                }}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
      {notice && <FieldDescription>{notice}</FieldDescription>}
      <p className="sr-only" role="status">
        {status}
      </p>
    </>
  );
}

export function FileInput({ f, field, ...props }: FileInputProps) {
  return props.multiple ? <FileList {...props} f={f} field={field} /> : <Input {...props} type="file" />;
}
