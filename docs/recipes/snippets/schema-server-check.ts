import { schemaValidate } from '@formhaus/core/schema';
import { z } from 'zod';

const checked = new Map<string, Promise<boolean>>();

function isFree(email: string): Promise<boolean> {
  let free = checked.get(email);
  if (!free) {
    free = fetch(`/api/emails/${encodeURIComponent(email)}`)
      .then((response) => {
        if (response.status === 404) return true;
        if (response.ok) return false;
        throw new Error(`Email check failed: ${response.status}`);
      })
      .catch(() => {
        checked.delete(email);
        return true;
      });
    checked.set(email, free);
  }
  return free;
}

export const onValidate = schemaValidate(
  z.object({
    email: z.email('Enter a valid email').refine(isFree, 'This email is already registered'),
  }),
);
