# DiverPro repository instructions

## WebApp versioning

The WebApp version in `web/package.json` is the only version source; the footer reads it automatically.

- For every new user-facing function that does not break the product architecture, run `npm run version:func` from `web` before the final build. This increments the last number (`1.0.0` → `1.0.1`).
- For a major or architecture-breaking function, run `npm run version:major` from `web` before the final build. This increments the first number and resets the others (`1.4.7` → `2.0.0`).
- Styling fixes, copy edits, tests, refactors and bug fixes without a new function do not change the WebApp version.
- Never hard-code a second version in the UI.
