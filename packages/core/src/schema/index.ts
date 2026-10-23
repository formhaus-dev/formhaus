import type { ValidateFn } from '../engine/engine-options';
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

export function schemaValidate(schema: StandardSchemaV1): ValidateFn {
  return async (values, { fields }) => {
    const { issues = [] } = await schema['~standard'].validate(values);
    const errors: Record<string, string> = {};
    for (const { message, path = [] } of issues) {
      const keys = path.map((segment) => (typeof segment === 'object' ? segment.key : segment));
      const name = () => keys.map(String).join('.');
      let key = name();
      while (key && !fields.includes(key)) {
        const last = keys.pop();
        key = typeof last === 'string' && typeof keys[keys.length - 1] === 'number' ? '' : name();
      }
      if ((key || path.length === 0) && !hasOwn(errors, key)) errors[key] = message;
    }
    return errors;
  };
}
