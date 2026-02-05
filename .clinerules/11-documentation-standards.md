# Documentation standards: clear, concise, no fluff

Use these rules to keep documentation helpful without being verbose.

## Module docstrings (file-level comments)
- **One line** stating the module's purpose
- No bullet lists, feature descriptions, or implementation notes
- Examples belong in README or function/class documentation

## Class docstrings (TSDoc)
- **One line** stating what the class does
- Add a second sentence only if it clarifies a non-obvious distinction
- No feature lists or implementation details

### Example
```typescript
/**
 * Adapter for VS Code Language Model API
 */
export class VSCodeLanguageModelAdapter implements LanguageModelPort {
  // ...
}
```

## Method/function docstrings (TSDoc)
- **Brief description**: One sentence; omit period for single sentences
- **@param**: `name - Brief description` (no "The" prefix, no full sentences)
- **@returns**: Brief description of what's returned
- **@throws**: Only document exceptions that callers should handle

### Example
```typescript
/**
 * Selects a chat model from available Copilot models
 * @param family - Optional model family to filter by
 * @returns Selected language model instance
 * @throws Error if no models are available
 */
async function selectChatModel(family?: string): Promise<vscode.LanguageModelChat> {
  // ...
}
```

## Inline comments
- Use sparingly for non-obvious logic only
- Prefer self-documenting code (clear names, simple logic)
- Never state the obvious

### Examples
```typescript
// ❌ Bad: Obvious
// Loop through messages
for (const msg of messages) { }

// ✅ Good: Explains non-obvious behavior
// Prepend system message to first user message (API limitation)
if (!userMessagesStarted && systemMessage) { }
```

## Interface/Type documentation
- **Should** document interfaces used as public contracts (ports, DTOs)
- **Should** skip documentation for self-explanatory types
- **Must** document non-obvious fields or constraints

### Example
```typescript
/**
 * Configuration for HTTP server adapter
 */
interface ServerConfig {
  /** Port number (1-65535) */
  port: number;
  /** Localhost bind address */
  bindAddress: string;
  /** Optional bearer token for authentication (empty = no auth) */
  token: string;
}
```

## What NOT to document in code
- ❌ Feature lists → belongs in README
- ❌ Architecture patterns → belongs in ADRs
- ❌ Performance claims → belongs in benchmarks/docs
- ❌ Marketing language ("rich", "powerful", "advanced")
- ❌ Redundant restatements of parameter names
- ❌ Change history → belongs in git commits

## README documentation
- **Must** include: Purpose, installation, usage, configuration, examples
- **Should** keep examples practical and runnable
- **Should** document API endpoints and request/response formats
- **Should** include troubleshooting section for common issues

## TSDoc conventions
- Use `@param` for parameters
- Use `@returns` for return values
- Use `@throws` for exceptions
- Use `@example` for code examples (optional)
- Use `@deprecated` for deprecated APIs
- Use `@internal` for internal-only APIs
