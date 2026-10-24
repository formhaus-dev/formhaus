import type { FormDefinition } from '@formhaus/core';
import { Button } from 'govuk-frontend';
import { answers } from '../answers';
import { useGovuk } from '../govuk';
import { LinkButton } from './LinkButton';

interface CheckAnswersProps {
  definition: FormDefinition;
  values: Record<string, unknown>;
  sendLabel: string;
  onChange: (key: string) => void;
  onSend: () => void;
}

export function CheckAnswers({ definition, values, sendLabel, onChange, onSend }: CheckAnswersProps) {
  const button = useGovuk(Button);
  return (
    <>
      <h1 className="govuk-heading-l">Check your answers before sending your response</h1>
      <dl className="govuk-summary-list govuk-!-margin-bottom-9">
        {answers(definition, values).map((answer) => (
          <div key={answer.key} className="govuk-summary-list__row">
            <dt className="govuk-summary-list__key">{answer.label}</dt>
            <dd className="govuk-summary-list__value app-answer">{answer.value}</dd>
            <dd className="govuk-summary-list__actions">
              <LinkButton onClick={() => onChange(answer.key.split('.')[0]!)}>
                Change<span className="govuk-visually-hidden"> {answer.label}</span>
              </LinkButton>
            </dd>
          </div>
        ))}
      </dl>
      <h2 className="govuk-heading-m">Now send your response</h2>
      <p className="govuk-body">By sending this response you are confirming that the details you are providing are correct.</p>
      <button type="button" className="govuk-button" data-module="govuk-button" ref={button} onClick={onSend}>
        {sendLabel}
      </button>
    </>
  );
}
