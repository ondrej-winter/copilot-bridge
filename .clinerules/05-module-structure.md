# Module structure and file organization

Use these rules to keep files focused, navigable, and easy to maintain.

## File size limits
- **Must** keep individual files under 300 lines when possible.
- **Should** split files exceeding 400 lines into focused modules.
- **Must** split files exceeding 600 lines unless there's a strong justification.

## Module organization principles
- **Should** use directories with multiple files instead of large single-file modules.
- **Must** use `index.ts` to expose public API; keep internal implementation private (no export).
- **Should** group related classes/functions by responsibility, not by type.
- **Must** keep one primary class/responsibility per file when splitting modules.

## Naming conventions for split modules
- Module directory: `kebab-case/` or `camelCase/` (e.g., `http-server/`, `chatProcessor/`)
- Main file: semantic name (e.g., `server.ts`, `adapter.ts`, `processor.ts`) - avoid redundant naming
- Supporting files: `types.ts`, `validation.ts`, `routes.ts`, `mappers.ts`, `utils.ts`, etc.
- **Must** avoid redundant naming (use `http-server/server.ts`, not `http-server/http-server.ts`)

## Splitting strategies
- **Orchestration vs. implementation**: Main class in one file, helpers in others
- **By responsibility**: validators, formatters, handlers, serializers
- **By domain concept**: Each domain model in its own file
- **By layer concern**: Types, logic, utilities separate

## Import management after splits
- **Must** update `index.ts` to maintain backward compatibility during refactoring.
- **Should** use relative imports within the same package.
- **Must** keep public API stable; internal reorganization should be transparent to consumers.

## Barrel exports (index.ts)
- **Must** re-export public classes/functions from subdirectory `index.ts` to parent `index.ts`
- **Should** use named exports, avoid default exports for better IDE support
- **Should** keep imports short and clean by leveraging the re-export chain
- **Must** avoid forcing consumers to import from deeply nested paths

### Re-export pattern
```typescript
// Innermost: submodule/index.ts
export { CacheAdapter } from './adapter';
export { CacheConfig } from './types';

// Parent: parent/index.ts
export { CacheAdapter, CacheConfig } from './cache';
export { DatabaseAdapter } from './database';
```

### Example: adapters structure
```typescript
// adapters/output/language-model/index.ts
export { VSCodeLanguageModelAdapter } from './adapter';
export type { ModelSelection } from './types';

// adapters/output/index.ts
export { VSCodeLanguageModelAdapter } from './language-model';
export { VSCodeConfigAdapter } from './configuration';

// Usage (clean, short import)
import { VSCodeLanguageModelAdapter } from './adapters/output';
```

## When NOT to split
- Files under 200 lines that are cohesive and focused: keep them as-is.
- Simple value objects, enums, or types: group related ones together.
- Tightly coupled logic that would be harder to understand when separated.

## TypeScript-specific patterns
- **Must** export types and interfaces separately from implementations when needed.
- **Should** use `type` or `interface` files for shared types across modules.
- **Should** avoid circular dependencies; use dependency inversion if needed.
- **Must** ensure `index.ts` only re-exports, no logic inside.
