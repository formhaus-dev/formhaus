import type { ErrorSummaryComponentProps, FormErrorsComponentProps } from '@formhaus/react';
import { ErrorSummary as GovukErrorSummary } from 'govuk-frontend';
import { Fragment, type ReactNode, useEffect } from 'react';
import { useGovuk } from '../govuk';

type BoxProps = Pick<ErrorSummaryComponentProps, 'rootProps'> & { title?: string; children: ReactNode };

function SummaryBox({ rootProps, title = 'There is a problem', children }: BoxProps) {
  const { role, ...root } = rootProps;
  const ref = useGovuk(GovukErrorSummary);

  useEffect(() => {
    const pageTitle = document.title;
    if (!pageTitle.startsWith('Error: ')) document.title = `Error: ${pageTitle}`;
    return () => {
      document.title = pageTitle;
    };
  }, []);

  return (
    <div className="govuk-error-summary" data-module="govuk-error-summary" ref={ref} {...root}>
      <div role={role}>
        <h2 className="govuk-error-summary__title">{title}</h2>
        <div className="govuk-error-summary__body">{children}</div>
      </div>
    </div>
  );
}

export function ErrorSummary({ rootProps, title, groups, showField }: ErrorSummaryComponentProps) {
  return (
    <SummaryBox rootProps={rootProps} title={title}>
      {groups.map((group) => (
        <Fragment key={group.id}>
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
                  {entry.message ?? entry.text}
                </a>
              </li>
            ))}
          </ul>
        </Fragment>
      ))}
    </SummaryBox>
  );
}

export function FormErrors({ rootProps, errors }: FormErrorsComponentProps) {
  if (!errors.length) return null;
  return (
    <SummaryBox rootProps={rootProps}>
      <ul className="govuk-list govuk-error-summary__list">
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </SummaryBox>
  );
}
