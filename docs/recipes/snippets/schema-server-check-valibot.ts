import { schemaValidate } from '@formhaus/core/schema';
import * as v from 'valibot';

const isFree = async (email: string) => (await fetch(`/api/emails/${encodeURIComponent(email)}`)).status === 404;

export const onValidate = schemaValidate(
  v.objectAsync({
    email: v.pipeAsync(v.string(), v.email('Enter a valid email'), v.checkAsync(isFree, 'This email is already registered')),
  }),
);
