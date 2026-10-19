import { validateSubmission } from '@formhaus/core/server';
import { definition } from '~~/shared/definition';
import { serverValidators } from '../validators';

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => null);
  const { values, errors } = validateSubmission(definition, body?.values, {
    skippedSteps: body?.skippedSteps,
    validators: serverValidators,
  });
  if (Object.keys(errors).length > 0) {
    setResponseStatus(event, 422);
    return { errors };
  }

  return { values };
});
