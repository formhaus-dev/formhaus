import { errorSummary, type FormDefinition, type SubmitHandler } from '@formhaus/core';
import { useFormEngine } from '@formhaus/react';

type Props = { definition: FormDefinition; send: SubmitHandler };

export function CustomLayoutForm({ definition, send }: Props) {
  const engine = useFormEngine(definition);
  const { groups, topLevelErrors, count } = errorSummary(engine, { idPrefix: 'signup' });
  const showField = (key: string, id: string) => {
    engine.goToStepWithField(key);
    setTimeout(() => document.getElementById(id)?.focus());
  };
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        engine.submit(send);
      }}
    >
      {engine.visibleFields.map((field) => (
        <label key={field.key}>
          {field.label}
          <input
            id={`signup-${field.key}`}
            aria-invalid={!!engine.errors[field.key]}
            value={String(engine.values[field.key] ?? '')}
            onChange={(event) => engine.setValue(field.key, event.target.value)}
          />
        </label>
      ))}
      {topLevelErrors.map((error) => (
        <p key={error} role="alert">
          {error}
        </p>
      ))}
      {count > 0 && (
        <nav aria-label={`${count} errors`}>
          {groups.map((group) => (
            <ul key={group.id} aria-label={group.title}>
              {group.entries.map((entry) => (
                <li key={entry.key}>
                  <a
                    href={`#${entry.id}`}
                    onClick={(event) => {
                      event.preventDefault();
                      showField(entry.key, entry.id);
                    }}
                  >
                    {entry.text}
                  </a>
                </li>
              ))}
            </ul>
          ))}
        </nav>
      )}
      {engine.isLastStep ? (
        <button type="submit">Send</button>
      ) : (
        <button type="button" onClick={() => engine.next()}>
          Next
        </button>
      )}
    </form>
  );
}
