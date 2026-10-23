import { schemaValidate } from '@formhaus/core/schema';
import { z } from 'zod';

export const onValidate = schemaValidate(
  z.object({
    email: z.email('Enter a valid email'),
    players: z.array(z.object({ name: z.string().min(2, 'Use at least 2 letters') })).max(5, 'Up to 5 players'),
  }),
);
