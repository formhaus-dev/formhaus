import { answers, completion, type CompletionProps } from './answers';

export function FormCompletion({ definition, values, onRestart }: CompletionProps) {
  return (
    <section className="fh-cloud done" aria-labelledby="done-title">
      <h2 id="done-title" className="done__title">
        {completion.title}
      </h2>
      <p role="status" className="fh-form__success">
        {completion.body}
      </p>
      <dl className="done__answers">
        {answers(definition, values).map((answer) => (
          <div key={answer.key} className="done__row">
            <dt>{answer.label}</dt>
            <dd>{answer.value}</dd>
          </div>
        ))}
      </dl>
      <button type="button" className="fh-form-actions__button fh-form-actions__button--secondary" onClick={onRestart}>
        {completion.again}
      </button>
    </section>
  );
}
