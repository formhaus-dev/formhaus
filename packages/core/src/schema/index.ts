import type { ValidateContext } from '../engine/engine-options';
import { hasOwn } from '../visibility/nodes';

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

export function schemaValidate(
  schema: StandardSchemaV1,
): (values: Record<string, unknown>, context?: ValidateContext) => Promise<Record<string, string>> {
  return async (values, context) => {
    const { issues = [] } = await schema['~standard'].validate(values);
    const errors: Record<string, string> = {};
    for (const { message, path } of issues) {
      const keys = Array.from(path ?? [], segmentKey);
      const key = keys.length === 0 ? '' : context ? fieldOf(keys, context.fields) : String(keys[0]);
      if (key !== undefined && !hasOwn(errors, key)) errors[key] = message;
    }
    return errors;
  };
}
