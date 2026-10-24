import { schemaValidate } from '@formhaus/core/schema';
import * as v from 'valibot';

export const onValidate = schemaValidate(v.object({ website: v.optional(v.pipe(v.string(), v.url('Enter a full address'))) }), {
  emptyStrings: 'omit',
});
