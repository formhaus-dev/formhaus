interface FieldMessageProps {
  error?: string;
  helperText?: string;
  errorId: string;
  helperId: string;
}

export function FieldMessage({ error, helperText, errorId, helperId }: FieldMessageProps) {
  if (error) {
    return <p id={errorId} className="fh-field__error" role="alert">{error}</p>;
  }
  if (helperText) {
    return <p id={helperId} className="fh-field__helper">{helperText}</p>;
  }
  return null;
}
