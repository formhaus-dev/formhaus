# Engine scenarios

Each file holds one `definition` and a list of scenarios that drive `FormEngine` through its public API. `scenario.schema.json` describes the shape. The TypeScript runner is `packages/core/__tests__/conformance/scenarios.ts`; any other engine implementation runs the same files.

```json
{
  "name": "publishes validating state during the request",
  "values": { "name": "John" },
  "hooks": { "onStepValidate": [{ "defer": "check", "return": null }] },
  "steps": [
    { "do": "next", "await": false, "returns": true },
    { "expect": { "stepValidating": true, "step": "personal" } },
    { "do": "resolve", "deferred": "check" },
    { "do": "settle" },
    { "expect": { "stepValidating": false, "step": "payment" } }
  ]
}
```

## Running a scenario

1. Create the engine with `values` and the options the scenario lists. If `throws` is set, the constructor must throw an error with that name.
2. Run `steps` in order. An action step calls the engine method named in `do` and awaits it. `returns` is compared with the result. `throws` is compared with the `name` (and `phase`, if set) of the error the action throws or rejects with.
3. With `"await": false`, the action starts and the runner moves on. `settle` awaits every started action and checks its `returns` or `throws`.
4. An `expect` step reads only the properties it lists. All other state is not checked.

## Hooks and validators

- `hooks` installs only the listed hooks. Each call takes the next reply from its list. An exhausted list replies with nothing (`undefined`).
- A reply returns `return`, or throws an `Error` with the message `throw`. A reply with `defer` stays pending until a `resolve` step names it.
- A submit or skip handler takes its replies from the action's `handler` list.
- `validators` maps a validator name to a list of values it rejects with `error`. Values are compared as JSON.
- `messages` is a message catalog.

## The log

The runner records, in order:

- `{ "event": FormEvent }` for every `onFormEvent` call. The handler is always installed.
- `{ "warning": { "code", "path" } }` for every `onWarning` call.
- `{ "call": "<hook>", ... }` for every installed hook and handler call, with its arguments: `context` for step hooks, `values` and `skippedSteps` for submit hooks and handlers, `stepId` and `values` for `onStepValidate`.

Every `expect` step clears the log. `"log": [...]` compares the entries recorded since the previous `expect`.

## Comparison

Actual and expected values are compared as JSON, with object keys in any order. A property with value `undefined` counts as absent, and a top-level `undefined` counts as `null`.

## Not covered

Scenarios do not cover:

- hooks that call back into the engine;
- `subscribe` listeners and snapshot counters;
- options changed after construction;
- DOM focus and renderer behaviour.

These stay in the TypeScript tests.
