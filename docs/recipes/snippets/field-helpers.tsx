import { fieldProps, type FieldComponentProps } from '@formhaus/react';

export function TextInput(props: FieldComponentProps) {
  const f = fieldProps(props);
  return (
    <div>
      <label htmlFor={f.id}>{f.label}</label>
      <input {...f.attrs} type={f.inputType} value={f.text} onChange={f.onInput} />
      {f.helperText && <p id={f.helperId}>{f.helperText}</p>}
      {f.error && <p id={f.errorId}>{f.error}</p>}
    </div>
  );
}

export function ChoiceButtons(props: FieldComponentProps) {
  const f = fieldProps(props);
  return (
    <fieldset id={f.id} data-fh="field" {...f.aria}>
      <legend>{f.label}</legend>
      {f.options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={f.value === option.value}
          disabled={f.disabled}
          onClick={() => f.commit(option.value)}
        >
          {option.label}
        </button>
      ))}
      {f.error && <p id={f.errorId}>{f.error}</p>}
    </fieldset>
  );
}
