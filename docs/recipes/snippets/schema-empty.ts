import { schemaValidate } from '@formhaus/core/schema';
import { z } from 'zod';

export const onValidate = schemaValidate(z.object({ website: z.url('Enter a full address').optional() }), { emptyStrings: 'omit' });
