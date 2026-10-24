import type { ErrorSummaryComponentProps } from '@formhaus/react';
import { CircleAlert } from 'lucide-react';

export function ErrorSummary({ rootProps, title, groups, showField }: ErrorSummaryComponentProps) {
  return (
    <div {...rootProps} className="mb-6 grid gap-1 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm outline-none">
      <p className="flex items-center gap-2 font-medium text-destructive">
        <CircleAlert className="size-4" />
        {title}
      </p>
      {groups.map((group) => (
        <div key={group.id} className="pl-6">
          {groups.length > 1 && <p className="mt-1 font-medium">{group.title}</p>}
          <ul className="list-disc pl-4">
            {group.entries.map((entry) => (
              <li key={entry.key}>
                <a
                  href={`#${entry.id}`}
                  className="text-destructive underline underline-offset-4"
                  onClick={(event) => {
                    event.preventDefault();
                    showField(entry.key);
                  }}
                >
                  {entry.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
