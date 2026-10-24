import { schemaValidate } from '@formhaus/core/schema';
import * as v from 'valibot';

export const onValidate = schemaValidate(
  v.pipe(
    v.object({
      email: v.optional(v.pipe(v.string(), v.email('Enter a valid email'))),
      password: v.optional(v.pipe(v.string(), v.minLength(8, 'Use at least 8 characters'))),
      confirm: v.optional(v.string()),
    }),
    v.forward(
      v.check((values) => values.confirm === values.password, 'Passwords do not match'),
      ['confirm'],
    ),
  ),
);
