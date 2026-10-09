import { FormEngine } from '@formhaus/core';
import { definition } from '~~/shared/definition';
import { parseValues } from '../parse-values';
import { serverValidators } from '../validators';

export default defineEventHandler(async (event) => {
  const values = parseValues(await readBody(event).catch(() => null));
  if (!values) {
    setResponseStatus(event, 400);
    return { message: 'Expected an object of string, number or boolean values' };
  }

  const engine = new FormEngine(definition, values, { validators: serverValidators });
  const errors = engine.validate();
  if (Object.keys(errors).length > 0) {
    setResponseStatus(event, 422);
    return { errors };
  }

  return { values: engine.getSubmitValues() };
});
