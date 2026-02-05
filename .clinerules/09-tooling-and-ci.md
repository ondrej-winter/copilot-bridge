# Tooling & CI Conventions (TypeScript)

## Local Quality Gate (must pass before creating PR)
Run this workflow at the end of each coding session when code has been changed, and always before handoff.

When validating changes, use this order:

1. **Compile TypeScript**
   - `npm run compile`

2. **Format + Lint + Auto-fix**
   - `npm run check:fix`

3. **Format + Lint (check only, no auto-fixes)**
   - `npm run check`

4. **Tests**
   - `npm test`

## Expectations
- Generated code MUST compile without errors (`npm run compile`).
- Code MUST pass Biome checks (`npm run check`) with zero violations.
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
- **Formatter & Linter**: Biome (all-in-one toolchain)
- **Test runner**: Vitest
- **Package manager**: npm

## Common npm scripts
- `npm run compile`: Compile TypeScript to JavaScript
- `npm run watch`: Watch mode for development
- `npm run format`: Format code with Biome
- `npm run format:check`: Check formatting without changes
- `npm run lint`: Lint code with Biome
- `npm run lint:fix`: Auto-fix linting issues
- `npm run check`: Run format + lint checks (combined)
- `npm run check:fix`: Auto-fix format + lint issues (combined)
- `npm test`: Run test suite
- `npm run pretest`: Pre-test setup (runs compile)
