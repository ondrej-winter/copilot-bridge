# Tooling & CI Conventions (TypeScript)

## Local Quality Gate (must pass before creating PR)
Run this workflow at the end of each coding session when code has been changed, and always before handoff.

When validating changes, use this order:

1. **Compile TypeScript**
   - `npm run compile`

2. **Lint + Auto-fix**
   - `npm run lint:fix` (if available)

3. **Lint (no auto-fixes)**
   - `npm run lint`

4. **Type check**
   - `tsc --noEmit` (if not covered by compile step)

5. **Tests**
   - `npm test`

## Expectations
- Generated code MUST compile without errors (`npm run compile`).
- Code MUST satisfy linting rules (`npm run lint`) with zero violations.
- If you change behavior, you MUST add/adjust tests and run `npm test`.
- Do not disable lint rules unless explicitly requested; prefer refactoring.
- CI failures must be fixed at the root cause.

## Usage clarifications
- Run the full quality gate before handoff, even if only a single file changed.
- If a change impacts only a subset of tests, run that subset first,
  but still complete the full suite before handoff.
- For flaky or slow tests, document the reason and mitigation in the handoff notes.
- If any step fails, address the underlying issue rather than proceeding to the next step.

## Architecture validation
- If a change crosses layers, include tests that prove boundary adherence (ports invoked, adapters wired).
- Document any intentional rule exceptions in the PR description and handoff notes.

## TypeScript-specific tooling
- **Compiler**: `tsc` for type checking and compilation
- **Linter**: ESLint for code quality
- **Formatter**: Prettier (usually integrated with ESLint)
- **Test runner**: Jest or Mocha
- **Package manager**: npm or pnpm

## Common npm scripts
- `npm run compile`: Compile TypeScript to JavaScript
- `npm run watch`: Watch mode for development
- `npm run lint`: Run linter
- `npm run lint:fix`: Auto-fix linting issues
- `npm test`: Run test suite
- `npm run pretest`: Pre-test setup (usually runs compile)
