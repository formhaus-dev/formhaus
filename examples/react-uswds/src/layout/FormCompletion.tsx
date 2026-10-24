import { answers, completion, type CompletionProps } from '../answers';

export function FormCompletion({ definition, values, onRestart }: CompletionProps) {
  return (
    <div className="completion">
      <div className="usa-alert usa-alert--success" role="status">
        <div className="usa-alert__body">
          <h2 className="usa-alert__heading">{completion.title}</h2>
          <p className="usa-alert__text">{completion.body}</p>
        </div>
      </div>
      <h3 className="completion__heading">{completion.answers}</h3>
      <table className="usa-table usa-table--borderless usa-table--stacked width-full">
        <tbody>
          {answers(definition, values).map((answer) => (
            <tr key={answer.key}>
              <th scope="row" className="completion__label">
                {answer.label}
              </th>
              <td className="completion__value">{answer.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="usa-button usa-button--outline" onClick={onRestart}>
        {completion.again}
      </button>
    </div>
  );
}
