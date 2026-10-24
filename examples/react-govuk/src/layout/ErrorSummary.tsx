import type { ErrorSummaryComponentProps } from '@formhaus/react';

export function ErrorSummary({ rootProps, title, groups, showField }: ErrorSummaryComponentProps) {
  return (
    <div className="govuk-error-summary" data-module="govuk-error-summary" {...rootProps}>
      <h2 className="govuk-error-summary__title">{title}</h2>
      <div className="govuk-error-summary__body">
        {groups.map((group) => (
          <div key={group.id}>
            {groups.length > 1 && <p className="govuk-body govuk-!-font-weight-bold govuk-!-margin-bottom-1">{group.title}</p>}
            <ul className="govuk-list govuk-error-summary__list">
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
      </div>
    </div>
  );
}
