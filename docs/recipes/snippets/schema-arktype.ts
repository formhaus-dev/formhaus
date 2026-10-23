import { schemaValidate } from '@formhaus/core/schema';
import { type } from 'arktype';

export const onValidate = schemaValidate(
  type({
    email: 'string.email',
    players: type({ name: 'string >= 2' }).array().atMostLength(5),
  }),
);
