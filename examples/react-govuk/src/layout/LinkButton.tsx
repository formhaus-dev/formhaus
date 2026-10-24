import type { ComponentProps } from 'react';

export function LinkButton(props: ComponentProps<'button'>) {
  return <button type="button" {...props} className="govuk-link govuk-body govuk-!-margin-0 app-link-button" />;
}
