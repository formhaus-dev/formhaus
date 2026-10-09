---
title: "Formhaus vs SurveyJS"
description: "Formhaus vs SurveyJS Form Library: JSON formats, multi-page and skip logic, validation, licensing, bundle size, Figma and AI tooling, with migration JSON."
---

# Formhaus vs SurveyJS

SurveyJS and Formhaus both render forms from JSON. SurveyJS is a full survey platform with many question types, an expression language and a commercial drag-and-drop builder; Formhaus is a small engine for product forms and funnels that renders with your own React, Vue and Figma components. For surveys, [scored quizzes](https://surveyjs.io/form-library/documentation/design-survey-create-a-quiz), [matrix questions](https://surveyjs.io/form-library/documentation/api-reference/matrix-table-question-model) or a visual builder for non-developers, SurveyJS is the better choice. For forms that must look like the rest of your app and stay small, Formhaus is the lighter fit.

## Choose SurveyJS when

- Non-developers build forms in a drag-and-drop editor. Survey Creator does this; it needs a commercial developer license ([licensing](https://surveyjs.io/licensing)).
- You need logic beyond show and hide: expressions, calculated values, `enableIf` and `requiredIf` ([conditional logic](https://surveyjs.io/form-library/documentation/design-survey-conditional-logic)).
- The app uses Angular or plain JavaScript as well as React or Vue ([overview](https://surveyjs.io/form-library/documentation/overview)).
- You want ready themes and adapters for Bootstrap, Material UI and shadcn/ui ([theme adapters](https://surveyjs.io/documentation/theme-adapters)).
- You also need result dashboards or PDF export. SurveyJS sells Dashboard and PDF Generator ([licensing](https://surveyjs.io/licensing)).

## Choose Formhaus when

- Forms should render with your own field components through a `components` map, with no theme layer in between.
- Bundle size matters: the Formhaus engine and React renderer together are about 11 KB gzipped.
- Steps branch to different steps through explicit `routes`, and you want an MCP server to simulate every path.
- Design works in Figma from the same definition the app renders.

## Feature comparison

| | Formhaus | SurveyJS Form Library |
|---|---|---|
| Definition format | JSON, checked by a [JSON Schema](/api/definition#json-schema) | SurveyJS JSON; linter and self-hosted schema validator ([JSON validation](https://surveyjs.io/form-library/documentation/survey-json-validation)) |
| Multi-step | Built in: `steps`, per-step validation, progress ([guide](/guide/steps)) | Built in: pages ([multi-page survey](https://surveyjs.io/form-library/documentation/design-survey-create-a-multi-page-survey)) |
| Branching routes | `routes` on a step pick the next step ([guide](/guide/steps#route-between-branches)) | Page `visibleIf` and the `skip` trigger to a question ([conditional logic](https://surveyjs.io/form-library/documentation/design-survey-conditional-logic#skip)) |
| Conditional fields | `show` / `showAny` with five operators ([guide](/guide/conditions)) | `visibleIf`, `enableIf`, `requiredIf` expressions ([conditional logic](https://surveyjs.io/form-library/documentation/design-survey-conditional-logic#question-visibility)) |
| Validation | Declarative rules, named validators, async step validation ([guide](/guide/validation)) | Built-in validators, expression validators, `onServerValidateQuestions` ([data validation](https://surveyjs.io/form-library/documentation/data-validation)) |
| Custom components | `components` map per field type ([guide](/guide/custom-components)) | Custom question types and third-party components ([integration](https://surveyjs.io/form-library/documentation/customize-question-types-third-party-component-integration-react)) |
| Figma | Plugin draws the definition ([guide](/guide/figma)) | Figma design kit of SurveyJS components ([FAQ](https://surveyjs.io/faq/customization), [kit](https://www.figma.com/@surveyjs)) |
| AI tooling | JSON Schema, [MCP server](/guide/mcp) that validates definitions and simulates paths, Claude Code plugin | [MCP server](https://surveyjs.io/documentation/surveyjs-mcp-server) for docs search, [agent skills](https://surveyjs.io/documentation/surveyjs-ai-agent-skills), AI chat in Survey Creator ([demo](https://surveyjs.io/survey-creator/examples/ai-assisted-survey-design-chat)) |
| Frameworks | React 18+, Vue 3.3+, headless engine | React, Angular, Vue 3, plain JavaScript ([overview](https://surveyjs.io/form-library/documentation/overview)) |
| Bundle size (gzipped) | 6.2 KB core + 4.8 KB React | 322.5 KB `survey-core` 3.2.0 ([bundlephobia](https://bundlephobia.com/package/survey-core@3.2.0)) + 46.2 KB `survey-react-ui` 3.2.0 ([bundlephobia](https://bundlephobia.com/package/survey-react-ui@3.2.0)) |
| License | MIT, all packages | Form Library MIT; Survey Creator, Dashboard and PDF Generator commercial ([licensing](https://surveyjs.io/licensing)) |

Sizes measured on 2026-10-09. See [how Formhaus sizes are measured](/compare/#formhaus-at-a-glance).

## Migration

The same sign-up form: email, plan, and a company field only for the Team plan.

### SurveyJS

```json
{
  "title": "Sign up",
  "completeText": "Create account",
  "elements": [
    {
      "type": "text",
      "name": "email",
      "title": "Email",
      "inputType": "email",
      "isRequired": true,
      "requiredErrorText": "Enter your email",
      "validators": [{ "type": "email", "text": "Enter a valid email" }]
    },
    {
      "type": "dropdown",
      "name": "plan",
      "title": "Plan",
      "isRequired": true,
      "choices": [
        { "value": "solo", "text": "Solo" },
        { "value": "team", "text": "Team" }
      ]
    },
    {
      "type": "text",
      "name": "company",
      "title": "Company",
      "visibleIf": "{plan} = 'team'",
      "isRequired": true,
      "requiredErrorText": "Enter your company"
    }
  ]
}
```

```tsx
import 'survey-core/survey-core.css';
import { useEffect, useMemo } from 'react';
import { Model } from 'survey-core';
import { Survey } from 'survey-react-ui';
import signup from './signup-survey.json';

export function Signup({ onDone }: { onDone: (values: Record<string, unknown>) => void }) {
  const survey = useMemo(() => new Model(signup), []);

  useEffect(() => {
    const handler = (sender: Model) => onDone(sender.data);
    survey.onComplete.add(handler);
    return () => survey.onComplete.remove(handler);
  }, [survey, onDone]);

  return <Survey model={survey} />;
}
```

### Formhaus

<<< @/compare/definitions/signup.json

```tsx
import { FormRenderer } from '@formhaus/react';
import type { FormDefinition } from '@formhaus/core';
import signup from './signup.json';

const definition = signup as FormDefinition;

export function Signup({ onDone }: { onDone: (values: Record<string, unknown>) => void }) {
  return <FormRenderer definition={definition} onSubmit={onDone} />;
}
```

`elements` become `fields`, `name` becomes `key`, `title` becomes `label`, `choices` become `options`, and `visibleIf` expressions become `show` conditions. `pages` map to `steps`. Expressions, calculated values and matrix questions have no Formhaus equivalent; keep those forms on SurveyJS.

## Related

- [Compare overview](/compare/)
- [Quiz funnel recipe](/recipes/quiz-funnel)
- [Multi-step with branching recipe](/recipes/multi-step-branching)
