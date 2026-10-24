import type { ErrorSummaryComponentProps } from '@formhaus/react';
import { CircleAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ErrorSummary({ rootProps, title, groups, showField }: ErrorSummaryComponentProps) {
  return (
    <Alert variant="destructive" {...rootProps} className="mb-6 outline-none">
      <CircleAlert />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {groups.map((group) => (
          <div key={group.id}>
            {groups.length > 1 && <p className="mt-1 font-medium">{group.title}</p>}
            <ul className="list-disc pl-4">
              {group.entries.map((entry) => (
                <li key={entry.key}>
                  <a
                    href={`#${entry.id}`}
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
      </AlertDescription>
    </Alert>
  );
}
