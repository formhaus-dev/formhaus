import { Button } from 'govuk-frontend';
import { type CompletionProps, completion } from '../answers';
import { useGovuk } from '../govuk';

export function FormCompletion({ onRestart }: Pick<CompletionProps, 'onRestart'>) {
  const button = useGovuk(Button);
  return (
    <>
      <div className="govuk-panel govuk-panel--confirmation">
        <h1 className="govuk-panel__title">{completion.title}</h1>
        <div className="govuk-panel__body">{completion.body}</div>
      </div>
      <h2 className="govuk-heading-m govuk-!-margin-top-6">What happens next</h2>
      <p className="govuk-body">You do not need to do anything else. Send another response if something changes.</p>
      <button type="button" className="govuk-button govuk-button--secondary" data-module="govuk-button" ref={button} onClick={onRestart}>
        {completion.again}
      </button>
    </>
  );
}
