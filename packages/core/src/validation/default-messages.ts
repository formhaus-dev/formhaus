export const TYPE_MESSAGES = {
  email: 'Enter a valid email',
  number: 'Enter a number',
  boolean: 'Must be true or false',
  option: 'Select one of the available options',
  options: 'Must be a list of available options',
  string: 'Must be text',
  date: 'Enter a valid date',
  datetime: 'Enter a valid date and time',
  file: 'Must be a file reference',
  value: 'Invalid value',
};

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
