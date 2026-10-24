import { schemaValidate } from '@formhaus/core/schema';
import { z } from 'zod';

export const onValidate = schemaValidate(
  z
    .object({
      email: z.email('Enter a valid email').optional(),
      password: z.string().min(8, 'Use at least 8 characters').optional(),
      confirm: z.string().optional(),
    })
    .refine((values) => values.confirm === values.password, { message: 'Passwords do not match', path: ['confirm'] }),
);
