import type { FormDefinition } from '@formhaus/core';
import { useFormEngine } from '@formhaus/react';

type Props = { definition: FormDefinition; send: (values: Record<string, unknown>) => Promise<void> };

export function ContactForm({ definition, send }: Props) {
  const engine = useFormEngine(definition);
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
          <input value={String(engine.values[field.key] ?? '')} onChange={(event) => engine.setValue(field.key, event.target.value)} />
          {engine.errors[field.key]}
        </label>
      ))}
      {!engine.isFirstStep && (
        <button type="button" onClick={() => engine.back()}>
          Back
        </button>
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
