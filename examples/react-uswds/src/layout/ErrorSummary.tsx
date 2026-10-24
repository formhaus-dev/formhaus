import type { ErrorSummaryComponentProps } from '@formhaus/react';
import { useEffect } from 'react';

export function ErrorSummary({ rootProps, title, groups, showField }: ErrorSummaryComponentProps) {
  useEffect(() => {
    const pageTitle = document.title;
    document.title = `Error: ${pageTitle}`;
    return () => {
      document.title = pageTitle;
    };
  }, []);

  return (
    <div className="usa-alert usa-alert--error summary" {...rootProps}>
      <div className="usa-alert__body">
        <h2 className="usa-alert__heading">{title}</h2>
        {groups.map((group) => (
          <div key={group.id}>
            {groups.length > 1 && <p className="usa-alert__text summary__step">{group.title}</p>}
            <ul className="usa-list">
              {group.entries.map((entry) => (
                <li key={entry.key}>
                  <a
                    className="usa-link"
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
      </div>
    </div>
  );
}
