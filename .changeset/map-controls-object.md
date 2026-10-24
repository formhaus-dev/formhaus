---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
---

- `mapControls` accepts an object entry `{ component, props, optionsProp, changeProp }` wherever it accepts a tuple. The tuple keeps working as shorthand.
- `optionsProp`, `changeProp` and the props returned by `props` are type checked against the component props, as in the tuple.
- `/controls` exports the `ControlSpec` type from React and Vue, and `ControlSpecOf`, `ControlSpecKey` and `controlEntry()` from core.
