export function getDefaultMessage(rule: string, params?: Record<string, unknown>): string {
  switch (rule) {
    case 'required':
      return 'This field is required';
    case 'minLength':
      return `Must be at least ${params?.min} ${params?.unit ?? 'characters'}`;
    case 'maxLength':
      return `Must be at most ${params?.max} ${params?.unit ?? 'characters'}`;
    case 'min':
      return `Must be at least ${params?.min}`;
    case 'max':
      return `Must be at most ${params?.max}`;
    case 'pattern':
      return 'Invalid format';
    case 'matchField':
      return 'Fields must match';
    default:
      return 'Invalid value';
  }
}
