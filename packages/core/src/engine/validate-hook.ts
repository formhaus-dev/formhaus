import type { FormNode } from '../types';
import { visitShown } from '../validation/validate-step';
import type { ValidateFn } from './engine-options';
import { reportRuleErrors } from './form-events';
import type { EngineInternals } from './runtime-internals';
import { applyValidationErrors, getSubmitValues } from './validation-state';

function formNodes(engine: EngineInternals): FormNode[] {
  return engine.isMultiStep
    ? engine.visibleSteps.flatMap((step) => (engine.skipped.has(step.id) ? [] : step.fields))
    : (engine.definition.fields ?? []);
}

export async function passesValidate(
  engine: EngineInternals,
  validate: ValidateFn,
  values: Record<string, unknown>,
  stale: () => boolean,
  signal: AbortSignal,
  submit: boolean,
  ruleErrors: Record<string, string> = {},
): Promise<boolean> {
  if (Object.keys(ruleErrors).length > 0) reportRuleErrors(engine);
  const fields: string[] = [];
  const nodes = submit ? formNodes(engine) : engine.currentStep!.fields;
  visitShown(nodes, getSubmitValues(engine), engine.visibility.conditionValues(engine.state.values), (path) => fields.push(path));
  const result = await validate(values, { stepId: engine.currentStep?.id, fields, submit }, signal);
  if (stale()) return false;
  if (!result || Object.keys(result).length === 0) return true;
  const errors: Record<string, string> = {};
  const general: string[] = [];
  for (const [key, message] of Object.entries(result)) {
    if (fields.includes(key)) errors[key] = message;
    else general.push(message);
  }
  Object.assign(errors, ruleErrors);
  applyValidationErrors(engine, errors, false, general, submit);
  return false;
}
