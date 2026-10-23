import { schemaValidate } from '@formhaus/core/schema';
import { z } from 'zod';

async function isFree(email: string): Promise<boolean> {
  const response = await fetch(`/api/emails/${encodeURIComponent(email)}`);
  return response.status === 404;
}

export const onValidate = schemaValidate(
  z.object({
    email: z.email('Enter a valid email').refine(isFree, 'This email is already registered'),
  }),
);
