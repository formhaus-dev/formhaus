import type { SubmitHandler, ValidateContext } from '../engine/engine-options';
import { isPlainEntry } from '../validation/type-checks';
import { hasOwn } from '../visibility/nodes';
import { sameValue } from '../validation/same-value';

export interface StandardSchemaV1<Input = unknown, Output = Input> {
  readonly '~standard': StandardSchemaV1.Props<Input, Output>;
}

export declare namespace StandardSchemaV1 {
  interface Props<Input = unknown, Output = Input> {
    readonly version: 1;
    readonly vendor: string;
    readonly validate: (value: unknown, options?: Options | undefined) => Result<Output> | Promise<Result<Output>>;
    readonly types?: Types<Input, Output> | undefined;
  }
  type Result<Output> = SuccessResult<Output> | FailureResult;
  interface SuccessResult<Output> {
    readonly value: Output;
    readonly issues?: undefined;
  }
  interface Options {
    readonly libraryOptions?: Record<string, unknown> | undefined;
  }
  interface FailureResult {
    readonly issues: ReadonlyArray<Issue>;
  }
  interface Issue {
    readonly message: string;
    readonly path?: ReadonlyArray<PropertyKey | PathSegment> | undefined;
  }
  interface PathSegment {
    readonly key: PropertyKey;
  }
  interface Types<Input = unknown, Output = Input> {
    readonly input: Input;
    readonly output: Output;
  }
  type InferInput<Schema extends StandardSchemaV1> = NonNullable<Schema['~standard']['types']>['input'];
  type InferOutput<Schema extends StandardSchemaV1> = NonNullable<Schema['~standard']['types']>['output'];
}

export interface SchemaValidateOptions {
  emptyStrings?: 'keep' | 'omit';
}

const segmentKey = (segment: PropertyKey | StandardSchemaV1.PathSegment): PropertyKey =>
  typeof segment === 'object' && segment !== null && 'key' in segment ? segment.key : segment;

function fieldOf(keys: PropertyKey[], fields: string[]): string | undefined {
  for (let end = keys.length; end > 0; end--) {
    const key = keys.slice(0, end).map(String).join('.');
    if (fields.includes(key)) return key;
    if (typeof keys[end - 1] === 'string' && typeof keys[end - 2] === 'number') return undefined;
  }
  return undefined;
}

function withoutEmpty(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== '')
      .map(([key, value]) => [key, Array.isArray(value) ? value.map((item) => (isPlainEntry(item) ? withoutEmpty(item) : item)) : value]),
  );
}

async function check(
  schema: StandardSchemaV1,
  options: SchemaValidateOptions,
  values: Record<string, unknown>,
  context?: ValidateContext,
): Promise<{ errors: Record<string, string>; result: StandardSchemaV1.Result<unknown> }> {
  const input = options.emptyStrings === 'omit' ? withoutEmpty(values) : values;
  const result = await schema['~standard'].validate(input);
  const errors: Record<string, string> = {};
  for (const { message, path } of result.issues ?? []) {
    const keys = Array.from(path ?? [], segmentKey);
    const key = keys.length === 0 ? '' : context ? fieldOf(keys, context.fields) : String(keys[0]);
    if (key !== undefined && !hasOwn(errors, key)) errors[key] = message;
  }
  return { errors, result };
}

export function schemaValidate(
  schema: StandardSchemaV1,
  options: SchemaValidateOptions = {},
): (values: Record<string, unknown>, context?: ValidateContext) => Promise<Record<string, string>> {
  return async (values, context) => (await check(schema, options, values, context)).errors;
}

export interface SchemaParse<Output> {
  validate(values: Record<string, unknown>, context?: ValidateContext): Promise<Record<string, string>>;
  submit(handler: (values: Output, skippedSteps: string[]) => ReturnType<SubmitHandler>): SubmitHandler;
}

function warnHidden(message: string): void {
  try {
    if (process.env.NODE_ENV !== 'production')
      console.warn(
        `[formhaus] schemaParse: the schema rejected the submit values on a field the form does not submit ("${message}"). The schema must accept the submit payload: fields hidden by a condition or on a skipped step are absent, so mark them optional.`,
      );
  } catch {}
}

export function schemaParse<Schema extends StandardSchemaV1>(
  schema: Schema,
  options: SchemaValidateOptions = {},
): SchemaParse<StandardSchemaV1.InferOutput<Schema>> {
  let parsed: { values: Record<string, unknown>; output: StandardSchemaV1.InferOutput<Schema> } | undefined;
  const parse = async (values: Record<string, unknown>, context?: ValidateContext) => {
    const { errors, result } = await check(schema, options, values, context);
    if (!result.issues) parsed = { values, output: result.value };
    else if (Object.keys(errors).length === 0 && context?.submit !== false) {
      warnHidden(result.issues[0].message);
      return { '': result.issues[0].message };
    }
    return errors;
  };
  return {
    validate: parse,
    submit: (handler) => async (values, skippedSteps) => {
      if (!parsed || !sameValue(parsed.values, values)) {
        const errors = await parse(values);
        if (!parsed || parsed.values !== values) return { ok: false, errors };
      }
      return handler(parsed.output, skippedSteps);
    },
  };
}
