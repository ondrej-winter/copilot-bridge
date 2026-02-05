# TypeScript coding standards: naming, formatting, types, error handling, logging

Use these rules for all TypeScript code in this repo to keep behavior predictable and reviews lightweight.

## Naming
- **Files/modules**: `camelCase.ts` or `kebab-case.ts` (e.g., `chatProcessor.ts`, `http-server.ts`).
- **Directories**: `kebab-case` or `camelCase` (e.g., `language-model/`, `adapters/`).
- **Interfaces**: `PascalCase` with descriptive nouns (e.g., `ChatMessage`, `LanguageModelPort`).
- **Types**: `PascalCase` (e.g., `MessageRole`, `ChatRequest`).
- **Classes**: `PascalCase` nouns (e.g., `HttpServer`, `ModelSelector`).
- **Functions/methods**: `camelCase` verbs (e.g., `processChatRequest`, `selectModel`).
- **Variables**: `camelCase` (e.g., `requestId`, `outputText`).
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`, `DEFAULT_PORT`).
- **Private members**: prefix with `_` only if necessary to avoid naming conflicts (e.g., `_internalCache`).
- **Tests**: `describe('ClassName')` and `it('should do something')` focused on behavior.

## Formatting
- **Must** use Biome for formatting and linting; do not hand-format or fight the formatter.
- **Must** run `npm run check:fix` to auto-fix formatting and linting issues before committing.
- Prefer explicit, readable code over clever one-liners.

## Type Safety
- **Must** enable strict mode in `tsconfig.json` (`"strict": true`).
- **Must** avoid `any` type unless absolutely necessary; prefer `unknown` for uncertain types.
- **Must** define explicit return types for public functions/methods.
- **Should** use `interface` for object shapes that may be extended; use `type` for unions, intersections, or aliases.
- **Must** use `readonly` for properties that shouldn't be mutated.
- **Should** use enums or string literal unions for fixed sets of values.
- **Must** avoid type assertions (`as Type`) unless you have verified the type safety.

## Boundary behavior (adapter input validation)
- Validate and normalize external inputs at **adapter boundaries** before calling application ports.
- Keep **mapping** between external schemas and DTOs/domain objects inside adapters.
- For broader hexagonal boundary doctrine, see `02-architecture-guardrails.md`.

## Error handling
- **Must** define domain-specific error classes (extending `Error`) in `domain/exceptions.ts`.
- **Never** use bare `catch (err)` without typing; use `catch (err: unknown)` and check type.
- **Must** preserve error context when re-throwing:
  ```typescript
  throw new DomainError('Failed to process request', { cause: err });
  ```
- Validate inputs at module boundaries (e.g., adapters) and fail fast with clear errors.
- **Should** avoid returning `null` or `undefined` for error states; throw exceptions or use Result types.
- Translate exceptions at the **adapter boundary** into the caller's domain (CLI/HTTP response) without leaking internal types.

## Async/await
- **Must** use `async/await` over raw Promises for readability.
- **Must** handle Promise rejections explicitly; don't let them silently fail.
- **Should** use `Promise.all()` for parallel operations when order doesn't matter.

## Logging
- Use a configured logger (e.g., VS Code `OutputChannel`, Winston, Pino) — **no `console.log()`** in production code.
- Levels:
  - `debug`: noisy diagnostics
  - `info`: flow milestones
  - `warning`: recoverable issues
  - `error`: operation failures
- Include structured context when possible (request IDs, adapter name).
- Use logger with error object when logging exceptions to capture stack traces.
- Log boundary crossings at `info` with structured context.

## Null safety
- **Should** enable `strictNullChecks` in `tsconfig.json`.
- **Should** use optional chaining (`?.`) and nullish coalescing (`??`) where appropriate.
- **Must** handle `null`/`undefined` explicitly rather than assuming values exist.
