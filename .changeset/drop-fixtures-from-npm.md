---
"@formhaus/core": patch
---

Fixtures are no longer published to npm. They were demo data for the docs/playground, not part of the public API, and the only way to import them (`@formhaus/core/fixtures/*.json`) was already broken under strict ESM resolution because they were never in the `exports` map.

The Quick Start guide now shows a literal definition object instead of an import. The fixtures themselves stay in the repo for the playground and tests.
