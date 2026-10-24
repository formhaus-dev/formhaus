import { schemaValidate } from '@formhaus/core/schema';
import { type } from 'arktype';

export const onValidate = schemaValidate(
  type({
    'email?': type('string.email').configure({ message: 'Enter a valid email' }),
    'password?': type('string >= 8').configure({ message: 'Use at least 8 characters' }),
    'confirm?': 'string',
  }).narrow((values, ctx) => values.confirm === values.password || ctx.reject({ message: 'Passwords do not match', path: ['confirm'] })),
);
