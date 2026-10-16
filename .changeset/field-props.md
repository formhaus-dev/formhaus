---
"@formhaus/core": minor
---

- Fields accept `props`, an object of settings for a custom field type. Renderers pass it to the component as `field.props`.
- Definition format 1.2 adds `props`. `FORMAT_VERSION` is `"1.2"`. 1.0 and 1.1 definitions are still accepted. The runtime changes listed in the 0.15 migration guide, such as restored start values and `null` numbers, apply to them too.
