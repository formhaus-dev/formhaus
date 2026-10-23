import { schemaValidate } from '@formhaus/core/schema';
import * as v from 'valibot';

export const onValidate = schemaValidate(
  v.object({
    email: v.pipe(v.string(), v.email('Enter a valid email')),
    players: v.pipe(
      v.array(v.object({ name: v.pipe(v.string(), v.minLength(2, 'Use at least 2 letters')) })),
      v.maxLength(5, 'Up to 5 players'),
    ),
  }),
);
