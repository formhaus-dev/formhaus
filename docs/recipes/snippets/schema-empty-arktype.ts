import { schemaValidate } from '@formhaus/core/schema';
import { type } from 'arktype';

export const onValidate = schemaValidate(type({ 'website?': type('string.url').configure({ message: 'Enter a full address' }) }), {
  emptyStrings: 'omit',
});
