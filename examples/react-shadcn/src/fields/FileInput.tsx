import { addFiles, fileEntries, removeFile } from '@formhaus/core/fields';
import type { FieldProps } from '@formhaus/react';
import type { ComponentProps } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function FileInput({ f, ...props }: ComponentProps<'input'> & { f: FieldProps }) {
  if (!props.multiple) return <Input {...props} type="file" />;
  const entries = fileEntries(f.value);
  return (
    <>
      <Input
        {...props}
        type="file"
        onChange={({ target }) => {
          const picked = Array.from(target.files ?? []);
          target.value = '';
          if (picked.length) f.change(addFiles(f.value, picked));
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
                onClick={() => f.change(removeFile(f.value, index))}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
