---
title: "Survey templates: SUS scoring and design order"
description: "Pass context to the Formhaus survey templates in the link, score the usability questionnaire and rotate the design preference test."
---

# How do I use the survey templates?

The templates only collect answers. The link carries the context, and your code scores or rotates.

## Link parameters

Hidden fields read their value from the page URL.

| Template | Parameter | Used for |
|---|---|---|
| `post-purchase-feedback` | `order` | Order number, stored with the answers |
| `course-evaluation` | `course` | Course name in the step and rating titles |
| `usability-questionnaire` | `product`, `pid` | Product name in the section title, participant ID |
| `design-preference-test` | `pid` | Participant ID |

`course` and `product` have a default text, `this course` and `the product`. Without the parameter the default text is also in the submitted payload.

## Score the usability questionnaire

`usability-questionnaire` collects the ten System Usability Scale statements as published by Brooke (1996), in the original order. Two words follow Finstad (2006): "product" instead of "system", and "awkward" instead of "cumbersome". Brooke labels only the two ends of the scale. The template labels all five points, so the table has a header on every column. The values stay 1 to 5.

Every statement is required, because a score needs all ten answers. Do not score a payload with a missing answer.

For items 1, 3, 5, 7 and 9, a point is the answer minus 1. For items 2, 4, 6, 8 and 10, a point is 5 minus the answer. The score is the sum of the ten points times 2.5, from 0 to 100.

```ts
export function susScore(values: Record<string, unknown>): number | null {
  let sum = 0;
  for (let item = 1; item <= 10; item += 1) {
    const answer = Number(values[`sus${item}`]);
    if (!Number.isInteger(answer) || answer < 1 || answer > 5) return null;
    sum += item % 2 === 1 ? answer - 1 : 5 - answer;
  }
  return sum * 2.5;
}
```

A score is a comparison between releases or groups. Use one SUS per test session, after the tasks.

## Rotate the design preference test

`design-preference-test` asks for a preference, then for up to five reaction words per design, then for the reason. Compare the word counts of each design, not only those of the winner. The picture options are neutral wireframes of one page. Replace the three `image` URLs with your own designs.

Core does not shuffle options. A fixed order favors the first design. Publish three copies of the definition and give each respondent one of them in turn: A, B, C in the first, B, C, A in the second and C, A, B in the third. Reorder the `options` of `choice` and the `design` sections of the `words` step in the same way. Keep the option values and the field keys, so all copies produce the same payload.

Reaction words follow the Desirability Toolkit of Benedek and Miner (2002). The list has 12 words, half of them negative, as [Nielsen Norman Group recommends](https://www.nngroup.com/articles/microsoft-desirability-toolkit/). Edit the words to fit your designs.

## Sources

- Brooke, J. (1996). SUS: A quick and dirty usability scale. In *Usability Evaluation in Industry*, Taylor & Francis, 189 to 194.
- Finstad, K. (2006). The System Usability Scale and non-native English speakers. *Journal of Usability Studies*, 1(4), 185 to 188.
- Benedek, J. and Miner, T. (2002). Measuring desirability: new methods for evaluating desirability in a usability lab setting. Microsoft, Proceedings of UPA 2002.
