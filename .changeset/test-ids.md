---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
---

- New `testIds` prop on `FormRenderer` and `HeadlessFormRenderer` adds `data-testid` attributes. It is off by default.
- `testIds={true}` names elements after the definition id: `signup.form`, `signup.email`, `signup.plan.pro`, `signup.people.0.name`, `signup.submit`, `signup.next`, `signup.back` and `signup.summary`.
- A `testIds` function receives a `TestIdTarget` and returns the id.
- New `TestIdTarget` type.
- Custom field components receive `testId` and `optionTestId`. Custom actions components receive `testIds`.
